import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { DiscordApiService } from 'src/app/services/discord-api.service';
import { Profile, ProfileEffectConfig, ProfileEffectLayer } from 'src/app/models/discord-profile.model';
import { LanyardService } from 'src/app/services/lanyard.service';
import { Lanyard, Activity } from 'src/app/models/lanyard-profile.model';
import { TimestampsService } from 'src/app/services/timestamps.service';
import { Card3DEffectService } from 'src/app/services/card-3d-effect.service';
import { ProfileEffectsService } from 'src/app/services/profile-effects.service';
import { environment } from 'src/environments/environment';
import { toHTML } from 'discord-markdown-fix';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-card-profile',
  templateUrl: './card-profile.component.html',
  styleUrls: ['./card-profile.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardProfileComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {

  @Input() ProfileId: string = environment.discordId;
  @Output() themeColorsChange = new EventEmitter<string[]>();
  @Output() nameplateAssetChange = new EventEmitter<string | null>();
  @ViewChild('cardElement', { static: false }) cardElement!: ElementRef;
  userId = environment.discordId;
  apiUrl = environment.apiUrl;
  userDataStatus = false;
  userData?: Profile;
  userBioFormatted?: string;
  themesColor: string[] = [];

  message = '';
  lanyardData!: Lanyard | null;

  // Clan/Primary Guild getters
  get clanTag(): string | null {
    return this.userData?.user?.clan?.tag || this.userData?.user?.primary_guild?.tag || null;
  }

  get clanBadge(): string | null {
    return this.userData?.user?.clan?.badge || this.userData?.user?.primary_guild?.badge || null;
  }

  get clanGuildId(): string | null {
    return this.userData?.user?.clan?.identity_guild_id || this.userData?.user?.primary_guild?.identity_guild_id || null;
  }

  get clanBadgeUrl(): string | null {
    if (!this.clanBadge || !this.clanGuildId) return null;
    return `https://cdn.discordapp.com/clan-badges/${this.clanGuildId}/${this.clanBadge}.png?size=32`;
  }

  // Profile Effect properties
  profileEffectConfig: ProfileEffectConfig | null = null;
  activeEffectLayers: ProfileEffectLayer[] = [];

  get hasProfileEffect(): boolean {
    return !!this.profileEffectConfig && !!this.activeEffectLayers.length;
  }

  get profileEffectId(): string | null {
    return this.userData?.user_profile?.profile_effect?.id || null;
  }


  lanyardActivities: Activity[] = [];
  custom_status: Activity | null = null;
  statusColor: string = '#43b581'
  percentage = 0;

  private destroy$ = new Subject<void>();
  private activitiesSubscription: Subscription = new Subscription();

  constructor(
    private discordApiService: DiscordApiService, 
    private lanyardService: LanyardService, 
    private timestampsService: TimestampsService,
    private cdr: ChangeDetectorRef,
    private card3DService: Card3DEffectService,
    private profileEffectsService: ProfileEffectsService
  ) { }

  ngOnInit(): void {
    this.getDiscordUserData();
    this.getLanyardData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ProfileId'] && !changes['ProfileId'].firstChange) {
      const newId = changes['ProfileId'].currentValue;
      const oldId = changes['ProfileId'].previousValue;
      
      if (newId !== oldId) {
        this.resetProfileData();

        this.getDiscordUserData();
        this.getLanyardData();
      }
    }
  }

  ngAfterViewInit(): void {
    if (this.cardElement) {
      this.card3DService.initCard3DEffect(this.cardElement, {
        maxRotation: 12,
        scale: 1.03,
        perspective: 1200,
        shadowIntensity: 0.25,
        transition: 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)'
      });
    }
  }

  ngOnDestroy(): void {
    if (this.cardElement) {
      this.card3DService.destroyCard3DEffect(this.cardElement);
    }
    
    this.activitiesSubscription.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private resetProfileData(): void {
    this.userDataStatus = false;
    this.userData = undefined;
    this.userBioFormatted = undefined;
    this.themesColor = [];
    this.lanyardData = null;
    this.lanyardActivities = [];
    this.custom_status = null;
    this.percentage = 0;
    this.profileEffectConfig = null;
    this.activeEffectLayers = [];
    
    this.themeColorsChange.emit([]);
    this.nameplateAssetChange.emit(null);
    
    this.cdr.markForCheck();
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
          
          // Emit theme colors to parent component
          this.themeColorsChange.emit(this.themesColor);
          
          // Emit nameplate asset to parent component
          const nameplateAsset = this.userData.user?.collectibles?.nameplate?.asset || null;
          this.nameplateAssetChange.emit(nameplateAsset);

          // Initialize profile effect animation
          if (this.profileEffectId) {
            this.loadProfileEffect(this.profileEffectId);
          }
          
          // Trigger change detection
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.userDataStatus = false;
          console.error('Error fetching Discord user data:', error);
          this.cdr.markForCheck();
        }
      });
  }

  private loadProfileEffect(effectId: string): void {
    this.profileEffectsService.getEffectById(effectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (effectConfig) => {
          if (effectConfig && effectConfig.effects) {
            this.profileEffectConfig = effectConfig;
            this.initializeProfileEffectLayers(effectConfig.effects);
          }
        },
        error: (error) => {
          console.error('Error loading profile effect:', error);
        }
      });
  }

  private initializeProfileEffectLayers(layers: ProfileEffectLayer[]): void {
    const sortedLayers = [...layers].sort((a, b) => (a.start || 0) - (b.start || 0));
    
    this.activeEffectLayers = sortedLayers.filter(layer => (layer.start || 0) === 0);
    this.cdr.markForCheck();

    sortedLayers.forEach(layer => {
      const startTime = layer.start || 0;

      if (startTime === 0) {
        this.handleLayerLifecycle(layer, 0);
      } else {
        setTimeout(() => {
          this.activeEffectLayers.push(layer);
          this.cdr.markForCheck();
          this.handleLayerLifecycle(layer, 0);
        }, startTime);
      }
    });
  }

  private handleLayerLifecycle(layer: ProfileEffectLayer, delay: number): void {
    const duration = layer.duration || 0;
    const loopDelay = layer.loopDelay || 0;

    if (!layer.loop) {
      if (duration > 0) {
        setTimeout(() => {
          this.activeEffectLayers = this.activeEffectLayers.filter(l => l !== layer);
          this.cdr.markForCheck();
        }, delay + duration);
      }
    } else if (loopDelay > 0) {
      const cycleLayer = () => {
        setTimeout(() => {
          this.activeEffectLayers = this.activeEffectLayers.filter(l => l !== layer);
          this.cdr.markForCheck();

          setTimeout(() => {
            this.activeEffectLayers.push(layer);
            this.cdr.markForCheck();
            cycleLayer();
          }, loopDelay);
        }, duration);
      };
      cycleLayer();
    }
  }

  public getLanyardData(): void {
    this.lanyardService.setInitialData(this.ProfileId);
    this.lanyardService.setupWebSocket();

    this.lanyardService.getLanyardData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.lanyardData = data;
          this.custom_status = this.lanyardData.d?.activities?.find(activity => activity.name === 'Custom Status') || null;
          console.log(this.custom_status);
          this.lanyardActivities = this.lanyardData.d?.activities || [];
          this.lanyardActivities = this.lanyardActivities.filter(activity => activity.id !== 'custom');

          this.processActivities();
          this.updateStatusColor();
          
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error getting Lanyard data:', error);
          this.cdr.markForCheck();
        }
      });
  }

  private processActivities(): void {
    this.activitiesSubscription.unsubscribe();
    this.activitiesSubscription = new Subscription();

    this.lanyardActivities.forEach((activity) => {
      if (activity.timestamps && activity.name === 'Spotify') {
        const progressSub = this.timestampsService.getProgressPercentage(activity.timestamps.start, activity.timestamps.end)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (percentage) => {
              this.percentage = percentage;
              this.cdr.markForCheck();
            }
          });
        this.activitiesSubscription.add(progressSub);

        const elapsedSub = this.timestampsService.getElapsedTime(activity.timestamps.start)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (timeElapsed) => {
              activity.timestamps!.start = timeElapsed;
              this.cdr.markForCheck();
            }
          });
        this.activitiesSubscription.add(elapsedSub);

        activity.timestamps!.end = this.timestampsService.getTotalDuration(activity.timestamps.start, activity.timestamps.end);
      }
      
      if (activity.timestamps && activity.name !== 'Spotify') {
        const elapsedSub = this.timestampsService.getElapsedTime(activity.timestamps.start)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (timeElapsed) => {
              activity.timestamps!.start = timeElapsed;
              this.cdr.markForCheck();
            }
          });
        this.activitiesSubscription.add(elapsedSub);
      }
    });
  }

  private updateStatusColor(): void {
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

  handleImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    target.src = '../../../assets/images/no-image-found.jpg';
  }
}
