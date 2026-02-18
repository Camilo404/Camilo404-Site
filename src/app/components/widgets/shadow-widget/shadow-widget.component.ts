import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTerminal } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-shadow-widget',
  standalone: true,
  templateUrl: './shadow-widget.component.html',
  styleUrls: ['./shadow-widget.component.scss'],
  imports: [FontAwesomeModule]
})
export class ShadowWidgetComponent implements OnInit, OnDestroy {
  faTerminal = faTerminal;
  currentQuote = signal('');

  private quotes: string[] = [
    "The world doesn't need heroes, it needs someone to pull the strings from the shadows.",
    "I am the one who lurks in the shadows to hunt the shadows.",
    "I seek neither power nor glory. I only seek to be the Eminence in Shadow.",
    "True power is not in the light, but in the darkness that swallows it.",
    "The hour of awakening is at hand.",
    "I am Atomic."
  ];
  private typeTimeout: ReturnType<typeof setTimeout> | undefined;
  private quoteIndex = signal(0);
  private charIndex = signal(0);
  private isDeleting = signal(false);

  ngOnInit(): void {
    this.startTyping();
  }

  ngOnDestroy(): void {
    if (this.typeTimeout) {
      clearTimeout(this.typeTimeout);
    }
  }

  private startTyping(): void {
    const currentFullQuote = this.quotes[this.quoteIndex()];
    const isDeleting = this.isDeleting();
    const charIdx = this.charIndex();

    if (isDeleting) {
      this.currentQuote.set(currentFullQuote.substring(0, charIdx - 1));
      this.charIndex.update(i => i - 1);
    } else {
      this.currentQuote.set(currentFullQuote.substring(0, charIdx + 1));
      this.charIndex.update(i => i + 1);
    }

    let typeSpeed = isDeleting ? 20 : 50;
    if (!isDeleting) {
      typeSpeed += Math.random() * 20;
    }

    const newCharIdx = this.charIndex();
    if (!isDeleting && newCharIdx === currentFullQuote.length) {
      typeSpeed = 4000;
      this.isDeleting.set(true);
    } else if (isDeleting && newCharIdx === 0) {
      this.isDeleting.set(false);
      this.quoteIndex.update(i => (i + 1) % this.quotes.length);
      typeSpeed = 500;
    }

    this.typeTimeout = setTimeout(() => {
      this.startTyping();
    }, typeSpeed);
  }
}
