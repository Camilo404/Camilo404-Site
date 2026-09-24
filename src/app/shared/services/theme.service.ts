import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly STORAGE_KEY = 'theme';

  isDark = signal<boolean>(this.getInitialTheme());
  isLight = computed(() => !this.isDark());

  private getInitialTheme(): boolean {
    const stored = this.readStoredTheme();
    if (stored) return stored === 'dark';
    return document.documentElement.classList.contains('dark');
  }

  // Storage access throws in some private/blocked-cookie modes
  private readStoredTheme(): string | null {
    try {
      return localStorage.getItem(this.STORAGE_KEY);
    } catch {
      return null;
    }
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

      try {
        localStorage.setItem(this.STORAGE_KEY, newIsDark ? 'dark' : 'light');
      } catch {
        // Theme still applies for this visit, it just won't persist
      }

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
