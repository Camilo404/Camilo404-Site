import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewEncapsulation, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanyardService } from 'src/app/services/lanyard.service';
import { TimestampsService } from 'src/app/services/timestamps.service';
import { Activity } from 'src/app/models/lanyard-profile.model';
import { Subscription, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-floating-activity',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './floating-activity.component.html',
  styleUrls: ['./floating-activity.component.scss'],
  encapsulation: ViewEncapsulation.None,
  styles: [`
    app-floating-activity {
      display: block;
      width: 100%;
    }
  `]
})
export class FloatingActivityComponent implements OnInit, OnDestroy {
  @Input() isMobileEmbedded: boolean = false;
  
  activities: Activity[] = [];
  currentIndex = 0;
  isSwitching = false;
  
  percentage = 0;
  currentTime = '0:00';
  totalDuration = '0:00';

  private destroy$ = new Subject<void>();
  private activitiesSubscription: Subscription = new Subscription();
  private userId = environment.discordId;

  constructor(
    private lanyardService: LanyardService,
    private timestampsService: TimestampsService,
    private cdr: ChangeDetectorRef
  ) {}

  get currentActivity(): Activity | null {
    return this.activities[this.currentIndex] || null;
  }

  get nextActivity(): Activity | null {
    if (this.activities.length < 2) return null;
    const nextIndex = (this.currentIndex + 1) % this.activities.length;
    return this.activities[nextIndex];
  }

  get isSpotify(): boolean {
    const activity = this.currentActivity;
    return !!activity && (activity.name === 'Spotify' || activity.id === 'spotify:1');
  }

  ngOnInit(): void {
    this.lanyardService.getLanyardData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const allActivities = data?.d?.activities || [];
        
          this.activities = allActivities.filter(a => a.id !== 'custom');
          
          if (this.activities.length === 0) {
            this.currentIndex = 0;
            this.processCurrentActivity();
          } else {
            if (this.currentIndex >= this.activities.length) {
              this.currentIndex = 0;
            }
            
            this.processCurrentActivity();
          }
          
          this.cdr.markForCheck();
        },
        error: (err) => console.error('Error in floating activity:', err)
      });
  }

  cycleActivity(): void {
    if (this.activities.length < 2 || this.isSwitching) return;

    this.isSwitching = true;
    this.cdr.markForCheck();

    setTimeout(() => {
      this.currentIndex = (this.currentIndex + 1) % this.activities.length;
      this.isSwitching = false;
      this.processCurrentActivity();
      this.cdr.markForCheck();
    }, 300);
  }

  private processCurrentActivity(): void {
    this.activitiesSubscription.unsubscribe();
    this.activitiesSubscription = new Subscription();

    const activity = this.currentActivity;

    if (!activity) {
      this.percentage = 0;
      this.currentTime = '0:00';
      this.totalDuration = '0:00';
      return;
    }

    if (activity.timestamps) {
      const { start, end } = activity.timestamps;

      if (end) {
        const progressSub = this.timestampsService.getProgressPercentage(start, end)
          .pipe(takeUntil(this.destroy$))
          .subscribe(percentage => {
            this.percentage = percentage;
            this.cdr.markForCheck();
          });
        this.activitiesSubscription.add(progressSub);

        this.totalDuration = this.timestampsService.getTotalDuration(start, end);
      } else {
        this.percentage = 0;
        this.totalDuration = '';
      }

      const elapsedSub = this.timestampsService.getElapsedTime(start)
        .pipe(takeUntil(this.destroy$))
        .subscribe(time => {
          this.currentTime = time;
          this.cdr.markForCheck();
        });
      this.activitiesSubscription.add(elapsedSub);
    }
  }

  getActivityImage(activity: Activity): string {
    if (!activity || !activity.assets) return '';

    if (activity.assets.large_image) {
      if (activity.assets.large_image.startsWith('spotify:')) {
        return `https://i.scdn.co/image/${activity.assets.large_image.split(':')[1]}`;
      }
      if (activity.assets.large_image.startsWith('mp:external/')) {
         return `https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets.large_image}.png`;
      }
      return `https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets.large_image}.png`;
    }
    
    return '';
  }
  
  getSmallActivityImage(activity: Activity): string {
     if (!activity || !activity.assets || !activity.assets.small_image) return '';
     
     if (activity.assets.small_image.startsWith('spotify:')) {
        return `https://i.scdn.co/image/${activity.assets.small_image.split(':')[1]}`;
     }
     return `https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets.small_image}.png`;
  }

  handleImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    target.src = 'assets/images/no-image-found.jpg';
    target.style.display = 'none';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.activitiesSubscription.unsubscribe();
  }
}
