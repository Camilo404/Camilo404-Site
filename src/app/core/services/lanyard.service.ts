import { Injectable, signal, Signal } from '@angular/core';
import { Lanyard } from '../models/lanyard-profile.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LanyardService {

  private webSocketUrl = environment.webSocketUrl;
  private socket?: WebSocket;

  private dataInitial = {
    op: 2,
    d: {
      subscribe_to_id: environment.discordId
    }
  };

  private heartbeat_interval: number = 30000;
  private heartbeat: any;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private baseReconnectDelay = 1000; // 1 second

  private lanyardDataSignal = signal<Lanyard | null>(null);

  constructor() { }

  destroy() {
    this.cleanup();
  }

  public setInitialData(profileId: string): void {
    this.dataInitial.d.subscribe_to_id = profileId;
  }

  public setupWebSocket(): void {
    // Clean up existing connection if any
    this.cleanup();

    this.socket = new WebSocket(this.webSocketUrl);

    this.socket.onopen = () => {
      // Reset reconnect attempts on successful connection
      this.reconnectAttempts = 0;
      
      this.socket?.send(JSON.stringify(this.dataInitial));

      this.heartbeat = setInterval(() => {
        if (this.socket?.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify({ op: 3 }));
        }
      }, this.heartbeat_interval);
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.d?.heartbeat_interval) {
          this.heartbeat_interval = data.d.heartbeat_interval;
        }

        if (data.t === 'INIT_STATE' || data.t === 'PRESENCE_UPDATE') {
          this.setLanyardData(data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.socket.onclose = (event) => {
      this.cleanup();
      
      // Only attempt reconnection if it wasn't a manual close
      if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectWithBackoff();
      }
    };
  }

  private reconnectWithBackoff(): void {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    const delay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    setTimeout(() => {
      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        this.setupWebSocket();
      }
    }, delay);
  }

  private cleanup(): void {
    if (this.heartbeat) {
      clearInterval(this.heartbeat);
      this.heartbeat = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = undefined;
    }
  }

  public setLanyardData(data: Lanyard): void {
    this.lanyardDataSignal.set(data);
  }

  // Exponer el signal como readonly
  public getLanyardData(): Signal<Lanyard | null> {
    return this.lanyardDataSignal.asReadonly();
  }

  // Method to manually close the connection
  public disconnect(): void {
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
    this.cleanup();
  }
}
