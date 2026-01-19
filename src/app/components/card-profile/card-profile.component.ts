import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, ViewChild, AfterViewInit, ViewEncapsulation, HostListener } from '@angular/core';
import { DiscordApiService } from 'src/app/services/discord-api.service';
import { Profile, ProfileEffectConfig, ProfileEffectLayer } from 'src/app/models/discord-profile.model';
import { LanyardService } from 'src/app/services/lanyard.service';
import { Lanyard, Activity } from 'src/app/models/lanyard-profile.model';
import { Card3DEffectService } from 'src/app/services/card-3d-effect.service';
import { ProfileEffectsService } from 'src/app/services/profile-effects.service';
import { FloatingActivityComponent } from '../floating-activity/floating-activity.component';
import { environment } from 'src/environments/environment';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface RenderedLayer {
  config: ProfileEffectLayer;
  isVisible: boolean;
}

@Component({
  selector: 'app-card-profile',
  templateUrl: './card-profile.component.html',
  styleUrls: ['./card-profile.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, FloatingActivityComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
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
  isMobile: boolean = false;

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
  renderedLayers: RenderedLayer[] = [];

  get hasProfileEffect(): boolean {
    return !!this.profileEffectConfig && !!this.renderedLayers.length;
  }

  get profileEffectId(): string | null {
    return this.userData?.user_profile?.profile_effect?.id || null;
  }


  custom_status: Activity | null = null;
  statusColor: string = '#43b581'

  private destroy$ = new Subject<void>();

  constructor(
    private discordApiService: DiscordApiService,
    private lanyardService: LanyardService,
    private cdr: ChangeDetectorRef,
    private card3DService: Card3DEffectService,
    private profileEffectsService: ProfileEffectsService
  ) { }

  ngOnInit(): void {
    this.checkScreenSize();
    this.getDiscordUserData();
    this.getLanyardData();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
    this.cdr.markForCheck();
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

    this.destroy$.next();
    this.destroy$.complete();
  }

  private resetProfileData(): void {
    this.userDataStatus = false;
    this.userData = undefined;
    this.userBioFormatted = undefined;
    this.themesColor = [];
    this.lanyardData = null;
    this.custom_status = null;
    this.profileEffectConfig = null;
    this.renderedLayers = [];

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
          this.userBioFormatted = this.parseBio(this.userData.user_profile?.bio || '');

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

    this.renderedLayers = sortedLayers.map(layer => ({
      config: layer,
      isVisible: false
    }));
    this.cdr.markForCheck();

    this.renderedLayers.forEach(renderedLayer => {
      const startTime = renderedLayer.config.start || 0;

      if (startTime === 0) {
        renderedLayer.isVisible = true;
        this.cdr.markForCheck();
        this.handleLayerLifecycle(renderedLayer);
      } else {
        setTimeout(() => {
          renderedLayer.isVisible = true;
          this.cdr.markForCheck();
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
          this.cdr.markForCheck();
        }, duration);
      }
    } else if (loopDelay > 0) {
      const cycleLayer = () => {
        setTimeout(() => {
          layer.isVisible = false;
          this.cdr.markForCheck();

          setTimeout(() => {
            layer.isVisible = true;
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
          
          this.updateStatusColor();
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error getting Lanyard data:', error);
          this.cdr.markForCheck();
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
    this.message = '';
  }

  handleImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    target.src = '../../../assets/images/no-image-found.jpg';
  }
}
