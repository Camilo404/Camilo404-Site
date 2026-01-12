import { Component, ViewChild, ElementRef, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  standalone: false
})
export class MainComponent implements OnInit, OnDestroy {

  public isModalOpen: boolean = false;

  @ViewChild('nameplateVideo') nameplateVideoRef?: ElementRef<HTMLVideoElement>;

  // Nameplate asset from profile
  nameplateAsset: string | null = null;

  // Typewriter Effect Variables
  public currentQuote: string = '';
  private quotes: string[] = [
    "The world doesn't need heroes, it needs someone to pull the strings from the shadows.",
    "I am the one who lurks in the shadows to hunt the shadows.",
    "I seek neither power nor glory. I only seek to be the Eminence in Shadow.",
    "True power is not in the light, but in the darkness that swallows it.",
    "The hour of awakening is at hand.",
    "I am Atomic."
  ];
  private typeTimeout: ReturnType<typeof setTimeout> | undefined;
  private quoteIndex: number = 0;
  private charIndex: number = 0;
  private isDeleting: boolean = false;

  // Tech Stack Data
  public techStack = [
    { name: 'Angular', icon: 'fa-brands fa-angular', color: '#dd0031' },
    { name: 'React', icon: 'fa-brands fa-react', color: '#61dafb' },
    { name: 'Bootstrap', icon: 'fa-brands fa-bootstrap', color: '#7952b3' },
    { name: 'Python', icon: 'fa-brands fa-python', color: '#3776ab' },
    { name: 'JavaScript', icon: 'fa-brands fa-js', color: '#f0db4f' },
    { name: 'TypeScript', icon: 'fa-solid fa-code', color: '#3178c6' },
    { name: 'Sass', icon: 'fa-brands fa-sass', color: '#cc6699' },
    { name: 'HTML5', icon: 'fa-brands fa-html5', color: '#e34f26' },
    { name: 'CSS3', icon: 'fa-brands fa-css3-alt', color: '#264de4' },
    { name: 'Node.js', icon: 'fa-brands fa-node-js', color: '#339933' },
    { name: 'Git', icon: 'fa-brands fa-git-alt', color: '#f05032' },
    { name: 'Docker', icon: 'fa-brands fa-docker', color: '#2496ed' }
  ];

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.startTyping();
  }

  ngOnDestroy(): void {
    if (this.typeTimeout) {
      clearTimeout(this.typeTimeout);
    }
  }

  private startTyping(): void {
    const currentFullQuote = this.quotes[this.quoteIndex];

    if (this.isDeleting) {
      this.currentQuote = currentFullQuote.substring(0, this.charIndex - 1);
      this.charIndex--;
    } else {
      this.currentQuote = currentFullQuote.substring(0, this.charIndex + 1);
      this.charIndex++;
    }

    this.cdr.detectChanges();

    let typeSpeed = this.isDeleting ? 20 : 50;
    // Add some randomness to typing speed for realism
    if (!this.isDeleting) {
      typeSpeed += Math.random() * 20;
    }

    if (!this.isDeleting && this.charIndex === currentFullQuote.length) {
      typeSpeed = 4000;
      this.isDeleting = true;
    } else if (this.isDeleting && this.charIndex === 0) {
      this.isDeleting = false;
      this.quoteIndex = (this.quoteIndex + 1) % this.quotes.length;
      typeSpeed = 500;
    }

    this.typeTimeout = setTimeout(() => {
      this.startTyping();
    }, typeSpeed);
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
