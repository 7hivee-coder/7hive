import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PortfolioListItem, PortfolioDetail, CategoryPreview } from './portfolio.model';

@Injectable({ providedIn: 'root' })
export class PortfolioService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getPortfolioList(): Observable<PortfolioListItem[]> {
    return this.http.get<PortfolioListItem[]>(`${this.baseUrl}/portfolio`);
  }

  getPortfolioByCategory(category: string): Observable<PortfolioListItem[]> {
    return this.http.get<PortfolioListItem[]>(`${this.baseUrl}/portfolio?category=${category}`);
  }

  getPortfolioDetail(portfolioProjectId: string): Observable<PortfolioDetail> {
    return this.http.get<PortfolioDetail>(
      `${this.baseUrl}/portfolio/${portfolioProjectId}`
    );
  }

  getHomePreview(): Observable<CategoryPreview[]> {
    return this.http.get<CategoryPreview[]>(`${this.baseUrl}/portfolio/home-preview`);
  }
}
