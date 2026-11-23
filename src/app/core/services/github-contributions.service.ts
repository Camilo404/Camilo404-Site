import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';

export interface ContributionDay {
  date: string;
  count: number;
  /** 0–4, GitHub's own intensity buckets */
  level: number;
}

export interface Contributions {
  total: number;
  days: ContributionDay[];
}

interface ApiResponse {
  total: { lastYear?: number };
  contributions: ContributionDay[];
}

/**
 * GitHub has no unauthenticated contributions endpoint, so this goes through
 * the public github-contributions-api (scrapes the profile calendar, CORS open).
 * Errors resolve to null so the UI can simply hide the section.
 */
@Injectable({ providedIn: 'root' })
export class GithubContributionsService {
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<string, Observable<Contributions | null>>();

  getLastYear(user: string): Observable<Contributions | null> {
    let req = this.cache.get(user);
    if (!req) {
      req = this.http
        .get<ApiResponse>(`https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(user)}?y=last`)
        .pipe(
          map((r) => ({ total: r.total?.lastYear ?? 0, days: r.contributions ?? [] })),
          catchError(() => of(null)),
          shareReplay(1),
        );
      this.cache.set(user, req);
    }
    return req;
  }
}
