import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CloudTasksClient } from '@google-cloud/tasks';

@Injectable()
export class CloudTasksService {
  private readonly logger = new Logger(CloudTasksService.name);
  private client: CloudTasksClient | null = null;
  private queuePath: string = '';
  private targetUrl: string = '';
  private internalSecret: string = '';
  private enabled = false;

  constructor(private configService: ConfigService) {
    const projectId = this.configService.get<string>('GCP_PROJECT_ID');
    const location = this.configService.get<string>('CLOUD_TASKS_LOCATION');
    const queue = this.configService.get<string>('CLOUD_TASKS_QUEUE');
    this.targetUrl = this.configService.get<string>('API_BASE_URL', '');
    this.internalSecret = this.configService.get<string>('CLOUD_TASKS_INTERNAL_SECRET', '');

    if (projectId && location && queue) {
      this.client = new CloudTasksClient();
      this.queuePath = this.client.queuePath(projectId, location, queue);
      this.enabled = true;
      this.logger.log(`Cloud Tasks enabled: queue=${queue}, target=${this.targetUrl}`);
    } else {
      this.logger.warn('Cloud Tasks not configured (missing GCP_PROJECT_ID, CLOUD_TASKS_LOCATION, or CLOUD_TASKS_QUEUE)');
    }
  }

  /**
   * Enqueue a Cloud Task with an HTTP target.
   * Returns the task name on success, null if task already exists (dedup) or not enabled.
   */
  async enqueueTask(options: {
    url: string;
    payload: Record<string, any>;
    scheduleTime?: Date;
    taskId?: string;
  }): Promise<string | null> {
    if (!this.enabled || !this.client) {
      this.logger.warn('Cloud Tasks not enabled, skipping enqueue');
      return null;
    }

    const task: any = {
      httpRequest: {
        httpMethod: 'POST' as const,
        url: `${this.targetUrl}${options.url}`,
        headers: {
          'Content-Type': 'application/json',
          'X-CloudTasks-Secret': this.internalSecret,
        },
        body: Buffer.from(JSON.stringify(options.payload)).toString('base64'),
      },
    };

    if (options.scheduleTime) {
      task.scheduleTime = {
        seconds: Math.floor(options.scheduleTime.getTime() / 1000),
      };
    }

    // Task ID for dedup — Cloud Tasks rejects duplicates with ALREADY_EXISTS
    if (options.taskId) {
      task.name = `${this.queuePath}/tasks/${options.taskId}`;
    }

    try {
      const [response] = await this.client.createTask({
        parent: this.queuePath,
        task,
      });
      this.logger.log(`Task enqueued: ${response.name}`);
      return response.name || null;
    } catch (error: any) {
      // Code 6 = ALREADY_EXISTS — task ID already used (dedup)
      if (error.code === 6) {
        this.logger.debug(`Task already exists (dedup): ${options.taskId}`);
        return null;
      }
      this.logger.error(`Failed to enqueue task: ${error.message}`);
      throw error;
    }
  }

  /**
   * Enqueue a call task for a specific patient at a specific time.
   * Task ID prevents duplicate calls for the same patient+timing+date.
   */
  async enqueueCallTask(
    patientId: string,
    timing: string,
    scheduleTime: Date,
    dateKey: string,
  ): Promise<string | null> {
    return this.enqueueTask({
      url: '/api/v1/internal/trigger-call',
      payload: { patientId, timing },
      scheduleTime,
      taskId: `call-${dateKey}-${patientId}-${timing}`,
    });
  }

  /**
   * Enqueue a timeout task that fires 10 minutes after a call starts.
   * If the webhook arrives first, this task will find the call already completed and no-op.
   */
  async enqueueTimeoutTask(callId: string, scheduleTime: Date): Promise<string | null> {
    return this.enqueueTask({
      url: '/api/v1/internal/call-timeout',
      payload: { callId },
      scheduleTime,
      taskId: `timeout-${callId}`,
    });
  }

  /**
   * Enqueue a retry call task for a specific time.
   * Task ID includes retry count to prevent duplicate retries.
   */
  async enqueueRetryTask(
    patientId: string,
    callId: string,
    retryCount: number,
    scheduleTime: Date,
  ): Promise<string | null> {
    return this.enqueueTask({
      url: '/api/v1/internal/trigger-call',
      payload: { patientId, callId, isRetry: true },
      scheduleTime,
      taskId: `retry-${callId}-${retryCount}`,
    });
  }
}
