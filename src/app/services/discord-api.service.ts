import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Profile } from '../models/discord-profile.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DiscordApiService {

  urlDiscordApi: string = environment.apiUrl;

constructor(private http: HttpClient) { }

  getDiscordUser(id: string): Observable<Profile> {
    return this.http.get<Profile>(`${this.urlDiscordApi}user/${id}`);
  }
}
