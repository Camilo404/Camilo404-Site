import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      class="theme-toggle-btn"
      (click)="themeService.toggleTheme()"
      [attr.title]="themeService.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
      [attr.aria-label]="themeService.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
    >
      <div class="theme-toggle-track">
        <div class="theme-toggle-icons">
          <i class="fa-solid fa-moon" [class.active]="themeService.isDark()"></i>
          <i class="fa-solid fa-sun" [class.active]="!themeService.isDark()"></i>
        </div>
        <div class="theme-toggle-thumb" [class.dark]="themeService.isDark()"></div>
      </div>
    </button>
  `,
  styleUrl: './theme-toggle.component.scss',
})
export class ThemeToggleComponent {
  themeService = inject(ThemeService);
}
