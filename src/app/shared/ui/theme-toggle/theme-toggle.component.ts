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
      [class.is-dark]="themeService.isDark()"
      (click)="themeService.toggleTheme()"
      [attr.title]="themeService.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
      [attr.aria-label]="themeService.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
    >
      <div class="toggle-track">
        <div class="toggle-thumb">
          <i class="fa-solid" [class.fa-moon]="themeService.isDark()" [class.fa-sun]="!themeService.isDark()"></i>
        </div>
      </div>
    </button>
  `,
  styleUrl: './theme-toggle.component.scss',
})
export class ThemeToggleComponent {
  themeService = inject(ThemeService);
}
