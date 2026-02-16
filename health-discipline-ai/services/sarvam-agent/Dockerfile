FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# LiveKit agent worker — connects to LiveKit server via WebSocket
# and waits for room dispatch events
CMD ["python", "agent.py", "start"]
