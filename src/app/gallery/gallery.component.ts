import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { ApiService, ProjectImage } from '../services/api.service';

type Variant = 'small-left' | 'small-right' | 'wide-left' | 'wide-right';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="gallery" *ngIf="allImages.length > 0; else noData">

      <div *ngFor="let item of visibleItems; trackBy: trackByUrl"
           class="card"
           [class.small-left]="item.variant === 'small-left'"
           [class.small-right]="item.variant === 'small-right'"
           [class.wide-left]="item.variant === 'wide-left'"
           [class.wide-right]="item.variant === 'wide-right'">

        <img [src]="item.url" alt="portfolio image" loading="lazy" />
      </div>

    </section>

    <ng-template #noData>
      <p class="no-data">No data to load</p>
    </ng-template>

    <div class="show-more-container" *ngIf="visibleCount < allImages.length">
      <button (click)="loadMore()" class="show-more-btn">
        Show More
      </button>
    </div>
  `,
  styleUrls: ['./gallery.component.css']
})
export class GalleryComponent implements OnInit {

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private api = inject(ApiService);

  allImages: string[] = [];
  visibleCount = 10;
  readonly step = 10;

  ngOnInit(): void {
    if (!this.isBrowser) return;

    console.log('Gallery ngOnInit');
    this.api.getProjectImages().subscribe({
      next: (data: ProjectImage[]) => {
        this.allImages = data.map(img => img.filepath);
        this.visibleCount = Math.min(this.step, this.allImages.length);
        console.log('Gallery loaded:', this.allImages.length, 'images');
      },
      error: (err) => {
        console.error('Gallery error:', err);
        this.allImages = [];
      }
    });
  }

  get visibleItems(): Array<{ url: string; variant: Variant }> {
    const items: Array<{ url: string; variant: Variant }> = [];
    const max = Math.min(this.visibleCount, this.allImages.length);

    for (let i = 0; i < max; i++) {
      const row = Math.floor(i / 2);
      const pos = i % 2;

      let variant: Variant;

      if (row % 2 === 0) {
        variant = pos === 0 ? 'small-left' : 'wide-right';
      } else {
        variant = pos === 0 ? 'wide-left' : 'small-right';
      }

      items.push({ url: this.allImages[i], variant });
    }

    return items;
  }

  loadMore(): void {
    this.visibleCount = Math.min(
      this.visibleCount + this.step,
      this.allImages.length
    );
  }

  trackByUrl = (_: number, item: { url: string }) => item.url;
}
