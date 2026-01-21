import { Component, ViewChild, ElementRef, ChangeDetectorRef, OnInit, OnDestroy, AfterViewInit, Renderer2 } from '@angular/core';

import { Router, RouterModule } from '@angular/router';
import { Card3DEffectService } from '../../services/card-3d-effect.service';
import { NekoComponent } from '../neko/neko.component';
import { EtherealShadowComponent } from '../ethereal-shadow/ethereal-shadow.component';
import { CardProfileComponent } from '../card-profile/card-profile.component';
import { FloatingActivityComponent } from '../floating-activity/floating-activity.component';
import { ClockComponent } from '../clock/clock.component';
import { SearchModalComponent } from '../search-modal/search-modal.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTerminal, faCode, faSearch } from '@fortawesome/free-solid-svg-icons';
import { faAngular, faReact, faBootstrap, faPython, faJs, faSass, faHtml5, faCss3Alt, faNodeJs, faGitAlt, faDocker, faGithub, faYoutube, faInstagram, faSteam } from '@fortawesome/free-brands-svg-icons';

@Component({
    selector: 'app-main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss'],
    imports: [
    RouterModule,
    NekoComponent,
    EtherealShadowComponent,
    CardProfileComponent,
    FloatingActivityComponent,
    ClockComponent,
    SearchModalComponent,
    FontAwesomeModule
]
})
export class MainComponent implements OnInit, OnDestroy, AfterViewInit {

  // FontAwesome Icons
  faTerminal = faTerminal;
  faSearch = faSearch;
  
  // Brand Icons
  faGithub = faGithub;
  faYoutube = faYoutube;
  faInstagram = faInstagram;
  faSteam = faSteam;

  public isModalOpen: boolean = false;
  public isActivityVisible: boolean = false;


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
    { name: 'Angular', icon: faAngular, color: '#dd0031' },
    { name: 'React', icon: faReact, color: '#61dafb' },
    { name: 'Bootstrap', icon: faBootstrap, color: '#7952b3' },
    { name: 'Python', icon: faPython, color: '#3776ab' },
    { name: 'JavaScript', icon: faJs, color: '#f0db4f' },
    { name: 'TypeScript', icon: faCode, color: '#3178c6' },
    { name: 'Sass', icon: faSass, color: '#cc6699' },
    { name: 'HTML5', icon: faHtml5, color: '#e34f26' },
    { name: 'CSS3', icon: faCss3Alt, color: '#264de4' },
    { name: 'Node.js', icon: faNodeJs, color: '#339933' },
    { name: 'Git', icon: faGitAlt, color: '#f05032' },
    { name: 'Docker', icon: faDocker, color: '#2496ed' }
  ];

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private el: ElementRef,
    private renderer: Renderer2,
    private card3DService: Card3DEffectService
  ) { }

  ngOnInit(): void {
    this.startTyping();
  }

  private unlistenFunctions: (() => void)[] = [];

  ngAfterViewInit(): void {
    const cards = this.el.nativeElement.querySelectorAll('.widget-card');
    cards.forEach((card: HTMLElement) => {
      const unlistenMove = this.renderer.listen(card, 'mousemove', (e: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });
      this.unlistenFunctions.push(unlistenMove);

      this.card3DService.initCard3DEffect(new ElementRef(card), {
        maxRotation: 5,
        scale: 1.02
      });
    });

    const socialItems = this.el.nativeElement.querySelectorAll('.social-item');
    socialItems.forEach((item: HTMLElement) => {
      const nameSpan = item.querySelector('.item-name') as HTMLElement;
      if (nameSpan) {
        const originalText = nameSpan.innerText;
        item.dataset['originalText'] = originalText;

        const unlistenEnter = this.renderer.listen(item, 'mouseenter', () => {
          this.scrambleText(nameSpan, originalText);
        });
        this.unlistenFunctions.push(unlistenEnter);
      }
    });
  }

  private scrambleText(element: HTMLElement, originalText: string): void {
    const chars = '!<>-/[]{}—=+*^?#________';
    let iterations = 0;

    const existingInterval = element.dataset['intervalId'];
    if (existingInterval) clearInterval(parseInt(existingInterval));

    const interval = setInterval(() => {
      element.innerText = originalText
        .split('')
        .map((letter, index) => {
          if (index < iterations) {
            return originalText[index];
          }
          return chars[Math.floor(Math.random() * chars.length)];
        })
        .join('');

      if (iterations >= originalText.length) {
        clearInterval(interval);
        element.dataset['intervalId'] = '';
      }

      iterations += 1 / 3;
    }, 30);

    element.dataset['intervalId'] = interval.toString();
  }

  ngOnDestroy(): void {
    this.unlistenFunctions.forEach(unlisten => unlisten());
    this.unlistenFunctions = [];
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

  public onActivityVisibilityChange(isVisible: boolean): void {
    this.isActivityVisible = isVisible;
    this.cdr.detectChanges();
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
