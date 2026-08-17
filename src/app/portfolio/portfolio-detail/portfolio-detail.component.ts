import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectorRef,
  NgZone,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../../navbar/navbar.component';
import { PortfolioService } from '../portfolio.service';
import { PortfolioDetail } from '../portfolio.model';

@Component({
  selector: 'app-portfolio-detail',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  template: `
    <div class="detail-page">
      <app-navbar></app-navbar>

      <main class="page-content">

        <!-- Loading Skeleton -->
        <div *ngIf="isLoading" class="skeleton-wrap">
          <div class="skeleton skeleton-carousel"></div>
          <div class="skeleton-info">
            <div class="skeleton skeleton-heading"></div>
            <div class="skeleton skeleton-line"></div>
            <div class="skeleton skeleton-line short"></div>
            <div class="skeleton skeleton-line"></div>
          </div>
        </div>

        <!-- Error State -->
        <div *ngIf="!isLoading && loadError" class="state-box">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h3>Project Not Found</h3>
          <p>This portfolio project could not be loaded.</p>
          <button class="back-btn" (click)="goBack()">← Back to Portfolio</button>
        </div>

        <!-- Project Detail -->
        <div *ngIf="!isLoading && !loadError && project">

          <!-- Back Link -->
          <button class="back-btn" (click)="goBack()">← Back to Portfolio</button>

          <!-- ======== CAROUSEL ======== -->
          <section *ngIf="project.mainFrameImages.length > 0" class="carousel-section">
            <div class="carousel">
              <div
                class="carousel-track"
                [style.transform]="'translateX(-' + (currentSlide * 100) + '%)'">
                <div
                  *ngFor="let img of project.mainFrameImages"
                  class="carousel-slide">
                  <img [src]="img.imageUrl" [alt]="project.projectTitle" class="carousel-img" />
                </div>
              </div>

              <!-- Prev / Next -->
              <button
                *ngIf="project.mainFrameImages.length > 1"
                class="carousel-btn prev"
                (click)="prevSlide()"
                aria-label="Previous image">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <button
                *ngIf="project.mainFrameImages.length > 1"
                class="carousel-btn next"
                (click)="nextSlide()"
                aria-label="Next image">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>

              <!-- Dots -->
              <div *ngIf="project.mainFrameImages.length > 1" class="carousel-dots">
                <button
                  *ngFor="let img of project.mainFrameImages; let i = index"
                  class="dot"
                  [class.active]="i === currentSlide"
                  (click)="goToSlide(i)"
                  [attr.aria-label]="'Go to image ' + (i + 1)">
                </button>
              </div>

              <!-- Counter -->
              <div *ngIf="project.mainFrameImages.length > 1" class="carousel-counter">
                {{ currentSlide + 1 }} / {{ project.mainFrameImages.length }}
              </div>
            </div>
          </section>

          <!-- ======== PROJECT INFO ======== -->
          <section class="info-section">
            <h1 class="project-title">{{ project.projectTitle }}</h1>
            <p *ngIf="project.fullDescription" class="project-full-desc">{{ project.fullDescription }}</p>
          </section>

          <!-- ======== PROGRESS GALLERY ======== -->
          <section *ngIf="project.progressStages.length > 0" class="progress-section">
            <h2 class="section-heading">Project Progress</h2>

            <div *ngFor="let stage of project.progressStages" class="stage-block">
              <div class="stage-header">
                <span class="stage-number">{{ stage.progressNumber }}</span>
                <div class="stage-meta">
                  <h3 class="stage-title">{{ stage.stageTitle }}</h3>
                  <p *ngIf="stage.description" class="stage-desc">{{ stage.description }}</p>
                </div>
              </div>

              <div *ngIf="stage.images.length > 0" class="stage-images">
                <div *ngFor="let imgUrl of stage.images" class="stage-img-wrap">
                  <img [src]="imgUrl" [alt]="stage.stageTitle" class="stage-img" loading="lazy" />
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  `,
  styles: [`
    .detail-page {
      background: var(--bg-primary);
      min-height: 100vh;
      transition: background 0.3s ease;
    }

    .page-content {
      max-width: 1100px;
      margin: 0 auto;
      padding: 32px 24px 80px;
    }

    /* ---- BACK BUTTON ---- */
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
      transition: color 0.2s, border-color 0.2s, background 0.2s;
    }

    .back-btn:hover {
      color: var(--text-primary);
      border-color: var(--text-primary);
    }

    /* ---- LOADING SKELETON ---- */
    .skeleton-wrap { display: flex; flex-direction: column; gap: 32px; }

    .skeleton {
      background: linear-gradient(
        90deg,
        var(--skeleton-base) 25%,
        var(--skeleton-shine) 50%,
        var(--skeleton-base) 75%
      );
      background-size: 600px 100%;
      animation: shimmer 1.4s ease infinite;
      border-radius: 12px;
    }

    .skeleton-carousel { height: 480px; width: 100%; }
    .skeleton-info { display: flex; flex-direction: column; gap: 12px; }
    .skeleton-heading { height: 36px; width: 45%; border-radius: 6px; }
    .skeleton-line { height: 14px; width: 80%; border-radius: 4px; }
    .skeleton-line.short { width: 55%; }

    /* ---- ERROR/EMPTY STATE ---- */
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
      margin: 0 0 8px;
    }

    /* ---- CAROUSEL ---- */
    .carousel-section { margin-bottom: 40px; }

    .carousel {
      position: relative;
      width: 100%;
      height: 500px;
      border-radius: 14px;
      overflow: hidden;
      background: var(--bg-secondary);
    }

    .carousel-track {
      display: flex;
      height: 100%;
      transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .carousel-slide {
      flex: 0 0 100%;
      height: 100%;
    }

    .carousel-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .carousel-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(0, 0, 0, 0.45);
      border: none;
      color: #fff;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.2s;
      z-index: 5;
    }

    .carousel-btn:hover { background: rgba(0, 0, 0, 0.7); }
    .carousel-btn.prev { left: 14px; }
    .carousel-btn.next { right: 14px; }

    .carousel-dots {
      position: absolute;
      bottom: 14px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 7px;
      z-index: 5;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: rgba(255,255,255,0.5);
      border: none;
      cursor: pointer;
      padding: 0;
      transition: background 0.2s, transform 0.2s;
    }

    .dot.active {
      background: #fff;
      transform: scale(1.3);
    }

    .carousel-counter {
      position: absolute;
      top: 14px;
      right: 14px;
      background: rgba(0,0,0,0.5);
      color: #fff;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 20px;
      z-index: 5;
    }

    /* ---- PROJECT INFO ---- */
    .info-section { margin-bottom: 48px; }

    .project-title {
      font-size: 32px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 10px;
      letter-spacing: 1px;
    }

    .project-short-desc {
      font-size: 16px;
      color: var(--text-secondary);
      margin: 0 0 28px;
      line-height: 1.6;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 28px;
      padding: 24px;
      background: var(--bg-secondary);
      border-radius: 12px;
      border: 1px solid var(--border-color);
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-label {
      font-size: 11px;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .info-value {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .project-full-desc {
      font-size: 15px;
      color: var(--text-secondary);
      line-height: 1.8;
      margin: 0;
    }

    /* ---- PROGRESS SECTION ---- */
    .progress-section { border-top: 1px solid var(--border-color); padding-top: 40px; }

    .section-heading {
      font-size: 22px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 32px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }

    .stage-block {
      margin-bottom: 48px;
    }

    .stage-header {
      display: flex;
      align-items: flex-start;
      gap: 20px;
      margin-bottom: 20px;
    }

    .stage-number {
      flex-shrink: 0;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--text-primary);
      color: var(--bg-primary);
      font-size: 16px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stage-meta { flex: 1; }

    .stage-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 6px;
    }

    .stage-desc {
      font-size: 14px;
      color: var(--text-secondary);
      margin: 0;
      line-height: 1.6;
    }

    .stage-images {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .stage-img-wrap {
      width: 100%;
      height: 500px; 
      aspect-ratio: unset;
      overflow: hidden;
    }
    .stage-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.3s ease;
    }

    .stage-img-wrap:hover .stage-img { transform: scale(1.04); }

    @media (max-width: 600px) {
      .carousel {
        height: 240px;
      }

      .carousel-img {
        object-fit: contain;
        background: var(--bg-secondary);
      }

      .stage-images {
        grid-template-columns: 1fr;
      }

      .stage-img-wrap {
        height: auto;
        aspect-ratio: 4 / 3;
      }

      .stage-img {
        object-fit: contain;
        background: var(--bg-secondary);
      }

      .project-title {
        font-size: 24px;
      }

      .info-grid {
        grid-template-columns: repeat(2, 1fr);
        padding: 16px;
      }
    }
  `]
})
export class PortfolioDetailComponent implements OnInit, OnDestroy {
  private portfolioService = inject(PortfolioService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  project: PortfolioDetail | null = null;
  isLoading = true;
  loadError = false;
  currentSlide = 0;
  private carouselTimer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('portfolioProjectId');
    if (!id) {
      this.isLoading = false;
      this.loadError = true;
      return;
    }

    this.portfolioService.getPortfolioDetail(id).subscribe({
      next: (data) => {
        this.project = data;
        this.isLoading = false;
        this.cdr.detectChanges();
        if (this.isBrowser && data.mainFrameImages.length > 1) {
          this.startCarousel();
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
    this.location.back();
  }

  prevSlide(): void {
    if (!this.project) return;
    const n = this.project.mainFrameImages.length;
    this.currentSlide = (this.currentSlide - 1 + n) % n;
    this.resetCarousel();
  }

  nextSlide(): void {
    if (!this.project) return;
    const n = this.project.mainFrameImages.length;
    this.currentSlide = (this.currentSlide + 1) % n;
    this.resetCarousel();
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
    this.resetCarousel();
  }

  private startCarousel(): void {
    this.carouselTimer = setInterval(() => {
      this.zone.run(() => {
        if (this.project) {
          const n = this.project.mainFrameImages.length;
          this.currentSlide = (this.currentSlide + 1) % n;
          this.cdr.detectChanges();
        }
      });
    }, 4000);
  }

  private resetCarousel(): void {
    if (this.carouselTimer) {
      clearInterval(this.carouselTimer);
      this.carouselTimer = undefined;
    }
    if (this.isBrowser && this.project && this.project.mainFrameImages.length > 1) {
      this.startCarousel();
    }
  }

  ngOnDestroy(): void {
    if (this.carouselTimer) clearInterval(this.carouselTimer);
  }
}
