import { Component, OnDestroy, OnInit, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { ContactComponent } from '../contact/contact.component';
import { GalleryComponent } from '../gallery/gallery.component';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-portfolio-page',
  standalone: true,
  imports: [CommonModule, NavbarComponent, ContactComponent, GalleryComponent],
  template: `
    <div class="landing-image-container">

      <!-- While API is loading: clean dark background, no flash -->
      <div *ngIf="heroLoading" class="slide hero-loader">
        <img src="/assets/logo/7hiveblack.png" alt="7HIVE" class="hero-logo">
      </div>

      <!-- API done but no images uploaded -->
      <div *ngIf="!heroLoading && slides.length === 0" class="slide hero-loader">
        <img src="/assets/logo/7hiveblack.png" alt="7HIVE" class="hero-logo">
        <p class="hero-slogan">ARCHITECTURE | INTERIOR | LANDSCAPE</p>
      </div>

      <!-- Slides when images exist -->
      <div class="slides" *ngIf="!heroLoading && slides.length > 0"
           [style.width]="(slides.length * 100) + 'vw'"
           [style.transform]="'translateX(-' + (currentIndex * 100) + 'vw)'">
           <div class="slide"
           *ngFor="let img of slides"
           [style.background-image]="slideStyle(img)">
            <img src="/assets/logo/7hiveblack.png" alt="7HIVE" class="hero-logo">
            <p class="hero-slogan">ARCHITECTURE | INTERIOR | LANDSCAPE</p>
           </div>
      </div>
    </div>

    <div class="main-content">
      <app-navbar></app-navbar>
      <section class="projects">
        <app-gallery></app-gallery>
      </section>
      <app-contact></app-contact>
    </div>
  `,
  styleUrls: ['../app.css']
})
export class PortfolioPageComponent implements OnInit, OnDestroy {
  slides: string[] = [];
  currentIndex = 0;
  loading = false;
  heroLoading = true;

  private timer?: any;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly api = inject(ApiService);

  ngOnInit(): void {
    console.log('Portfolio ngOnInit - loading slides...');
    this.api.getProjectImages()
      .subscribe({
        next: (res) => {
          if (!res || res.length === 0) {
            this.slides = [];
          } else {
            this.slides = res.map(img => img.filepath).slice(0, 5);
            this.startCarousel();
          }
          this.heroLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.slides = [];
          this.heroLoading = false;
          this.cdr.detectChanges();
        }
      });
  }



  slideStyle(img: string): string {
    return `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url('${img}')`;
  }

  private startCarousel(): void {
    if (this.isBrowser) {
      this.timer = setInterval(() => {
        this.zone.run(() => {
          const n = this.slides.length;
          if (n > 0) {
            this.currentIndex = (this.currentIndex + 1) % n;
            // aid debugging + ensure view updates immediately
            // eslint-disable-next-line no-console
            console.log('Carousel index ->', this.currentIndex);
            this.cdr.detectChanges();
          }
        });
      }, 5000);
    }
  }

  ngOnDestroy(): void {
    if (this.timer && this.isBrowser) {
      clearInterval(this.timer);
    }
  }
}
