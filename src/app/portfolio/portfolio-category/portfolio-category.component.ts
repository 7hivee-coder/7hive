import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectorRef,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../../navbar/navbar.component';
import { PortfolioService } from '../portfolio.service';
import { PortfolioListItem } from '../portfolio.model';

const CATEGORY_LABELS: Record<string, string> = {
  architecture: 'Architecture',
  interior: 'Interior',
  turnkey: 'Turnkey',
  siteexecution: 'Site Execution',
};

const CATEGORY_SUBTITLES: Record<string, string> = {
  architecture: 'Thoughtful design from concept to structure',
  interior: 'Spaces crafted for living and experience',
  turnkey: 'Complete project delivery, end-to-end',
  siteexecution: 'On-site construction and project execution',
};

interface ProjectCard extends PortfolioListItem {
  imageState: 'loading' | 'loaded' | 'error';
  imageTimeout?: ReturnType<typeof setTimeout>;
}

@Component({
  selector: 'app-portfolio-category',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  template: `
    <div class="category-page">
      <app-navbar></app-navbar>

      <main class="page-content">

        <button class="back-btn" (click)="goBack()">
          ← All Categories
        </button>

        <div class="page-header">
          <h1 class="page-title">{{ categoryLabel }}</h1>
          <p class="page-subtitle">{{ categorySubtitle }}</p>
        </div>

        <!-- Loading Skeletons -->
        <div *ngIf="isLoading" class="cards-grid">
          <div *ngFor="let s of skeletons" class="card">
            <div class="card-image-wrap">
              <div class="skeleton skeleton-img"></div>
            </div>
            <div class="card-body">
              <div class="skeleton skeleton-title-line"></div>
              <div class="skeleton skeleton-text-line"></div>
              <div class="skeleton skeleton-btn"></div>
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
          <h3>Something went wrong</h3>
          <p>Could not load projects. Please try again later.</p>
        </div>

        <!-- Empty -->
        <div *ngIf="!isLoading && !loadError && projects.length === 0" class="state-box">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"></rect>
            <path d="M3 9h18"></path>
            <path d="M9 21V9"></path>
          </svg>
          <h3>No Projects Yet</h3>
          <p>No projects in this category yet.</p>
        </div>

        <!-- Cards -->
        <div *ngIf="!isLoading && !loadError && projects.length > 0" class="cards-grid">
          <div
            *ngFor="let p of projects"
            class="card"
            (click)="goToDetail(p.portfolioProjectId)">

            <div class="card-image-wrap">
              <div class="skeleton skeleton-img" [class.hidden]="p.imageState !== 'loading'"></div>

              <img
                *ngIf="p.coverImage"
                [src]="p.coverImage"
                [alt]="p.projectTitle"
                class="card-img"
                [class.visible]="p.imageState === 'loaded'"
                (load)="onImageLoad(p)"
                (error)="onImageError(p)"
              />

              <div class="img-placeholder" *ngIf="!p.coverImage">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                  <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </div>

              <div class="img-error" [class.visible]="p.imageState === 'error'">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                </svg>
                <span>Image unavailable</span>
              </div>

              <div class="card-meta-overlay" *ngIf="p.location || p.year">
                <span *ngIf="p.location" class="meta-tag">{{ p.location }}</span>
                <span *ngIf="p.year" class="meta-tag">{{ p.year }}</span>
              </div>
            </div>

            <div class="card-body">
              <button class="view-btn" (click)="goToDetail(p.portfolioProjectId); $event.stopPropagation()">
                View Project
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>

          </div>
        </div>

      </main>
    </div>
  `,
  styles: [`
    .category-page {
      background: var(--bg-primary);
      min-height: 100vh;
      transition: background 0.3s ease;
    }

    .page-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 32px 24px 80px;
    }

    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: none;
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      font-size: 13px;
      font-weight: 600;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      margin-bottom: 32px;
      transition: color 0.2s, border-color 0.2s;
    }

    .back-btn:hover {
      color: var(--text-primary);
      border-color: var(--text-primary);
    }

    .page-header {
      text-align: center;
      margin-bottom: 48px;
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

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 28px;
    }

    @media (max-width: 900px) {
      .cards-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 560px) {
      .cards-grid { grid-template-columns: 1fr; }
      .page-title { font-size: 26px; }
    }

    .card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: var(--card-shadow);
      transition: transform 0.25s ease, box-shadow 0.25s ease;
      cursor: pointer;
    }

    .card:hover {
      transform: translateY(-5px);
      box-shadow: var(--card-shadow-hover);
    }

    .card:hover .view-btn {
      background: var(--text-primary);
      color: var(--bg-primary);
    }

    .card-image-wrap {
      position: relative;
      width: 100%;
      height: 220px;
      background: var(--bg-secondary);
      overflow: hidden;
    }

    .card-img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0;
      transition: opacity 0.35s ease;
    }

    .card-img.visible { opacity: 1; }

    .img-placeholder {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      opacity: 0.4;
    }

    .card-meta-overlay {
      position: absolute;
      bottom: 10px;
      left: 10px;
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .meta-tag {
      background: rgba(0,0,0,0.55);
      color: #fff;
      font-size: 11px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 20px;
      letter-spacing: 0.5px;
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
    }

    .skeleton-img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      transition: opacity 0.2s;
    }

    .skeleton-img.hidden {
      opacity: 0;
      pointer-events: none;
    }

    .skeleton-title-line {
      height: 16px;
      border-radius: 4px;
      margin-bottom: 10px;
      width: 60%;
    }

    .skeleton-text-line {
      height: 12px;
      border-radius: 4px;
      margin-bottom: 8px;
      width: 92%;
    }

    .skeleton-btn {
      height: 36px;
      border-radius: 8px;
      margin-top: 14px;
      width: 130px;
    }

    .img-error {
      position: absolute;
      inset: 0;
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: var(--error-bg);
      color: var(--error-color);
      text-align: center;
      padding: 16px;
      font-size: 12px;
      font-weight: 500;
    }

    .img-error.visible { display: flex; }

    .card-body {
      padding: 18px 20px 22px;
    }

    .view-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      font-size: 13px;
      font-weight: 600;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
      letter-spacing: 0.3px;
    }

    .view-btn:hover {
      background: var(--text-primary);
      color: var(--bg-primary);
      border-color: var(--text-primary);
    }

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
export class PortfolioCategoryComponent implements OnInit, OnDestroy {
  private portfolioService = inject(PortfolioService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  projects: ProjectCard[] = [];
  isLoading = true;
  loadError = false;
  categorySlug = '';
  readonly skeletons = [1, 2, 3, 4, 5, 6];

  get categoryLabel(): string {
    return CATEGORY_LABELS[this.categorySlug] ?? this.categorySlug;
  }

  get categorySubtitle(): string {
    return CATEGORY_SUBTITLES[this.categorySlug] ?? '';
  }

  ngOnInit(): void {
    this.categorySlug = this.route.snapshot.paramMap.get('categorySlug') ?? '';
    this.portfolioService.getPortfolioByCategory(this.categorySlug).subscribe({
      next: (data) => {
        this.projects = data.map(p => ({ ...p, imageState: 'loading' as const }));
        this.isLoading = false;
        this.cdr.detectChanges();
        if (this.isBrowser) {
          this.projects.forEach(p => this.startImageTimeout(p));
        }
      },
      error: () => {
        this.isLoading = false;
        this.loadError = true;
        this.cdr.detectChanges();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/portfolio']);
  }

  goToDetail(portfolioProjectId: string): void {
    this.router.navigate(['/portfolio/project', portfolioProjectId]);
  }

  onImageLoad(project: ProjectCard): void {
    if (project.imageTimeout) clearTimeout(project.imageTimeout);
    project.imageState = 'loaded';
    this.cdr.detectChanges();
  }

  onImageError(project: ProjectCard): void {
    if (project.imageTimeout) clearTimeout(project.imageTimeout);
    project.imageState = 'error';
    this.cdr.detectChanges();
  }

  private startImageTimeout(project: ProjectCard): void {
    project.imageTimeout = setTimeout(() => {
      if (project.imageState === 'loading') {
        project.imageState = 'error';
        this.cdr.detectChanges();
      }
    }, 20000);
  }

  ngOnDestroy(): void {
    this.projects.forEach(p => {
      if (p.imageTimeout) clearTimeout(p.imageTimeout);
    });
  }
}
