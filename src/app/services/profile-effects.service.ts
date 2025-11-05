import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ProfileEffectsResponse, ProfileEffectConfig } from '../models/discord-profile.model';

@Injectable({
  providedIn: 'root'
})
export class ProfileEffectsService {
  private readonly EFFECTS_API_URL = 'https://discord.com/api/v9/user-profile-effects';
  private effectsCache: ProfileEffectConfig[] | null = null;

  constructor(private http: HttpClient) { }

  getAllEffects(): Observable<ProfileEffectConfig[]> {
    if (this.effectsCache) {
      return of(this.effectsCache);
    }

    return this.http.get<ProfileEffectsResponse>(this.EFFECTS_API_URL).pipe(
      map(response => {
        this.effectsCache = response.profile_effect_configs || [];
        return this.effectsCache;
      }),
      catchError(error => {
        console.error('Error fetching profile effects:', error);
        return of([]);
      })
    );
  }

  getEffectById(effectId: string): Observable<ProfileEffectConfig | null> {
    return this.getAllEffects().pipe(
      map(effects => {
        const effect = effects.find(e => e.id === effectId);
        return effect || null;
      })
    );
  }
}

