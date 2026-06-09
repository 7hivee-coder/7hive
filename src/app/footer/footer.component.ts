import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer } from '@angular/platform-browser';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  protected readonly theme = inject(ThemeService);

  get isDarkTheme(): boolean {
    return this.theme.isDarkTheme();
  }

  constructor(registry: MatIconRegistry, sanitizer: DomSanitizer) {
    registry.addSvgIconLiteral(
      'instagram',
      sanitizer.bypassSecurityTrustHtml(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="currentColor" stroke-width="2"/>
          <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/>
          <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"/>
        </svg>
      `)
    );
  }
}
