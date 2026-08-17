import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectorRef,
  NgZone,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../navbar/navbar.component';
import { PortfolioService } from '../portfolio.service';
import { CategoryPreview } from '../portfolio.model';

const CATEGORY_SUBTITLES: Record<string, string> = {
  architecture: 'Thoughtful design from concept to structure',
  interior: 'Spaces crafted for living and experience',
  turnkey: 'Complete project delivery, end-to-end',
  siteexecution: 'On-site construction and project execution',
};

@Component({
  selector: 'app-portfolio-list',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  template: `
    <div class="portfolio-page">
      <app-navbar></app-navbar>

      <main class="page-content">

        <div class="page-header">
          <h1 class="page-title">Portfolio</h1>
          <p class="page-subtitle">Explore our work across four disciplines</p>
        </div>

        <!-- Loading Skeletons -->
        <div *ngIf="isLoading" class="categories-grid">
          <div *ngFor="let s of skeletons" class="cat-card skeleton-card">
            <div class="skeleton skeleton-img-full"></div>
            <div class="cat-info">
              <div class="skeleton skeleton-title"></div>
              <div class="skeleton skeleton-sub"></div>
            </div>
          </div>
        </div>

        <!-- Error -->
        <div *ngIf="!isLoading && loadError" class="state-box">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h3>Could not load portfolio</h3>
          <p>Please try again later.</p>
        </div>

        <!-- Category Cards -->
        <div *ngIf="!isLoading && !loadError" class="categories-grid">
          <div
            *ngFor="let cat of categories"
            class="cat-card"
            (click)="goToCategory(cat.slug)"
            (mouseenter)="hoveredSlug = cat.slug"
            (mouseleave)="hoveredSlug = null">

            <div class="cat-image-wrap">
              <ng-container *ngFor="let img of cat.previewImages; let i = index">
                <img
                  [src]="img"
                  [alt]="cat.title"
                  class="cat-img"
                  [class.active]="i === (imgIndex[cat.slug] ?? 0)"
                  loading="lazy"
                />
              </ng-container>
              <div class="cat-placeholder" *ngIf="cat.previewImages.length === 0">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                  <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </div>
              <div class="cat-overlay" [class.visible]="hoveredSlug === cat.slug">
                <span class="overlay-label">Explore Category</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </div>
              <div class="project-count-badge">{{ cat.projectCount }} {{ cat.projectCount === 1 ? 'Project' : 'Projects' }}</div>
            </div>

            <div class="cat-info">
              <h2 class="cat-title">{{ cat.title }}</h2>
              <p class="cat-subtitle">{{ subtitles[cat.slug] }}</p>
            </div>

          </div>
        </div>

      </main>
    </div>
  `,
  styles: [`
    .portfolio-page {
      background: var(--bg-primary);
      min-height: 100vh;
      transition: background 0.3s ease;
    }

    .page-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 48px 24px 80px;
    }

    .page-header {
      text-align: center;
      margin-bottom: 52px;
    }

    .page-title {
      font-size: 36px;
      font-weight: 700;
      letter-spacing: 2px;
      color: var(--text-primary);
      margin: 0 0 10px;
      text-transform: uppercase;
    }

    .page-subtitle {
      font-size: 15px;
      color: var(--text-secondary);
      margin: 0;
    }

    .categories-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 32px;
    }

    @media (max-width: 700px) {
      .categories-grid { grid-template-columns: 1fr; }
      .page-title { font-size: 26px; }
    }

    .cat-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: var(--card-shadow);
      cursor: pointer;
      transition: transform 0.28s ease, box-shadow 0.28s ease;
    }

    .cat-card:hover {
      transform: translateY(-6px);
      box-shadow: var(--card-shadow-hover);
    }

    .cat-image-wrap {
      position: relative;
      width: 100%;
      height: 280px;
      background: var(--bg-secondary);
      overflow: hidden;
    }

    .cat-img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0;
      transition: opacity 0.9s ease;
    }

    .cat-img.active { opacity: 1; }

    .cat-placeholder {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      opacity: 0.3;
    }

    .cat-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.52);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      color: #fff;
      font-size: 15px;
      font-weight: 600;
      letter-spacing: 1px;
      opacity: 0;
      transition: opacity 0.3s ease;
      text-transform: uppercase;
    }

    .cat-overlay.visible { opacity: 1; }

    .project-count-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      background: rgba(0, 0, 0, 0.6);
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 20px;
      letter-spacing: 0.5px;
    }

    .cat-info {
      padding: 20px 24px 24px;
    }

    .cat-title {
      font-size: 20px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 6px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }

    .cat-subtitle {
      font-size: 13px;
      color: var(--text-secondary);
      margin: 0;
      line-height: 1.6;
    }

    /* ---- SKELETON ---- */
    .skeleton-card {
      pointer-events: none;
    }

    .skeleton {
      background: linear-gradient(
        90deg,
        var(--skeleton-base) 25%,
        var(--skeleton-shine) 50%,
        var(--skeleton-base) 75%
      );
      background-size: 600px 100%;
      animation: shimmer 1.4s ease infinite;
      border-radius: 4px;
    }

    .skeleton-img-full {
      width: 100%;
      height: 280px;
      border-radius: 0;
    }

    .skeleton-title {
      height: 20px;
      width: 50%;
      margin-bottom: 10px;
    }

    .skeleton-sub {
      height: 13px;
      width: 80%;
    }

    /* ---- STATE ---- */
    .state-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      gap: 14px;
      text-align: center;
      color: var(--text-muted);
    }

    .state-box svg { opacity: 0.4; }

    .state-box h3 {
      font-size: 20px;
      font-weight: 600;
      color: var(--text-secondary);
      margin: 0;
    }

    .state-box p {
      font-size: 14px;
      color: var(--text-muted);
      margin: 0;
    }
  `]
})
export class PortfolioListComponent implements OnInit, OnDestroy {
  private portfolioService = inject(PortfolioService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  categories: CategoryPreview[] = [];
  isLoading = true;
  loadError = false;
  hoveredSlug: string | null = null;
  imgIndex: Record<string, number> = {};
  readonly subtitles = CATEGORY_SUBTITLES;
  readonly skeletons = [1, 2, 3, 4];

  private timers: Record<string, ReturnType<typeof setInterval>> = {};

  ngOnInit(): void {
    this.portfolioService.getHomePreview().subscribe({
      next: (data) => {
        this.categories = data;
        this.isLoading = false;
        data.forEach(cat => { this.imgIndex[cat.slug] = 0; });
        this.cdr.detectChanges();
        if (this.isBrowser) {
          data.forEach(cat => this.startRotation(cat));
        }
      },
      error: () => {
        this.isLoading = false;
        this.loadError = true;
        this.cdr.detectChanges();
      }
    });
  }

  goToCategory(slug: string): void {
    this.router.navigate(['/portfolio/category', slug]);
  }

  private startRotation(cat: CategoryPreview): void {
    if (cat.previewImages.length <= 1) return;
    this.timers[cat.slug] = setInterval(() => {
      this.zone.run(() => {
        const n = cat.previewImages.length;
        this.imgIndex[cat.slug] = ((this.imgIndex[cat.slug] ?? 0) + 1) % n;
        this.cdr.detectChanges();
      });
    }, 3500);
  }

  ngOnDestroy(): void {
    Object.values(this.timers).forEach(t => clearInterval(t));
  }
}
