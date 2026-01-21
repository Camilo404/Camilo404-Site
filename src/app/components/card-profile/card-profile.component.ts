import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, input, output, OnInit, OnDestroy, effect, ChangeDetectionStrategy, ElementRef, ViewChild, AfterViewInit, ViewEncapsulation, HostListener, signal, computed, inject, DestroyRef } from '@angular/core';
import { DiscordApiService } from 'src/app/services/discord-api.service';
import { Profile, ProfileEffectConfig, ProfileEffectLayer } from 'src/app/models/discord-profile.model';
import { LanyardService } from 'src/app/services/lanyard.service';
import { Lanyard, Activity } from 'src/app/models/lanyard-profile.model';
import { Card3DEffectService } from 'src/app/services/card-3d-effect.service';
import { ProfileEffectsService } from 'src/app/services/profile-effects.service';
import { FloatingActivityComponent } from '../floating-activity/floating-activity.component';
import { environment } from 'src/environments/environment';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface RenderedLayer {
  config: ProfileEffectLayer;
  isVisible: boolean;
}

@Component({
    selector: 'app-card-profile',
    templateUrl: './card-profile.component.html',
    styleUrls: ['./card-profile.component.scss'],
    imports: [CommonModule, FormsModule, FloatingActivityComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class CardProfileComponent implements OnInit, OnDestroy, AfterViewInit {
  ProfileId = input<string>(environment.discordId);
  themeColorsChange = output<string[]>();
  nameplateAssetChange = output<string | null>();
  
  @ViewChild('cardElement', { static: false }) cardElement!: ElementRef;
  
  private discordApiService = inject(DiscordApiService);
  private lanyardService = inject(LanyardService);
  private card3DService = inject(Card3DEffectService);
  private profileEffectsService = inject(ProfileEffectsService);
  private destroyRef = inject(DestroyRef);
  
  userId = environment.discordId;
  apiUrl = environment.apiUrl;
  userDataStatus = signal(false);
  userData = signal<Profile | undefined>(undefined);
  userBioFormatted = signal<string | undefined>(undefined);
  themesColor = signal<string[]>([]);
  isMobile = signal(false);
  message = signal('');
  lanyardData = signal<Lanyard | null>(null);

  // Profile Effect properties
  profileEffectConfig = signal<ProfileEffectConfig | null>(null);
  renderedLayers = signal<RenderedLayer[]>([]);
  custom_status = signal<Activity | null>(null);
  statusColor = signal<string>('#43b581');

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
        this.updateStatusColor();
      }
    });
  }

  ngOnInit(): void {
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
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
  }

  ngOnDestroy(): void {
    if (this.cardElement) {
      this.card3DService.destroyCard3DEffect(this.cardElement);
    }
  }

  private resetProfileData(): void {
    this.userDataStatus.set(false);
    this.userData.set(undefined);
    this.userBioFormatted.set(undefined);
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

          // Format the user bio to HTML
          this.userBioFormatted.set(this.parseBio(data.user_profile?.bio || ''));

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

    const initialLayers = sortedLayers.map(layer => ({
      config: layer,
      isVisible: false
    }));
    
    this.renderedLayers.set(initialLayers);

    initialLayers.forEach((renderedLayer, index) => {
      const startTime = renderedLayer.config.start || 0;

      if (startTime === 0) {
        renderedLayer.isVisible = true;
        this.renderedLayers.update(layers => [...layers]);
        this.handleLayerLifecycle(renderedLayer);
      } else {
        setTimeout(() => {
          renderedLayer.isVisible = true;
          this.renderedLayers.update(layers => [...layers]);
          this.handleLayerLifecycle(renderedLayer);
        }, startTime);
      }
    });
  }

  private handleLayerLifecycle(layer: RenderedLayer): void {
    const duration = layer.config.duration || 0;
    const loopDelay = layer.config.loopDelay || 0;

    if (!layer.config.loop) {
      if (duration > 0) {
        setTimeout(() => {
          layer.isVisible = false;
          this.renderedLayers.update(layers => [...layers]);
        }, duration);
      }
    } else if (loopDelay > 0) {
      const cycleLayer = () => {
        setTimeout(() => {
          layer.isVisible = false;
          this.renderedLayers.update(layers => [...layers]);

          setTimeout(() => {
            layer.isVisible = true;
            this.renderedLayers.update(layers => [...layers]);
            cycleLayer();
          }, loopDelay);
        }, duration);
      };
      cycleLayer();
    }
  }

  public getLanyardData(): void {
    this.lanyardService.setInitialData(this.ProfileId());
    this.lanyardService.setupWebSocket();
  }

  private updateStatusColor(): void {
    const status = this.lanyardData()?.d?.discord_status;
    let color = '#747f8d';
    
    switch (status) {
      case 'online':
        color = '#43b581';
        break;
      case 'idle':
        color = '#faa61a';
        break;
      case 'dnd':
        color = '#f04747';
        break;
      case 'streaming':
        color = '#593695';
        break;
    }
    
    this.statusColor.set(color);
  }

  // Helper to escape HTML characters
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  private simpleMarkdown(text: string): string {
    if (!text) return '';

    // First escape HTML to prevent XSS
    let html = this.escapeHtml(text);

    // Bold (**text**)
    html = html.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    
    // Italics (*text* or _text_)
    html = html.replace(/\*(.*?)\*/g, '<i>$1</i>');
    html = html.replace(/_(.*?)_/g, '<i>$1</i>');
    
    // Underline (__text__)
    html = html.replace(/__(.*?)__/g, '<u>$1</u>');
    
    // Strikethrough (~~text~~)
    html = html.replace(/~~(.*?)~~/g, '<s>$1</s>');
    
    // Monospace (`text`)
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Code blocks (```text```) - simplified (multiline support)
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // Links ([text](url))
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Auto-link URLs (bare links)
    // Avoid double linking by checking if it's already inside an <a> tag or src attribute
    html = html.replace(/(?<!href="|">)(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');

    // Blockquotes (> text)
    html = html.replace(/^&gt; ?(.*$)/gm, '<blockquote>$1</blockquote>');

    // Merge consecutive blockquotes to look like one block
    html = html.replace(/<\/blockquote>\n<blockquote>/g, '<br>');

    // Newlines to <br>
    html = html.replace(/\n/g, '<br>');

    return html;
  }

  private parseBio(bio: string): string {
    if (!bio) return '';

    // 1. Parse standard Markdown
    let html = this.simpleMarkdown(bio);

    // 2. Parse Custom Emojis
    const emojiRegex = /(&lt;|<)(a?):([a-zA-Z0-9_]+):(\d+)(&gt;|>)/g;

    html = html.replace(emojiRegex, (match, left, animated, name, id) => {
      const isAnimated = animated === 'a';
      const ext = isAnimated ? 'gif' : 'png';
      return `<img src="https://cdn.discordapp.com/emojis/${id}.${ext}" alt=":${name}:" title=":${name}:" class="discord-emoji">`;
    });

    return html;
  }

  public sendMessage(): void {
    window.open(`https://discord.com/users/${this.userId}`, '_blank');
    this.message.set('');
  }

  handleImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    target.src = '../../../assets/images/no-image-found.jpg';
  }
}
