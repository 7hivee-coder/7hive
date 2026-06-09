import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar.component';
import { ApiService, TeamMember } from '../services/api.service';

interface TeamMemberCard extends TeamMember {
  imageState: 'loading' | 'loaded' | 'error';
  imageTimeout?: ReturnType<typeof setTimeout>;
}

@Component({
  selector: 'app-team-page',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  template: `
    <div class="team-page">
      <app-navbar></app-navbar>

      <main class="page-content">

        <div class="page-header">
          <h1 class="page-title">Our Team</h1>
          <p class="page-subtitle">The people behind 7HIVE</p>
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
              <div class="skeleton skeleton-text-line short"></div>
            </div>
          </div>
        </div>

        <!-- Load Error -->
        <div *ngIf="!isLoading && loadError" class="state-box">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h3>Something went wrong</h3>
          <p>Could not load team members. Please try again later.</p>
        </div>

        <!-- Empty State -->
        <div *ngIf="!isLoading && !loadError && members.length === 0" class="state-box">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <h3>No Team Members Yet</h3>
          <p>Add team members from the admin panel</p>
        </div>

        <!-- Cards Grid -->
        <div *ngIf="!isLoading && !loadError && members.length > 0" class="cards-grid">
          <div *ngFor="let m of members" class="card">

            <div class="card-image-wrap">
              <div class="skeleton skeleton-img" [class.hidden]="m.imageState !== 'loading'"></div>

              <img
                [src]="m.filepath"
                [alt]="m.title"
                class="card-img"
                [class.visible]="m.imageState === 'loaded'"
                (load)="onImageLoad(m)"
                (error)="onImageError(m)"
              />

              <div class="img-error" [class.visible]="m.imageState === 'error'">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                </svg>
                <span>Something went wrong while loading image</span>
              </div>
            </div>

            <div class="card-body">
              <h3 class="card-title">{{ m.title }}</h3>
              <p class="card-desc">{{ m.description }}</p>
            </div>

          </div>
        </div>

      </main>
    </div>
  `,
  styles: [`
    .team-page {
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

    /* ---- CARDS GRID ---- */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 24px;
    }

    /* ---- CARD ---- */
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: var(--card-shadow);
      transition: transform 0.25s ease, box-shadow 0.25s ease;
    }

    .card:hover {
      transform: translateY(-5px);
      box-shadow: var(--card-shadow-hover);
    }

    /* ---- IMAGE AREA ---- */
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

    .card-img.visible {
      opacity: 1;
    }

    /* ---- SKELETON ---- */
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
      width: 55%;
    }

    .skeleton-text-line {
      height: 12px;
      border-radius: 4px;
      margin-bottom: 8px;
      width: 90%;
    }

    .skeleton-text-line.short {
      width: 65%;
    }

    /* ---- IMAGE ERROR ---- */
    .img-error {
      position: absolute;
      inset: 0;
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      background: var(--error-bg);
      color: var(--error-color);
      text-align: center;
      padding: 16px;
      font-size: 12px;
      font-weight: 500;
    }

    .img-error.visible {
      display: flex;
    }

    /* ---- CARD BODY ---- */
    .card-body {
      padding: 16px 18px 20px;
    }

    .card-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 8px;
      line-height: 1.3;
    }

    .card-desc {
      font-size: 13px;
      color: var(--text-secondary);
      margin: 0;
      line-height: 1.6;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* ---- EMPTY / ERROR STATE ---- */
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

    .state-box svg {
      opacity: 0.4;
    }

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

    @media (max-width: 600px) {
      .cards-grid {
        grid-template-columns: 1fr;
      }
      .page-title { font-size: 26px; }
    }
  `]
})
export class TeamPageComponent implements OnInit, OnDestroy {

  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  members: TeamMemberCard[] = [];
  isLoading = true;
  loadError = false;
  readonly skeletons = [1, 2, 3];

  ngOnInit(): void {
    this.api.getTeamMembers().subscribe({
      next: (data) => {
        this.members = data.map(m => ({ ...m, imageState: 'loading' as const }));
        this.isLoading = false;
        this.cdr.detectChanges();
        if (this.isBrowser) {
          this.members.forEach(m => this.startImageTimeout(m));
        }
      },
      error: () => {
        this.isLoading = false;
        this.loadError = true;
        this.cdr.detectChanges();
      }
    });
  }

  onImageLoad(member: TeamMemberCard): void {
    if (member.imageTimeout) clearTimeout(member.imageTimeout);
    member.imageState = 'loaded';
    this.cdr.detectChanges();
  }

  onImageError(member: TeamMemberCard): void {
    if (member.imageTimeout) clearTimeout(member.imageTimeout);
    member.imageState = 'error';
    this.cdr.detectChanges();
  }

  private startImageTimeout(member: TeamMemberCard): void {
    member.imageTimeout = setTimeout(() => {
      if (member.imageState === 'loading') {
        member.imageState = 'error';
        this.cdr.detectChanges();
      }
    }, 20000);
  }

  ngOnDestroy(): void {
    this.members.forEach(m => {
      if (m.imageTimeout) clearTimeout(m.imageTimeout);
    });
  }
}
