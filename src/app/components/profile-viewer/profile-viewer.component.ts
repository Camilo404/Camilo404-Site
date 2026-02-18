import { Component, Renderer2, signal, computed, effect, inject, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { environment } from 'src/environments/environment';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { CardProfileComponent } from '../card-profile/card-profile.component';
import { SearchModalComponent } from '../search-modal/search-modal.component';
import { ColorUtilsService } from 'src/app/services/color-utils.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUserAstronaut, faCircle, faBolt, faRocket, faSyncAlt, faShieldAlt, faFingerprint, faSearch } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-profile-viewer',
    standalone: true,
    templateUrl: './profile-viewer.component.html',
    styleUrl: './profile-viewer.component.scss',
    imports: [RouterModule, CardProfileComponent, SearchModalComponent, FontAwesomeModule],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileViewerComponent {

  // FontAwesome Icons
  faUserAstronaut = faUserAstronaut;
  faCircle = faCircle;
  faBolt = faBolt;
  faRocket = faRocket;
  faSyncAlt = faSyncAlt;
  faShieldAlt = faShieldAlt;
  faFingerprint = faFingerprint;
  faSearch = faSearch;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private renderer = inject(Renderer2);
  private destroyRef = inject(DestroyRef);
  private colorUtils = inject(ColorUtilsService);

  profileId = signal<string>(environment.discordId);
  isModalOpen = signal<boolean>(false);
  isMobile = signal<boolean>(false);
  themeColors = signal<string[]>([]);
  gradientColor1 = signal<string>('#1e293b'); // slate-900
  gradientColor2 = signal<string>('#7e22ce'); // purple-700
  gradientColor3 = signal<string>('#1e293b'); // slate-900
  nameplateAsset = signal<string | null>(null);
  
  private particleTypes = ['✨', '⭐', '💫', '✦', '◆', '●', '★', '◉'];
  private colors = ['#a78bfa', '#c084fc', '#e879f9', '#60a5fa', '#818cf8', '#f472b6', '#fb7185', '#fbbf24'];

  nameplateVideoUrl = computed(() => {
    const asset = this.nameplateAsset();
    if (!asset) return null;
    return `https://cdn.discordapp.com/assets/collectibles/${asset}asset.webm`;
  });

  constructor() {
    // Detect mobile on initialization
    this.isMobile.set(this.detectMobile());
    
    // Add keyframes for animations
    this.addKeyframes();
    
    // Use effect to watch route parameter changes
    effect(() => {
      const params = this.route.snapshot.paramMap;
      const newId = params.get('id') || environment.discordId;
      if (this.profileId() !== newId) {
        this.profileId.set(newId);
      }
    });
    
    // Create initial particles
    const initialCount = this.isMobile() ? 5 : 15;
    this.createInitialParticles(initialCount);
    
    // Set up particle creation interval with RxJS
    const particleDelay = this.isMobile() ? 500 : 150;
    interval(particleDelay)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.createParticle());
  }
  
  private detectMobile(): boolean {
    const isMobileWidth = window.innerWidth <= 768;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    return isMobileWidth || isMobileUA || isTouchDevice;
  }

  onThemeColorsChange(colors: string[]): void {
    this.themeColors.set(colors);
    
    if (colors.length >= 2) {
      const baseColor = colors[0];
      const accentColor = colors[1];
      
      this.gradientColor1.set(this.colorUtils.generateDeepVariant(baseColor));
      this.gradientColor2.set(this.colorUtils.generateVibranceVariant(accentColor, 0.7));
      this.gradientColor3.set(this.colorUtils.generateComplementaryDark(baseColor));
    } else if (colors.length === 1) {
      const baseColor = colors[0];
      this.gradientColor1.set(this.colorUtils.generateDeepVariant(baseColor));
      this.gradientColor2.set(this.colorUtils.generateVibranceVariant(baseColor, 0.8));
      this.gradientColor3.set(this.colorUtils.generateComplementaryDark(baseColor));
    }
    
    this.colors = this.colorUtils.generateSophisticatedParticleColors(colors);
    
    this.updateBackgroundColors();
  }

  onNameplateAssetChange(asset: string | null): void {
    this.nameplateAsset.set(asset);
  }

  onVideoCanPlay(event: Event): void {
    const video = event.target as HTMLVideoElement;
    if (video.paused && this.nameplateVideoUrl()) {
      video.play().catch((error) => {
        console.warn('Autoplay bloqueado por el navegador:', error);
        console.log('El video se reproducirá cuando el usuario interactúe con la página');
      });
    }
  }

  onVideoLoaded(event: Event): void {
    const video = event.target as HTMLVideoElement;
    if (this.nameplateVideoUrl()) {
      video.play().catch((error) => {
        console.debug('Reproducción en loadeddata falló, esperando canplay...', error);
      });
    }
  }

  onVideoError(event: Event): void {
    const video = event.target as HTMLVideoElement;
    if (video.error && this.nameplateVideoUrl()) {
      console.error('Error al cargar el video del nameplate:', video.error);
    }
  }

  private updateBackgroundColors(): void {
    document.documentElement.style.setProperty('--gradient-color-1', this.gradientColor1());
    document.documentElement.style.setProperty('--gradient-color-2', this.gradientColor2());
    document.documentElement.style.setProperty('--gradient-color-3', this.gradientColor3());
  }

  createInitialParticles(count: number = 15): void {
    for (let i = 0; i < count; i++) {
      setTimeout(() => this.createParticle(), i * 100);
    }
  }

  createParticle(): void {
    const particle = this.renderer.createElement('div');
    this.renderer.addClass(particle, 'particle');
    
    const particleType = this.particleTypes[Math.floor(Math.random() * this.particleTypes.length)];
    const text = this.renderer.createText(particleType);
    this.renderer.appendChild(particle, text);

    const fontSize = Math.random() * 20 + 12 + 'px';
    const leftPosition = Math.random() * window.innerWidth + 'px';
    const fallDuration = Math.random() * 15 + 15 + 's';
    const sideWaysDuration = Math.random() * 3 + 2 + 's';
    const rotationDuration = Math.random() * 5 + 5 + 's';
    const opacity = Math.random() * 0.4 + 0.3;
    const color = this.colors[Math.floor(Math.random() * this.colors.length)];
    
    const blur = this.isMobile() ? 0 : Math.random() * 1;

    this.renderer.setStyle(particle, 'fontSize', fontSize);
    this.renderer.setStyle(particle, 'left', leftPosition);
    this.renderer.setStyle(particle, 'opacity', opacity);
    this.renderer.setStyle(particle, 'color', color);
    
    if (blur > 0) {
      this.renderer.setStyle(particle, 'filter', `blur(${blur}px)`);
    }
    
    const animations = this.isMobile() 
      ? `particleFall ${fallDuration} linear, particleSway ${sideWaysDuration} ease-in-out infinite`
      : `particleFall ${fallDuration} linear, particleSway ${sideWaysDuration} ease-in-out infinite, particleRotate ${rotationDuration} linear infinite`;
    
    this.renderer.setStyle(particle, 'animation', animations);

    const container = document.querySelector('.particles-container');
    if (container) {
      this.renderer.appendChild(container, particle);
    }

    setTimeout(() => {
      if (container && particle.parentNode === container) {
        this.renderer.removeChild(container, particle);
      }
    }, parseFloat(fallDuration) * 1000);
  }

  addKeyframes(): void {
    const style = this.renderer.createElement('style');
    style.textContent = `
      @keyframes particleFall {
        0% { 
          top: -50px; 
          opacity: 0;
        }
        10% {
          opacity: var(--particle-opacity, 0.7);
        }
        90% {
          opacity: var(--particle-opacity, 0.7);
        }
        100% { 
          top: 100vh; 
          opacity: 0;
        }
      }
      
      @keyframes particleSway {
        0%, 100% { 
          transform: translateX(0); 
        }
        25% { 
          transform: translateX(25px); 
        }
        75% { 
          transform: translateX(-25px); 
        }
      }
      
      @keyframes particleRotate {
        0% { 
          transform: rotate(0deg); 
        }
        100% { 
          transform: rotate(360deg); 
        }
      }

      @keyframes blob {
        0%, 100% {
          transform: translate(0, 0) scale(1);
        }
        25% {
          transform: translate(20px, -50px) scale(1.1);
        }
        50% {
          transform: translate(-20px, 20px) scale(0.9);
        }
        75% {
          transform: translate(50px, 50px) scale(1.05);
        }
      }

      @keyframes fadeInDown {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes spinSlow {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `;
    this.renderer.appendChild(document.head, style);
  }

  public openSearchModal(): void {
    this.isModalOpen.set(true);
  }

  public closeSearchModal(): void {
    this.isModalOpen.set(false);
  }

  public onSearchProfile(userId: string): void {
    this.router.navigate(['/profile', userId]);
  }
}
