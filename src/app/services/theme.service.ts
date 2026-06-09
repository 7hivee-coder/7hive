import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly isDarkTheme = signal(false);

  init(): void {
    if (this.isBrowser) {
      const saved = localStorage.getItem('theme');
      this.isDarkTheme.set(saved === 'dark');
      this.applyClass();
    }
  }

  toggle(): void {
    this.isDarkTheme.set(!this.isDarkTheme());
    if (this.isBrowser) {
      localStorage.setItem('theme', this.isDarkTheme() ? 'dark' : 'light');
      this.applyClass();
    }
  }

  private applyClass(): void {
    if (this.isBrowser) {
      document.documentElement.classList.toggle('dark-theme', this.isDarkTheme());
    }
  }
}
