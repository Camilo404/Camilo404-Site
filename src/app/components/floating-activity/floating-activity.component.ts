import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewEncapsulation, Input, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanyardService } from 'src/app/services/lanyard.service';
import { TimestampsService } from 'src/app/services/timestamps.service';
import { LyricsService, LyricLine } from 'src/app/services/lyrics.service';
import { Activity } from 'src/app/models/lanyard-profile.model';
import { Subscription, Subject, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
export class FloatingActivityComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input() isMobileEmbedded: boolean = false;
  @ViewChild('lyricsContainer') lyricsContainer!: ElementRef;
  
  activities: Activity[] = [];
  currentIndex = 0;
  isSwitching = false;
  
  percentage = 0;
  currentTime = '0:00';
  totalDuration = '0:00';

  // Lyrics State
  showLyrics = false;
  lyrics: LyricLine[] = [];
  currentLineIndex = -1;
  lyricsLoading = false;
  private lastTrackId: string | null = null;
  private lyricsSyncSubscription: Subscription = new Subscription();

  private destroy$ = new Subject<void>();
  private activitiesSubscription: Subscription = new Subscription();

  constructor(
    private lanyardService: LanyardService,
    private timestampsService: TimestampsService,
    private lyricsService: LyricsService,
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

  ngAfterViewChecked(): void {
    if (this.showLyrics && this.currentLineIndex !== -1) {
       // Logic to maintain scroll position if needed during updates
       // Currently handled by scrollToActiveLine called on updates
    }
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

  toggleLyrics(event: Event): void {
    event.stopPropagation();
    this.showLyrics = !this.showLyrics;
    if (this.showLyrics) {
       setTimeout(() => this.scrollToActiveLine(), 100);
    }
    this.cdr.markForCheck();
  }

  private processCurrentActivity(): void {
    this.activitiesSubscription.unsubscribe();
    this.activitiesSubscription = new Subscription();
    this.lyricsSyncSubscription.unsubscribe();

    const activity = this.currentActivity;

    if (!activity) {
      this.percentage = 0;
      this.currentTime = '0:00';
      this.totalDuration = '0:00';
      this.lyrics = [];
      this.currentLineIndex = -1;
      this.lastTrackId = null;
      return;
    }

    if (this.isSpotify) {
      this.handleSpotifyLyrics(activity);
    } else {
      if (this.lastTrackId) {
         this.lyrics = [];
         this.currentLineIndex = -1;
         this.lastTrackId = null;
         this.showLyrics = false; 
      }
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

  private handleSpotifyLyrics(activity: Activity): void {
     const trackId = activity.sync_id || activity.details || '';
     
     // Fetch lyrics only if track changed
     if (this.lastTrackId !== trackId) {
        this.lastTrackId = trackId;
        this.lyrics = [];
        this.currentLineIndex = -1;
        this.lyricsLoading = true;
        
        const durationSeconds = activity.timestamps?.end 
           ? Math.floor((activity.timestamps.end - activity.timestamps.start) / 1000) 
           : 0;

        this.lyricsService.getLyrics(
           activity.details || '',
           activity.state || '',
           activity.assets?.large_text || '',
           durationSeconds
        ).pipe(takeUntil(this.destroy$)).subscribe(lyrics => {
           this.lyrics = lyrics;
           this.lyricsLoading = false;
           this.cdr.markForCheck();
        });
     }

     // Start Sync Loop
     if (activity.timestamps?.start) {
        this.lyricsSyncSubscription = timer(0, 200).pipe(
           takeUntil(this.destroy$)
        ).subscribe(() => {
           if (!this.lyrics.length) return;
           
           const elapsedMs = Date.now() - activity.timestamps!.start;
           this.updateCurrentLine(elapsedMs);
        });
        this.activitiesSubscription.add(this.lyricsSyncSubscription);
     }
  }

  private updateCurrentLine(elapsedMs: number): void {
     let activeIndex = -1;
     for (let i = 0; i < this.lyrics.length; i++) {
        if (elapsedMs >= this.lyrics[i].time) {
           activeIndex = i;
        } else {
           break;
        }
     }
     
     if (this.currentLineIndex !== activeIndex) {
        this.currentLineIndex = activeIndex;
        this.scrollToActiveLine();
        this.cdr.markForCheck();
     }
  }

  private scrollToActiveLine(): void {
     if (!this.lyricsContainer || this.currentLineIndex === -1) return;
     
     const container = this.lyricsContainer.nativeElement as HTMLElement;
     const activeLineElement = container.children[this.currentLineIndex] as HTMLElement;
     
     if (activeLineElement) {
        const containerHeight = container.clientHeight;
        const lineTop = activeLineElement.offsetTop;
        const lineHeight = activeLineElement.clientHeight;
        
        // Center the active line
        const scrollTarget = lineTop - (containerHeight / 2) + (lineHeight / 2);
        
        container.scrollTo({
           top: scrollTarget,
           behavior: 'smooth'
        });
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
    this.lyricsSyncSubscription.unsubscribe();
  }
}
