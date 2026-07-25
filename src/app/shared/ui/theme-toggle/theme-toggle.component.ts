import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  template: `
    <button
      class="theme-toggle-btn"
      [class.is-dark]="themeService.isDark()"
      (click)="themeService.toggleTheme()"
      [attr.title]="themeService.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
      [attr.aria-label]="themeService.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
    >
      <div class="toggle-track">
        <div class="toggle-thumb">
          <fa-icon [icon]="themeService.isDark() ? faMoon : faSun"></fa-icon>
        </div>
      </div>
    </button>
  `,
  styleUrl: './theme-toggle.component.scss',
})
export class ThemeToggleComponent {
  themeService = inject(ThemeService);
  readonly faMoon = faMoon;
  readonly faSun = faSun;
}
