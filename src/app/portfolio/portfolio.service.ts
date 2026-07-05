import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PortfolioListItem, PortfolioDetail } from './portfolio.model';

@Injectable({ providedIn: 'root' })
export class PortfolioService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getPortfolioList(): Observable<PortfolioListItem[]> {
    return this.http.get<PortfolioListItem[]>(`${this.baseUrl}/api/portfolio`);
  }

  getPortfolioDetail(portfolioProjectId: string): Observable<PortfolioDetail> {
    return this.http.get<PortfolioDetail>(
      `${this.baseUrl}/api/portfolio/${portfolioProjectId}`
    );
  }
}
