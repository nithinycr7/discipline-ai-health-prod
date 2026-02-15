import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ElevenLabsService {
  private readonly logger = new Logger(ElevenLabsService.name);
  private apiKey: string;
  private cache = new Map<string, string>();

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ELEVENLABS_API_KEY', '');
  }

  async generateSpeech(
    text: string,
    voiceId: string,
    options: { speed?: number; language?: string } = {},
  ): Promise<string> {
    const cacheKey = `${voiceId}:${text}:${options.speed}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    if (!this.apiKey) {
      this.logger.warn('ElevenLabs API key not configured, returning placeholder');
      return 'https://placeholder-audio.example.com/greeting.mp3';
    }

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              speed: options.speed || 1.0,
            },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      // In production: store audio to S3 and return URL
      const audioUrl = `https://storage.example.com/audio/${Date.now()}.mp3`;
      this.cache.set(cacheKey, audioUrl);
      return audioUrl;
    } catch (error) {
      this.logger.error(`ElevenLabs TTS failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate speech and return raw audio buffer (for browser playback).
   */
  async generateSpeechBuffer(
    text: string,
    voiceId: string,
    options: { speed?: number } = {},
  ): Promise<Buffer> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            speed: options.speed || 1.0,
          },
        }),
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} - ${errText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async healthCheck(): Promise<{ status: string }> {
    if (!this.apiKey) return { status: 'not_configured' };

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/user', {
        headers: { 'xi-api-key': this.apiKey },
      });
      return { status: response.ok ? 'ok' : 'error' };
    } catch {
      return { status: 'error' };
    }
  }
}
