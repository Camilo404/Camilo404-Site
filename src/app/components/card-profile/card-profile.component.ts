import { Component, Input, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { DiscordApiService } from 'src/app/services/discord-api.service';
import { Profile } from 'src/app/models/discord-profile.model';
import { LanyardService } from 'src/app/services/lanyard.service';
import { Lanyard, Activity } from 'src/app/models/lanyard-profile.model';
import { TimestampsService } from 'src/app/services/timestamps.service';
import { environment } from 'src/environments/environment';
import { toHTML } from 'discord-markdown-fix';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

declare global {
  interface Window {
    loadAtropos(): void;
  }
}

@Component({
  selector: 'app-card-profile',
  templateUrl: './card-profile.component.html',
  styleUrls: ['./card-profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardProfileComponent implements OnInit, OnDestroy {

  @Input() ProfileId: string = environment.discordId;
  userId = environment.discordId;
  apiUrl = environment.apiUrl;
  userDataStatus = false;
  userData?: Profile;
  userBioFormatted?: string;
  themesColor: string[] = [];

  message = '';
  lanyardData!: Lanyard | null;
  lanyardActivities: Activity[] = [];
  statusColor: string = '#43b581'
  percentage = 0;

  // Use takeUntil pattern for better subscription management
  private destroy$ = new Subject<void>();

  constructor(
    private discordApiService: DiscordApiService, 
    private lanyardService: LanyardService, 
    private timestampsService: TimestampsService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.getDiscordUserData();
    this.getLanyardData();
  }

  ngOnDestroy(): void {
    // Complete the destroy subject to unsubscribe from all observables
    this.destroy$.next();
    this.destroy$.complete();
  }

  public getDiscordUserData(): void {
    this.discordApiService.getDiscordUser(this.ProfileId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: Profile) => {
          this.userDataStatus = true;
          this.userData = data;

          // Format the user bio to HTML
          this.userBioFormatted = toHTML(this.userData.user_profile?.bio || '');

          const themeColors = this.userData.user_profile?.theme_colors || [];
          if (themeColors.length === 0) {
            this.themesColor = ['#5C5C5C', '#5C5C5C'];
          } else {
            // Convert the decimal color to hex
            this.themesColor = themeColors.map((color) => {
              return '#' + color.toString(16).padStart(6, '0').toUpperCase();
            });
          }
          
          // Trigger change detection
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.userDataStatus = false;
          console.error('Error fetching Discord user data:', error);
          this.cdr.markForCheck();
        },
        complete: () => {
          // Only call atropos after component is fully initialized
          if (typeof window !== 'undefined' && window.loadAtropos) {
            window.loadAtropos();
          }
        }
      });
  }

  public getLanyardData(): void {
    this.lanyardService.setInitialData(this.ProfileId);
    this.lanyardService.setupWebSocket();

    this.lanyardService.getLanyardData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.lanyardData = data;
          this.lanyardActivities = this.lanyardData.d?.activities || [];

          // Process activities with optimized subscription handling
          this.processActivities();
          this.updateStatusColor();
          
          // Trigger change detection
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error getting Lanyard data:', error);
          this.cdr.markForCheck();
        }
      });
  }

  private processActivities(): void {
    // Get the progress percentage and elapsed time for activities
    this.lanyardActivities.forEach((activity) => {
      if (activity.timestamps && activity.name === 'Spotify') {
        this.timestampsService.getProgressPercentage(activity.timestamps.start, activity.timestamps.end)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (percentage) => {
              this.percentage = percentage;
              this.cdr.markForCheck();
            }
          });

        this.timestampsService.getElapsedTime(activity.timestamps.start)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (timeElapsed) => {
              activity.timestamps!.start = timeElapsed;
              this.cdr.markForCheck();
            }
          });

        activity.timestamps!.end = this.timestampsService.getTotalDuration(activity.timestamps.start, activity.timestamps.end);
      }
      
      if (activity.timestamps && activity.name !== 'Spotify') {
        this.timestampsService.getElapsedTime(activity.timestamps.start)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (timeElapsed) => {
              activity.timestamps!.start = timeElapsed;
              this.cdr.markForCheck();
            }
          });
      }
    });
  }

  private updateStatusColor(): void {
    // Get the status color to apply to the platform svg
    switch (this.lanyardData?.d?.discord_status) {
      case 'online':
        this.statusColor = '#43b581';
        break;
      case 'idle':
        this.statusColor = '#faa61a';
        break;
      case 'dnd':
        this.statusColor = '#f04747';
        break;
      case 'offline':
        this.statusColor = '#747f8d';
        break;
      case 'streaming':
        this.statusColor = '#593695';
        break;
      case 'invisible':
        this.statusColor = '#747f8d';
        break;
      case 'unknown':
        this.statusColor = '#747f8d';
        break;
      default:
        this.statusColor = '#747f8d';
        break;
    }
  }

  getActivityImageId(imageUrl: string): string {
    if (imageUrl && imageUrl.startsWith('spotify:')) {
      const parts = imageUrl.split(':');
      return parts[1];
    } else {
      return imageUrl;
    }
  }

  public sendMessage(): void {
    window.open(`https://discord.com/users/${this.userId}`, '_blank');
    this.message = '';
  }

  handleImageError(event: any) {
    event.target.src = '../../../assets/images/no-image-found.jpg';
  }
}
