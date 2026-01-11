import { Component, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  standalone: false
})
export class MainComponent {

  public isModalOpen: boolean = false;

  @ViewChild('nameplateVideo') nameplateVideoRef?: ElementRef<HTMLVideoElement>;

  // Nameplate asset from profile
  nameplateAsset: string | null = null;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  public openSearchModal(): void {
    this.isModalOpen = true;
  }

  public closeSearchModal(): void {
    this.isModalOpen = false;
  }

  public onSearchProfile(userId: string): void {
    this.router.navigate(['/profile', userId]);
  }

  // Nameplate methods
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
}
