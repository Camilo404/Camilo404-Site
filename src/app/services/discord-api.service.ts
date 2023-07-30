import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Profile } from '../models/discord-profile.model';

@Injectable({
  providedIn: 'root'
})
export class DiscordApiService {

  urlDiscordApi: string = 'https://camilo404.azurewebsites.net/api/profile/'

constructor(private http: HttpClient) { }

  getDiscordUser(id: string): Observable<Profile> {
    return this.http.get<Profile>(this.urlDiscordApi + id);
  }
}
