import { Component, AfterViewInit, OnDestroy, ElementRef, Renderer2, inject } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGithub, faYoutube, faInstagram, faSteam } from '@fortawesome/free-brands-svg-icons';

@Component({
  selector: 'app-social-widget',
  standalone: true,
  templateUrl: './social-widget.component.html',
  styleUrls: ['./social-widget.component.scss'],
  imports: [FontAwesomeModule]
})
export class SocialWidgetComponent implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  faGithub = faGithub;
  faYoutube = faYoutube;
  faInstagram = faInstagram;
  faSteam = faSteam;

  private unlistenFunctions: (() => void)[] = [];

  ngAfterViewInit(): void {
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

  ngOnDestroy(): void {
    this.unlistenFunctions.forEach(unlisten => unlisten());
    this.unlistenFunctions = [];
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
}
