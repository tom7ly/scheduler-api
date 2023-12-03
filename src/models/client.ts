// models/client.ts
import { v4 as uuidv4 } from 'uuid';

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
