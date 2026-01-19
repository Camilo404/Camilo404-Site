import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanyardService } from 'src/app/services/lanyard.service';
import { TimestampsService } from 'src/app/services/timestamps.service';
import { Activity } from 'src/app/models/lanyard-profile.model';
import { Subscription, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-mobile-activity',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mobile-activity.component.html',
  styleUrls: ['./mobile-activity.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MobileActivityComponent implements OnInit, OnDestroy {
  spotifyActivity: Activity | null = null;
  percentage = 0;
  isVisible = false;
  
  currentTime = '0:00';
  totalDuration = '0:00';

  private destroy$ = new Subject<void>();
  private activitiesSubscription: Subscription = new Subscription();

  constructor(
    private lanyardService: LanyardService,
    private timestampsService: TimestampsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.lanyardService.getLanyardData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const activities = data?.d?.activities || [];
          const spotify = activities.find(a => a.name === 'Spotify' || a.id === 'spotify:1');
          
          if (spotify) {
            const oldId = this.spotifyActivity?.sync_id;
            this.spotifyActivity = spotify;
            this.isVisible = true;
            
            if (oldId !== spotify.sync_id) {
               this.processSpotifyActivity();
            }
          } else {
            this.spotifyActivity = null;
            this.isVisible = false;
            this.percentage = 0;
            this.currentTime = '0:00';
            this.totalDuration = '0:00';
            this.activitiesSubscription.unsubscribe();
          }
          
          this.cdr.markForCheck();
        },
        error: (err) => console.error('Error in mobile activity:', err)
      });
  }

  private processSpotifyActivity(): void {
    this.activitiesSubscription.unsubscribe();
    this.activitiesSubscription = new Subscription();

    if (this.spotifyActivity && this.spotifyActivity.timestamps) {
      const { start, end } = this.spotifyActivity.timestamps;

      // Progress percentage
      const progressSub = this.timestampsService.getProgressPercentage(start, end)
        .pipe(takeUntil(this.destroy$))
        .subscribe(percentage => {
          this.percentage = percentage;
          this.cdr.markForCheck();
        });
      this.activitiesSubscription.add(progressSub);

      // Elapsed Time
      const elapsedSub = this.timestampsService.getElapsedTime(start)
        .pipe(takeUntil(this.destroy$))
        .subscribe(time => {
          this.currentTime = time;
          this.cdr.markForCheck();
        });
      this.activitiesSubscription.add(elapsedSub);

      // Total Duration
      this.totalDuration = this.timestampsService.getTotalDuration(start, end);
    }
  }

  getActivityImageId(imageUrl: string | undefined): string {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('spotify:')) {
      return imageUrl.split(':')[1];
    }
    return imageUrl;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.activitiesSubscription.unsubscribe();
  }
}
