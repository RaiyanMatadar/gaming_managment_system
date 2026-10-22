import { EventEmitter } from 'node:events';

class EventBroadcaster extends EventEmitter {
  constructor() {
    super();
    this.clients = new Set();
    this.heartbeatInterval = null;
  }

  /**
   * Registers a new SSE client connection.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  handleSSEConnection(req, res) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date() })}\n\n`);

    this.clients.add(res);

    req.on('close', () => {
      this.clients.delete(res);
      res.end();
    });

    // Start heartbeat if first client
    if (this.clients.size === 1 && !this.heartbeatInterval) {
      this.startHeartbeat();
    }
  }

  startHeartbeat(intervalMs = 30000) {
    this.heartbeatInterval = setInterval(() => {
      for (const client of this.clients) {
        client.write(': heartbeat\n\n');
      }
    }, intervalMs);
    // Unref so it doesn't prevent Node process exit in tests
    if (this.heartbeatInterval.unref) {
      this.heartbeatInterval.unref();
    }
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Broadcasts a real-time event to all connected cashier clients.
   * @param {string} eventType
   * @param {Object} payload
   */
  broadcast(eventType, payload) {
    this.emit(eventType, payload);

    const message = `event: ${eventType}\ndata: ${JSON.stringify({
      type: eventType,
      payload,
      timestamp: new Date()
    })}\n\n`;

    for (const client of this.clients) {
      try {
        client.write(message);
      } catch (err) {
        this.clients.delete(client);
      }
    }
  }

  getClientCount() {
    return this.clients.size;
  }

  reset() {
    this.stopHeartbeat();
    for (const client of this.clients) {
      try {
        client.end();
      } catch (e) {
        // ignore
      }
    }
    this.clients.clear();
    this.removeAllListeners();
  }
}

export const eventBroadcaster = new EventBroadcaster();
