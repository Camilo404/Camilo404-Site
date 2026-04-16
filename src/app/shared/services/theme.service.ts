import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly STORAGE_KEY = 'theme';

  isDark = signal<boolean>(this.getInitialTheme());
  isLight = computed(() => !this.isDark());

  private getInitialTheme(): boolean {
    if (typeof localStorage === 'undefined') return true;
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) return stored === 'dark';
    return document.documentElement.classList.contains('dark');
  }

  toggleTheme(): void {
    const switchTheme = () => {
      const newIsDark = !this.isDark();
      this.isDark.set(newIsDark);

      const htmlEl = document.documentElement;
      if (newIsDark) {
        htmlEl.classList.add('dark');
      } else {
        htmlEl.classList.remove('dark');
      }

      localStorage.setItem(this.STORAGE_KEY, newIsDark ? 'dark' : 'light');

      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      if (themeColorMeta) {
        themeColorMeta.setAttribute('content', newIsDark ? '#1e1e1e' : '#f5f5f5');
      }
    };

    const doc = document as Document & { startViewTransition?: (callback: () => void) => void };
    if (!doc.startViewTransition) {
      switchTheme();
      return;
    }

    doc.startViewTransition(switchTheme);
  }
}
