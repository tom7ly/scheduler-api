import { v4 as uuidv4 } from 'uuid';

/**
 * [PATH] src/models/client.ts
 * This file contains the client model which represents a client connected to the server via WebSocket.
 */

export interface IClient {
  id: string;
  socket: WebSocket;
  isSocketOpen: () => boolean;
  sendMessage: (message: string) => void;
}

export class Client implements IClient {
  id: string;
  socket: WebSocket;

  constructor(socket: WebSocket) {
    this.id = uuidv4();
    this.socket = socket;
  }

  isSocketOpen(): boolean {
    return this.socket.readyState === WebSocket.OPEN;
  }

  sendMessage(message: string): void {
    if (this.isSocketOpen()) {
      this.socket.send(message);
    }
  }
}

export default Client;
