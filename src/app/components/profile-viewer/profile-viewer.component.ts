import { Component, OnInit, Output, Renderer2, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-profile-viewer',
  templateUrl: './profile-viewer.component.html',
  styleUrl: './profile-viewer.component.scss',
  standalone: false
})
export class ProfileViewerComponent implements OnInit, OnDestroy {

  @Output() profileId!: string;
  
  // Search modal state
  public isModalOpen: boolean = false;
  
  private particleInterval: ReturnType<typeof setInterval> | undefined;
  private particleTypes = ['✨', '⭐', '💫', '✦', '◆', '●', '★', '◉'];
  private colors = ['#a78bfa', '#c084fc', '#e879f9', '#60a5fa', '#818cf8', '#f472b6', '#fb7185', '#fbbf24'];
  
  // Theme colors from profile
  themeColors: string[] = [];
  gradientColor1: string = '#1e293b'; // slate-900
  gradientColor2: string = '#7e22ce'; // purple-700
  gradientColor3: string = '#1e293b'; // slate-900

  nameplateAsset: string | null = null;

  constructor(
    private route: ActivatedRoute, 
    private router: Router,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef
  ) { }
  
  ngOnInit(): void {
    this.profileId = this.route.snapshot.paramMap.get('id') || environment.discordId;

    this.addKeyframes();
    this.createInitialParticles();
    this.particleInterval = setInterval(() => this.createParticle(), 150);
  }

  ngOnDestroy(): void {
    if (this.particleInterval) {
      clearInterval(this.particleInterval);
    }
  }

  onThemeColorsChange(colors: string[]): void {
    this.themeColors = colors;
    
    if (colors.length >= 2) {
      const baseColor = colors[0];
      const accentColor = colors[1];
      
      this.gradientColor1 = this.generateDeepVariant(baseColor);
      this.gradientColor2 = this.generateVibranceVariant(accentColor, 0.7);
      this.gradientColor3 = this.generateComplementaryDark(baseColor);
    } else if (colors.length === 1) {
      const baseColor = colors[0];
      this.gradientColor1 = this.generateDeepVariant(baseColor);
      this.gradientColor2 = this.generateVibranceVariant(baseColor, 0.8);
      this.gradientColor3 = this.generateComplementaryDark(baseColor);
    }
    
    this.colors = this.generateSophisticatedParticleColors(colors);
    
    this.updateBackgroundColors();
  }

  onNameplateAssetChange(asset: string | null): void {
    this.nameplateAsset = asset;
    this.cdr.detectChanges();
  }

  get nameplateVideoUrl(): string | null {
    if (!this.nameplateAsset) {
      return null;
    }
    return `https://cdn.discordapp.com/assets/collectibles/${this.nameplateAsset}asset.webm`;
  }

  onVideoCanPlay(event: Event): void {
    const video = event.target as HTMLVideoElement;
    if (video.paused && this.nameplateVideoUrl) {
      video.play().catch((error) => {
        console.warn('Autoplay bloqueado por el navegador:', error);
        console.log('El video se reproducirá cuando el usuario interactúe con la página');
      });
    }
  }

  onVideoLoaded(event: Event): void {
    const video = event.target as HTMLVideoElement;
    if (this.nameplateVideoUrl) {
      video.play().catch((error) => {
        console.debug('Reproducción en loadeddata falló, esperando canplay...', error);
      });
    }
  }

  onVideoError(event: Event): void {
    const video = event.target as HTMLVideoElement;
    if (video.error && this.nameplateVideoUrl) {
      console.error('Error al cargar el video del nameplate:', video.error);
    }
  }

  private generateDeepVariant(hex: string): string {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    const newR = Math.floor(r * 0.15);
    const newG = Math.floor(g * 0.15);
    const newB = Math.floor(b * 0.15);
    
    return '#' + [newR, newG, newB]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('');
  }

  private generateVibranceVariant(hex: string, intensity: number): string {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    const { h, s, l } = this.rgbToHsl(r, g, b);
    
    const newS = Math.min(1, s * (1 + intensity * 0.3));
    const newL = l * (0.5 + intensity * 0.2);
    
    const rgb = this.hslToRgb(h, newS, newL);
    return '#' + rgb.map(x => Math.round(x).toString(16).padStart(2, '0')).join('');
  }

  private generateComplementaryDark(hex: string): string {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    const { h, s } = this.rgbToHsl(r, g, b);
    
    const newH = (h + 0.15) % 1;
    const newS = s * 0.8;
    const newL = 0.12;
    
    const rgb = this.hslToRgb(newH, newS, newL);
    return '#' + rgb.map(x => Math.round(x).toString(16).padStart(2, '0')).join('');
  }

  private rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    
    return { h, s, l };
  }

  private hslToRgb(h: number, s: number, l: number): number[] {
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    return [r * 255, g * 255, b * 255];
  }

  private generateSophisticatedParticleColors(themeColors: string[]): string[] {
    if (themeColors.length === 0) {
      return ['#a78bfa', '#c084fc', '#e879f9', '#60a5fa', '#818cf8', '#f472b6', '#fb7185', '#fbbf24'];
    }
    
    const variations: string[] = [];
    
    themeColors.forEach(color => {
      const baseRgb = this.hexToRgb(color);
      const { h, s, l } = this.rgbToHsl(baseRgb.r, baseRgb.g, baseRgb.b);
      
      for (let i = 0; i < 5; i++) {
        const hueShift = (h + (i * 0.05)) % 1;
        const satVariation = Math.max(0.5, Math.min(1, s + (i - 2) * 0.1));
        const lightVariation = Math.max(0.4, Math.min(0.8, l + (i - 2) * 0.1));
        
        const rgb = this.hslToRgb(hueShift, satVariation, lightVariation);
        variations.push('#' + rgb.map(x => Math.round(x).toString(16).padStart(2, '0')).join(''));
      }
    });
    
    return variations;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    hex = hex.replace('#', '');
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16)
    };
  }

  private darkenColor(hex: string, factor: number): string {
    hex = hex.replace('#', '');
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    const newR = Math.floor(r * factor);
    const newG = Math.floor(g * factor);
    const newB = Math.floor(b * factor);
    
    return '#' + [newR, newG, newB]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('');
  }


  private updateBackgroundColors(): void {
    document.documentElement.style.setProperty('--gradient-color-1', this.gradientColor1);
    document.documentElement.style.setProperty('--gradient-color-2', this.gradientColor2);
    document.documentElement.style.setProperty('--gradient-color-3', this.gradientColor3);
  }

  createInitialParticles(): void {
    for (let i = 0; i < 15; i++) {
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
    const blur = Math.random() * 1;

    this.renderer.setStyle(particle, 'fontSize', fontSize);
    this.renderer.setStyle(particle, 'left', leftPosition);
    this.renderer.setStyle(particle, 'opacity', opacity);
    this.renderer.setStyle(particle, 'color', color);
    this.renderer.setStyle(particle, 'filter', `blur(${blur}px)`);
    this.renderer.setStyle(particle, 'animation', 
      `particleFall ${fallDuration} linear, particleSway ${sideWaysDuration} ease-in-out infinite, particleRotate ${rotationDuration} linear infinite`
    );

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
    this.isModalOpen = true;
  }

  public closeSearchModal(): void {
    this.isModalOpen = false;
  }

  public onSearchProfile(userId: string): void {
    this.router.navigate(['/profile', userId]);
  }
}
