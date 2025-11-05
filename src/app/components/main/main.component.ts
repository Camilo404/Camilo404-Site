import { Component, ViewChild, AfterViewInit, ElementRef, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  standalone: false
})
export class MainComponent implements AfterViewInit {

  public isMuted: boolean = true;
  public isModalOpen: boolean = false;

  @ViewChild('bgVideo') bgVideo!: ElementRef;
  @ViewChild('volumeInput') volumeInput!: ElementRef;
  @ViewChild('nameplateVideo') nameplateVideoRef?: ElementRef<HTMLVideoElement>;

  public volume: number = 0;

  // Nameplate asset from profile
  nameplateAsset: string | null = null;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngAfterViewInit(): void {
    this.bgVideo.nativeElement.muted = this.isMuted;
  }

  public changeVolume(volume: Event) {
    const volumeInput = parseInt((volume.target as HTMLInputElement).value);
    this.volume = volumeInput;

    this.bgVideo.nativeElement.volume = volumeInput / 100;
    localStorage.setItem('volume', volumeInput.toString());

    this.isMuted = volumeInput === 0;
    this.bgVideo.nativeElement.muted = this.isMuted;
  }

  public toggleMute(): void {
    if (this.bgVideo) {
      this.isMuted = !this.isMuted;
      this.bgVideo.nativeElement.muted = this.isMuted;

      if (this.isMuted) {
        this.volume = 0;
        this.volumeInput.nativeElement.value = 0;
      } else {
        const localVolume = localStorage.getItem('volume');
        this.volume = localVolume ? parseInt(localVolume) : 100;
        this.volumeInput.nativeElement.value = this.volume;
        this.bgVideo.nativeElement.volume = this.volume / 100;
      }
    }
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
