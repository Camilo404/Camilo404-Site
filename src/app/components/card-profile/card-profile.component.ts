import { Component, Input, OnInit } from '@angular/core';
import { DiscordApiService } from 'src/app/services/discord-api.service';
import { Profile } from 'src/app/models/discord-profile.model';
import { LanyardService } from 'src/app/services/lanyard.service';
import { Lanyard, Activity } from 'src/app/models/lanyard-profile.model';
import { TimestampsService } from 'src/app/services/timestamps.service';
import { environment } from 'src/environments/environment';
import { toHTML } from 'discord-markdown-fix';
import { Subscription } from 'rxjs';

declare global {
  interface Window {
    loadAtropos(): void;
  }
}

@Component({
  selector: 'app-card-profile',
  templateUrl: './card-profile.component.html',
  styleUrls: ['./card-profile.component.scss']
})
export class CardProfileComponent implements OnInit {

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

  subscriptions$: Subscription[] = []

  constructor(private discordApiService: DiscordApiService, private lanyardService: LanyardService, private TimestampsService: TimestampsService) { }

  ngOnInit(): void {
    this.getDiscordUserData();

    this.getLanyardData();
  }

  public getDiscordUserData(): void {
    this.discordApiService.getDiscordUser(this.ProfileId).subscribe({
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
      },
      error: (error) => {
        this.userDataStatus = false;
        console.log(error);
      }
    }).add(() => {
      window.loadAtropos();
    });
  }

  public getLanyardData(): void {
    this.lanyardService.setInitialData(this.ProfileId);
    this.lanyardService.setupWebSocket();

    this.lanyardService.getLanyardData().subscribe({
      next: (data) => {
        this.lanyardData = data;

        this.lanyardActivities = this.lanyardData.d?.activities || [];

        // Unsubscribe from previous subscriptions to avoid memory leaks and multiple subscriptions running at the same time
        if(this.subscriptions$.length > 0) {
          this.subscriptions$.forEach(sub => sub.unsubscribe());
        }

        // Get the progress percentage and elapsed time for the Spotify activity and other activities
        this.lanyardActivities.forEach((activity) => {
          if (activity.timestamps && activity.name === 'Spotify') {
            this.subscriptions$.push(this.TimestampsService.getProgressPercentage(activity.timestamps.start, activity.timestamps.end).subscribe({
              next: (percentage) => {
                console.log(percentage);
                this.percentage = percentage;
              }
            }));

            this.subscriptions$.push(this.TimestampsService.getElapsedTime(activity.timestamps.start).subscribe({
              next: (timeElapsed) => {
                activity.timestamps!.start = timeElapsed;
              }
            }));

            activity.timestamps!.end = this.TimestampsService.getTotalDuration(activity.timestamps.start, activity.timestamps.end);
          }
          
          if (activity.timestamps && activity.name !== 'Spotify') {
            this.subscriptions$.push(this.TimestampsService.getElapsedTime(activity.timestamps.start).subscribe({
              next: (timeElapsed) => {
                activity.timestamps!.start = timeElapsed;
              }
            }));
          }
        });

        // Get the status color to apply to the platform svg
        switch (this.lanyardData.d?.discord_status) {
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
      },
      error: (error) => {
        console.log(error);
      }
    });
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
