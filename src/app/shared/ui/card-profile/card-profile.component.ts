import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, input, output, effect, ChangeDetectionStrategy, ElementRef, ViewChild, AfterViewInit, ViewEncapsulation, signal, computed, inject, DestroyRef } from '@angular/core';
import { DiscordApiService } from 'src/app/core/services/discord-api.service';
import { Profile, ProfileEffectConfig } from 'src/app/core/models/discord-profile.model';
import { LanyardService } from 'src/app/core/services/lanyard.service';
import { Lanyard, Activity } from 'src/app/core/models/lanyard-profile.model';
import { Card3DEffectService } from 'src/app/core/services/card-3d-effect.service';
import { ProfileEffectsService } from 'src/app/core/services/profile-effects.service';
import { ProfileEffectAnimationService, RenderedLayer } from 'src/app/core/services/profile-effect-animation.service';
import { FloatingActivityComponent } from '../floating-activity/floating-activity.component';
import { StatusColorPipe } from '../../pipes/status-color.pipe';
import { BioFormatterPipe } from '../../pipes/bio-formatter.pipe';
import { environment } from 'src/environments/environment';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
    selector: 'app-card-profile',
    standalone: true,
    templateUrl: './card-profile.component.html',
    styleUrls: ['./card-profile.component.scss'],
    imports: [CommonModule, FormsModule, FloatingActivityComponent, StatusColorPipe, BioFormatterPipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class CardProfileComponent implements AfterViewInit {
  ProfileId = input<string>(environment.discordId);
  themeColorsChange = output<string[]>();
  nameplateAssetChange = output<string | null>();
  
  @ViewChild('cardElement', { static: false }) cardElement!: ElementRef;
  
  private discordApiService = inject(DiscordApiService);
  private lanyardService = inject(LanyardService);
  private card3DService = inject(Card3DEffectService);
  private profileEffectsService = inject(ProfileEffectsService);
  private profileEffectAnimService = inject(ProfileEffectAnimationService);
  private destroyRef = inject(DestroyRef);
  
  userId = environment.discordId;
  apiUrl = environment.apiUrl;
  userDataStatus = signal(false);
  userData = signal<Profile | undefined>(undefined);
  themesColor = signal<string[]>([]);
  isMobile = signal(false);
  message = signal('');
  lanyardData = signal<Lanyard | null>(null);

  // Profile Effect properties
  profileEffectConfig = signal<ProfileEffectConfig | null>(null);
  renderedLayers = signal<RenderedLayer[]>([]);
  custom_status = signal<Activity | null>(null);

  clanTag = computed(() => {
    const data = this.userData();
    return data?.user?.clan?.tag || data?.user?.primary_guild?.tag || null;
  });

  clanBadge = computed(() => {
    const data = this.userData();
    return data?.user?.clan?.badge || data?.user?.primary_guild?.badge || null;
  });

  clanGuildId = computed(() => {
    const data = this.userData();
    return data?.user?.clan?.identity_guild_id || data?.user?.primary_guild?.identity_guild_id || null;
  });

  clanBadgeUrl = computed(() => {
    const badge = this.clanBadge();
    const guildId = this.clanGuildId();
    if (!badge || !guildId) return null;
    return `https://cdn.discordapp.com/clan-badges/${guildId}/${badge}.png?size=32`;
  });

  hasProfileEffect = computed(() => {
    return !!this.profileEffectConfig() && !!this.renderedLayers().length;
  });

  profileEffectId = computed(() => {
    return this.userData()?.user_profile?.profile_effect?.id || null;
  });

  constructor() {
    this.checkScreenSize();
    
    fromEvent(window, 'resize')
      .pipe(
        debounceTime(150),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.checkScreenSize());

    effect(() => {
      this.ProfileId();
      this.resetProfileData();
      this.getDiscordUserData();
      this.getLanyardData();
    });

    effect(() => {
      const data = this.lanyardService.getLanyardData()();
      if (data) {
        this.lanyardData.set(data);
        const customStatus = data.d?.activities?.find((activity: Activity) => activity.name === 'Custom Status') || null;
        this.custom_status.set(customStatus);
      }
    });
  }

  private checkScreenSize() {
    this.isMobile.set(window.innerWidth <= 768);
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
    
    this.destroyRef.onDestroy(() => {
      if (this.cardElement) {
        this.card3DService.destroyCard3DEffect(this.cardElement);
      }
      this.profileEffectAnimService.destroyLayers();
    });
  }

  private resetProfileData(): void {
    this.userDataStatus.set(false);
    this.userData.set(undefined);
    this.themesColor.set([]);
    this.lanyardData.set(null);
    this.custom_status.set(null);
    this.profileEffectConfig.set(null);
    this.renderedLayers.set([]);

    this.themeColorsChange.emit([]);
    this.nameplateAssetChange.emit(null);
  }

  public getDiscordUserData(): void {
    this.discordApiService.getDiscordUser(this.ProfileId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: Profile) => {
          this.userDataStatus.set(true);
          this.userData.set(data);

          const themeColors = data.user_profile?.theme_colors || [];
          const colors = themeColors.length === 0 
            ? ['#5C5C5C', '#5C5C5C']
            : themeColors.map((color) => '#' + color.toString(16).padStart(6, '0').toUpperCase());
          
          this.themesColor.set(colors);

          // Emit theme colors to parent component
          this.themeColorsChange.emit(colors);

          // Emit nameplate asset to parent component
          const nameplateAsset = data.user?.collectibles?.nameplate?.asset || null;
          this.nameplateAssetChange.emit(nameplateAsset);

          // Initialize profile effect animation
          const effectId = this.profileEffectId();
          if (effectId) {
            this.loadProfileEffect(effectId);
          }
        },
        error: (error) => {
          this.userDataStatus.set(false);
          console.error('Error fetching Discord user data:', error);
        }
      });
  }

  private loadProfileEffect(effectId: string): void {
    this.profileEffectsService.getEffectById(effectId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (effectConfig) => {
          if (effectConfig && effectConfig.effects) {
            this.profileEffectConfig.set(effectConfig);
            const layers = this.profileEffectAnimService.initializeLayers(effectConfig.effects, updatedLayers => this.renderedLayers.set(updatedLayers));
            this.renderedLayers.set(layers);
          }
        },
        error: (error) => {
          console.error('Error loading profile effect:', error);
        }
      });
  }

  public getLanyardData(): void {
    this.lanyardService.setInitialData(this.ProfileId());
    this.lanyardService.setupWebSocket();
  }

  public sendMessage(): void {
    window.open(`https://discord.com/users/${this.userId}`, '_blank');
    this.message.set('');
  }

  handleImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    target.src = 'assets/images/no-image-found.jpg';
  }
}
