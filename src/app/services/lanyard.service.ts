import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { Lanyard } from '../models/lanyard-profile.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LanyardService {

  private webSocketUrl = 'wss://api.lanyard.rest/socket';
  private socket?: WebSocket;

  private dataInitial = {
    op: 2,
    d: {
      subscribe_to_id: environment.discordId
    }
  };

  private heartbeat_interval: number = 30000;
  private heartbeat: any;

  private lanyardData = new Subject<Lanyard>();

  constructor(private http: HttpClient) { }

  public setupWebSocket(): void {
    this.socket = new WebSocket(this.webSocketUrl);

    this.socket.onopen = () => {
      this.socket?.send(JSON.stringify(this.dataInitial));

      this.heartbeat = setInterval(() => {
        this.socket?.send(JSON.stringify({ op: 3 }));
      }, this.heartbeat_interval);
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      this.heartbeat_interval = data.d.heartbeat_interval;

      if (data.t === 'INIT_STATE') {
        this.setLanyardData(data);
      }

      if (data.t === 'PRESENCE_UPDATE') {
        this.setLanyardData(data);
      }
    };

    this.socket.onclose = () => {
      clearInterval(this.heartbeat);

      setTimeout(() => {
        this.setupWebSocket();
      }, 5000);
    };
  }

  public setLanyardData(data: Lanyard): void {
    this.lanyardData.next(data);
  }

  public getLanyardData(): Observable<Lanyard> {
    return this.lanyardData.asObservable();
  }
}
