import { Component, OnDestroy, OnInit, inject, NgZone, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { ContactComponent } from '../contact/contact.component';
import { PortfolioService } from '../portfolio/portfolio.service';
import { CategoryPreview, CategoryProjectItem } from '../portfolio/portfolio.model';
import { ApiService, OurLeader } from '../services/api.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, NavbarComponent, ContactComponent],
  styleUrls: ['../app.css'],
  template: `
    <!-- ===== HERO CAROUSEL (fixed, behind) ===== -->
    <div class="landing-image-container">

      <div *ngIf="heroLoading" class="slide hero-loader">
        <img src="/assets/logo/7hiveblack.png" alt="7HIVE" class="hero-logo">
      </div>

      <div *ngIf="!heroLoading && slides.length === 0" class="slide hero-loader">
        <img src="/assets/logo/7hiveblack.png" alt="7HIVE" class="hero-logo">
        <p class="hero-slogan">ARCHITECTURE | INTERIOR | TURNKEY</p>
      </div>

      <div class="slides" *ngIf="!heroLoading && slides.length > 0"
           [style.width]="(slides.length * 100) + 'vw'"
           [style.transform]="'translateX(-' + (currentIndex * 100) + 'vw)'">
        <div class="slide" *ngFor="let img of slides"
             [style.background-image]="slideStyle(img)">
          <img src="/assets/logo/7hiveblack.png" alt="7HIVE" class="hero-logo">
          <p class="hero-slogan">ARCHITECTURE | INTERIOR | TURNKEY</p>
        </div>
      </div>

    </div>

    <!-- ===== SCROLLABLE CONTENT ===== -->
    <div class="main-content">
      <app-navbar></app-navbar>

      <!-- ===== OUR LEADER ===== -->
      <section class="leader-section" *ngIf="leader">
        <div class="leader-card">
          <div class="leader-img-wrap">
            <img [src]="leader.filepath" [alt]="leader.title" class="leader-img" />
          </div>
          <div class="leader-content">
            <h2 class="leader-title">{{ leader.title }}</h2>
            <p class="leader-desc">{{ leader.description }}</p>
          </div>
        </div>
      </section>

      <!-- ===== CATEGORY CARDS ===== -->
      <section class="categories-section">
        <div class="section-header">
          <h2 class="section-title">Our Work</h2>
          <p class="section-sub">Explore our portfolio across four disciplines</p>
        </div>

        <!-- Loading -->
        <div *ngIf="isLoading" class="cat-grid">
          <div *ngFor="let s of [1,2,3,4]" class="cat-card skeleton-card">
            <div class="skeleton-fill"></div>
          </div>
        </div>

        <!-- Loaded -->
        <div *ngIf="!isLoading" class="cat-grid">
          <div
            *ngFor="let cat of categories"
            class="cat-card"
            (mouseenter)="hoveredSlug = cat.slug"
            (mouseleave)="hoveredSlug = null"
            (click)="openModal(cat)">

            <div class="cat-images-wrap">
              <ng-container *ngFor="let img of cat.previewImages; let i = index">
                <img
                  [src]="img"
                  [alt]="cat.title"
                  class="cat-bg-img"
                  [class.active]="i === (imgIndex[cat.slug] ?? 0)"
                />
              </ng-container>
              <div class="cat-dark-fill" *ngIf="cat.previewImages.length === 0"></div>
            </div>

            <div class="cat-overlay" [class.hover-active]="hoveredSlug === cat.slug">
              <div class="cat-label-wrap">
                <h3 class="cat-label">{{ cat.title }}</h3>
                <p class="cat-count">{{ cat.projectCount }} {{ cat.projectCount === 1 ? 'Project' : 'Projects' }}</p>
              </div>
              <div class="view-all-badge" [class.visible]="hoveredSlug === cat.slug">
                Explore
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </div>
            </div>

          </div>
        </div>
      </section>

      <app-contact></app-contact>
    </div>

    <!-- ===== MODAL ===== -->
    <div class="modal-backdrop" [class.open]="modalOpen" (click)="closeModal()">
      <div class="modal-panel" (click)="$event.stopPropagation()" *ngIf="modalCategory">

        <div class="modal-header">
          <h2 class="modal-title">{{ modalCategory.title }}</h2>
          <button class="modal-close" (click)="closeModal()" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <div *ngIf="modalCategory.projects.length === 0" class="modal-empty">
            <p>No projects in this category yet.</p>
          </div>

          <div class="modal-projects-grid">
            <div
              *ngFor="let p of modalCategory.projects"
              class="modal-project-card"
              (click)="goToProject(p)">

              <div class="modal-card-img-wrap">
                <img *ngIf="p.coverImage" [src]="p.coverImage" [alt]="p.projectTitle" class="modal-card-img" />
                <div class="modal-card-placeholder" *ngIf="!p.coverImage">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                </div>
              </div>

              <div class="modal-card-info">
                <h3 class="modal-card-title">{{ p.projectTitle }}</h3>
                <p class="modal-card-desc">{{ p.shortDescription }}</p>
                <div class="modal-card-meta" *ngIf="p.location || p.year">
                  <span *ngIf="p.location">{{ p.location }}</span>
                  <span *ngIf="p.year">{{ p.year }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="view-all-btn" (click)="goToCategory(modalCategory.slug)">
            View All {{ modalCategory.title }} Projects
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    /* ===== OUR LEADER SECTION ===== */
    .leader-section {
      padding: 56px 32px 0;
      max-width: 1200px;
      margin: 0 auto;
    }

    .leader-card {
      display: grid;
      grid-template-columns: 160px 1fr;
      gap: 40px;
      align-items: center;
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 20px;
      box-shadow: var(--card-shadow);
    }

    @media (max-width: 800px) {
      .leader-card {
        grid-template-columns: 120px 1fr;
        gap: 16px;
        padding: 16px;
      }

      .leader-title {
        font-size: 18px;
      }

      .leader-desc {
        font-size: 13px;
      }
    }

    .leader-img-wrap {
      width: 100%;
      aspect-ratio: 3 / 4;
      border-radius: 14px;
      overflow: hidden;
      flex-shrink: 0;
    }

    .leader-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .leader-eyebrow {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      color: var(--text-muted);
      margin: 0 0 14px;
    }

    .leader-title {
      font-size: 28px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 20px;
      line-height: 1.25;
      letter-spacing: 0.5px;
    }

    .leader-desc {
      font-size: 15px;
      color: var(--text-secondary);
      line-height: 1.75;
      margin: 0;
    }

    /* ===== CATEGORY CARDS SECTION ===== */
    .categories-section {
      padding: 56px 32px 64px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .section-header {
      text-align: center;
      margin-bottom: 40px;
    }

    .section-title {
      font-size: 30px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: var(--text-primary);
      margin: 0 0 10px;
    }

    .section-sub {
      font-size: 14px;
      color: var(--text-secondary);
      margin: 0;
    }

    .cat-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 28px;
    }

    @media (max-width: 700px) {
      .cat-grid { grid-template-columns: 1fr; gap: 20px; }
      .categories-section { padding: 40px 20px 56px; }
      .section-title { font-size: 22px; }
    }

    .cat-card {
      position: relative;
      border-radius: 16px;
      overflow: hidden;
      cursor: pointer;
      height: 340px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.15);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .cat-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 12px 40px rgba(0,0,0,0.25);
    }

    .skeleton-card {
      cursor: default;
      background: var(--bg-secondary);
    }

    .skeleton-card:hover {
      transform: none;
      box-shadow: 0 4px 24px rgba(0,0,0,0.15);
    }

    .skeleton-fill {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        90deg,
        var(--skeleton-base) 25%,
        var(--skeleton-shine) 50%,
        var(--skeleton-base) 75%
      );
      background-size: 600px 100%;
      animation: shimmer 1.4s ease infinite;
    }

    .cat-images-wrap {
      position: absolute;
      inset: 0;
    }

    .cat-bg-img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0;
      transition: opacity 1s ease;
    }

    .cat-bg-img.active { opacity: 1; }

    .cat-dark-fill {
      position: absolute;
      inset: 0;
      background: #1a1a1a;
    }

    .cat-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        to top,
        rgba(0,0,0,0.72) 0%,
        rgba(0,0,0,0.1) 55%,
        rgba(0,0,0,0.04) 100%
      );
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 24px 26px;
      transition: background 0.35s ease;
    }

    .cat-overlay.hover-active {
      background: linear-gradient(
        to top,
        rgba(0,0,0,0.86) 0%,
        rgba(0,0,0,0.3) 55%,
        rgba(0,0,0,0.12) 100%
      );
    }

    .cat-label-wrap {
      margin-bottom: 10px;
    }

    .cat-label {
      font-size: 20px;
      font-weight: 700;
      color: #fff;
      margin: 0 0 5px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    .cat-count {
      font-size: 12px;
      color: rgba(255,255,255,0.6);
      margin: 0;
      font-weight: 500;
    }

    .view-all-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #fff;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      border: 1px solid rgba(255,255,255,0.55);
      padding: 6px 14px;
      border-radius: 4px;
      width: fit-content;
      opacity: 0;
      transform: translateY(8px);
      transition: opacity 0.3s ease, transform 0.3s ease;
    }

    .view-all-badge.visible {
      opacity: 1;
      transform: translateY(0);
    }

    /* ===== MODAL ===== */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
      padding: 16px;
    }

    .modal-backdrop.open {
      opacity: 1;
      pointer-events: auto;
    }

    .modal-panel {
      background: var(--card-bg);
      border-radius: 16px;
      width: 100%;
      max-width: 820px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 24px 64px rgba(0,0,0,0.4);
      overflow: hidden;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 22px 28px;
      border-bottom: 1px solid var(--border-color);
      flex-shrink: 0;
    }

    .modal-title {
      font-size: 22px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }

    .modal-close {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      transition: color 0.2s;
    }

    .modal-close:hover { color: var(--text-primary); }

    .modal-body {
      flex: 1;
      overflow-y: auto;
      padding: 24px 28px;
    }

    .modal-empty {
      text-align: center;
      padding: 48px 0;
      color: var(--text-muted);
      font-size: 14px;
    }

    .modal-projects-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    @media (max-width: 560px) {
      .modal-projects-grid { grid-template-columns: 1fr; }
      .modal-header { padding: 18px 20px; }
      .modal-body { padding: 16px 20px; }
    }

    .modal-project-card {
      border: 1px solid var(--border-color);
      border-radius: 10px;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      background: var(--bg-secondary);
    }

    .modal-project-card:hover {
      transform: translateY(-3px);
      box-shadow: var(--card-shadow-hover);
    }

    .modal-card-img-wrap {
      width: 100%;
      height: 150px;
      position: relative;
      background: var(--bg-secondary);
      overflow: hidden;
    }

    .modal-card-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .modal-card-placeholder {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      opacity: 0.3;
    }

    .modal-card-info {
      padding: 12px 14px 14px;
    }

    .modal-card-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 5px;
      line-height: 1.3;
    }

    .modal-card-desc {
      font-size: 12px;
      color: var(--text-secondary);
      margin: 0 0 8px;
      line-height: 1.55;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .modal-card-meta {
      display: flex;
      gap: 8px;
      font-size: 11px;
      color: var(--text-muted);
      font-weight: 500;
    }

    .modal-card-meta span::after {
      content: '·';
      margin-left: 8px;
    }

    .modal-card-meta span:last-child::after {
      content: '';
      margin: 0;
    }

    .modal-footer {
      padding: 18px 28px;
      border-top: 1px solid var(--border-color);
      flex-shrink: 0;
      display: flex;
      justify-content: center;
    }

    .view-all-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--text-primary);
      color: var(--bg-primary);
      border: none;
      border-radius: 8px;
      padding: 12px 24px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.5px;
      cursor: pointer;
      transition: opacity 0.2s ease;
    }

    .view-all-btn:hover { opacity: 0.85; }
  `]
})
export class HomePageComponent implements OnInit, OnDestroy {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly portfolioService = inject(PortfolioService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  /* ---- hero carousel ---- */
  slides: string[] = [];
  currentIndex = 0;
  heroLoading = true;
  private carouselTimer?: ReturnType<typeof setInterval>;

  /* ---- leader ---- */
  leader: OurLeader | null = null;

  /* ---- category cards ---- */
  categories: CategoryPreview[] = [];
  isLoading = true;
  imgIndex: Record<string, number> = {};
  hoveredSlug: string | null = null;
  private catTimers: Record<string, ReturnType<typeof setInterval>> = {};

  /* ---- modal ---- */
  modalOpen = false;
  modalCategory: CategoryPreview | null = null;

  ngOnInit(): void {
    /* Hero carousel */
    this.api.getProjectImages().subscribe({
      next: (res) => {
        this.slides = (res ?? []).map(img => img.filepath).slice(0, 6);
        this.heroLoading = false;
        this.cdr.detectChanges();
        if (this.isBrowser && this.slides.length > 1) {
          this.carouselTimer = setInterval(() => {
            this.zone.run(() => {
              this.currentIndex = (this.currentIndex + 1) % this.slides.length;
              this.cdr.detectChanges();
            });
          }, 5000);
        }
      },
      error: () => {
        this.heroLoading = false;
        this.cdr.detectChanges();
      }
    });

    /* Our leader */
    this.api.getOurLeader().subscribe({
      next: (data) => { this.leader = data; this.cdr.detectChanges(); },
      error: () => { /* no leader set yet — silently skip */ }
    });

    /* Category cards */
    this.portfolioService.getHomePreview().subscribe({
      next: (data) => {
        this.categories = data;
        this.isLoading = false;
        data.forEach(cat => { this.imgIndex[cat.slug] = 0; });
        this.cdr.detectChanges();
        if (this.isBrowser) {
          data.forEach(cat => this.startCatRotation(cat));
        }
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  slideStyle(img: string): string {
    return `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url('${img}')`;
  }

  openModal(cat: CategoryPreview): void {
    this.modalCategory = cat;
    this.modalOpen = true;
    this.cdr.detectChanges();
  }

  closeModal(): void {
    this.modalOpen = false;
    this.cdr.detectChanges();
  }

  goToProject(p: CategoryProjectItem): void {
    this.closeModal();
    this.router.navigate(['/portfolio/project', p.portfolioProjectId]);
  }

  goToCategory(slug: string): void {
    this.closeModal();
    this.router.navigate(['/portfolio/category', slug]);
  }

  private startCatRotation(cat: CategoryPreview): void {
    if (cat.previewImages.length <= 1) return;
    this.catTimers[cat.slug] = setInterval(() => {
      this.zone.run(() => {
        const n = cat.previewImages.length;
        this.imgIndex[cat.slug] = ((this.imgIndex[cat.slug] ?? 0) + 1) % n;
        this.cdr.detectChanges();
      });
    }, 4000);
  }

  ngOnDestroy(): void {
    if (this.carouselTimer) clearInterval(this.carouselTimer);
    Object.values(this.catTimers).forEach(t => clearInterval(t));
  }
}
