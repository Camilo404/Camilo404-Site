import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, of, catchError } from 'rxjs';

export interface LyricLine {
  time: number; // in milliseconds
  text: string;
}

export interface LrcLibResponse {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  plainLyrics: string;
  syncedLyrics: string; // Returns as LRC string: "[mm:ss.xx] text"
}

@Injectable({
  providedIn: 'root'
})
export class LyricsService {
  private apiUrl = 'https://lrclib.net/api/get';

  constructor(private http: HttpClient) {}

  getLyrics(trackName: string, artistName: string, albumName: string, duration: number): Observable<LyricLine[]> {
    const params = new HttpParams()
      .set('track_name', trackName)
      .set('artist_name', artistName)
      .set('album_name', albumName)
      .set('duration', duration.toString());

    return this.http.get<LrcLibResponse>(this.apiUrl, { params }).pipe(
      map(response => {
        if (response.syncedLyrics) {
          return this.parseSyncedLyrics(response.syncedLyrics);
        } else if (response.plainLyrics) {
            return response.plainLyrics.split('\n').map(line => ({ time: 0, text: line }));
        }
        return [];
      }),
      catchError(error => {
        console.error('Error fetching lyrics:', error);
        return of([]);
      })
    );
  }

  private parseSyncedLyrics(lrc: string): LyricLine[] {
    const lines = lrc.split('\n');
    const lyrics: LyricLine[] = [];
    const timeRegex = /^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;

    for (const line of lines) {
      const match = line.match(timeRegex);
      if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const milliseconds = parseInt(match[3].padEnd(3, '0'), 10); // Ensure 3 digits for ms
        
        const totalTimeMs = (minutes * 60 * 1000) + (seconds * 1000) + milliseconds;
        const text = match[4].trim();

        if (text) {
            lyrics.push({ time: totalTimeMs, text });
        }
      }
    }

    return lyrics;
  }
}
