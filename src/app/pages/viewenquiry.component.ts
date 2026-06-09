import {
  Component, OnInit, inject, ChangeDetectorRef, PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Enquiry } from '../services/api.service';

const ADMIN_EMAIL    = '7hivedesignstudio@gmail.com';
const ADMIN_PASSWORD = '7hivedesignstudio';
const SESSION_KEY    = '7hive_admin_auth';

@Component({
  selector: 'app-view-enquiry',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- ===================== LOGIN SCREEN ===================== -->
    <div *ngIf="!isLoggedIn" class="auth-page">
      <div class="auth-card">

        <div class="auth-brand">7HIVE</div>
        <p class="auth-subtitle">Admin Portal</p>

        <div class="auth-divider"></div>

        <h2 class="auth-title">Sign In</h2>
        <p class="auth-hint">Restricted access — authorised personnel only.</p>

        <div class="field">
          <label>Email</label>
          <input
            type="email"
            [(ngModel)]="loginEmail"
            placeholder="admin@example.com"
            (keyup.enter)="login()"
            autocomplete="username"
          />
        </div>

        <div class="field">
          <label>Password</label>
          <div class="pass-wrap">
            <input
              [type]="showPassword ? 'text' : 'password'"
              [(ngModel)]="loginPassword"
              placeholder="••••••••••••"
              (keyup.enter)="login()"
              autocomplete="current-password"
            />
            <button type="button" class="pass-toggle" (click)="showPassword = !showPassword">
              <svg *ngIf="!showPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <svg *ngIf="showPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            </button>
          </div>
        </div>

        <div *ngIf="loginError" class="auth-error">{{ loginError }}</div>

        <button class="auth-btn" (click)="login()" [disabled]="!loginEmail || !loginPassword">
          Sign In
        </button>

      </div>
    </div>

    <!-- ===================== DASHBOARD ===================== -->
    <div *ngIf="isLoggedIn" class="dashboard">

      <!-- Header -->
      <header class="dash-header">
        <div class="dash-header-inner">
          <div class="dash-brand-area">
            <span class="dash-brand">7HIVE</span>
            <span class="dash-page-title">Contact Enquiries</span>
          </div>
          <div class="dash-actions">
            <span *ngIf="!isLoading && !loadError" class="enquiry-badge">
              {{ enquiries.length }} {{ enquiries.length === 1 ? 'enquiry' : 'enquiries' }}
            </span>
            <button class="logout-btn" (click)="logout()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main class="dash-content">

        <!-- Skeletons while loading -->
        <div *ngIf="isLoading" class="table-wrap">
          <table class="enq-table">
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Message</th><th>Date &amp; Time</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of skeletons">
                <td><div class="sk sk-name"></div></td>
                <td><div class="sk sk-email"></div></td>
                <td><div class="sk sk-msg"></div></td>
                <td><div class="sk sk-date"></div></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Load error -->
        <div *ngIf="!isLoading && loadError" class="state-box">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h3>Failed to load enquiries</h3>
          <p>{{ loadError }}</p>
          <button class="retry-btn" (click)="fetchEnquiries()">Retry</button>
        </div>

        <!-- Empty state -->
        <div *ngIf="!isLoading && !loadError && enquiries.length === 0" class="state-box">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
          <h3>No enquiries yet</h3>
          <p>Submitted contact forms will appear here.</p>
        </div>

        <!-- Enquiry table -->
        <div *ngIf="!isLoading && !loadError && enquiries.length > 0" class="table-wrap">
          <table class="enq-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Message</th>
                <th>Date &amp; Time</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let e of enquiries; let i = index">
                <td class="row-num">{{ i + 1 }}</td>
                <td class="col-name">{{ e.name }}</td>
                <td class="col-email">
                  <a [href]="'mailto:' + e.email">{{ e.email }}</a>
                </td>
                <td class="col-msg">{{ e.message }}</td>
                <td class="col-date">{{ formatDate(e.created_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

      </main>
    </div>
  `,
  styles: [`
    /* =========================================================
       AUTH PAGE
       ========================================================= */
    .auth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-secondary);
      padding: 24px;
    }

    .auth-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      box-shadow: var(--card-shadow);
      padding: 40px 36px;
      width: 100%;
      max-width: 400px;
    }

    .auth-brand {
      font-size: 28px;
      font-weight: 900;
      letter-spacing: 3px;
      color: var(--text-primary);
      text-align: center;
      font-family: 'Cinzel', serif;
    }

    .auth-subtitle {
      text-align: center;
      font-size: 11px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: var(--text-muted);
      margin: 4px 0 0;
    }

    .auth-divider {
      height: 1px;
      background: var(--border-color);
      margin: 24px 0;
    }

    .auth-title {
      font-size: 20px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 6px;
    }

    .auth-hint {
      font-size: 13px;
      color: var(--text-muted);
      margin: 0 0 24px;
    }

    .field {
      margin-bottom: 16px;
    }

    .field label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.5px;
      color: var(--text-secondary);
      margin-bottom: 6px;
      text-transform: uppercase;
    }

    .field input {
      width: 100%;
      padding: 11px 14px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      color: var(--text-primary);
      font-size: 14px;
      box-sizing: border-box;
      outline: none;
      transition: border-color 0.2s ease;
    }

    .field input:focus {
      border-color: var(--text-secondary);
    }

    .pass-wrap {
      position: relative;
    }

    .pass-wrap input {
      padding-right: 42px;
    }

    .pass-toggle {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      padding: 0;
    }

    .auth-error {
      background: var(--error-bg);
      color: var(--error-color);
      border: 1px solid var(--error-color);
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 13px;
      margin-bottom: 16px;
    }

    .auth-btn {
      width: 100%;
      padding: 13px;
      background: var(--text-primary);
      color: var(--bg-primary);
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.5px;
      cursor: pointer;
      transition: opacity 0.2s ease;
      margin-top: 4px;
    }

    .auth-btn:hover:not(:disabled) {
      opacity: 0.85;
    }

    .auth-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    /* =========================================================
       DASHBOARD
       ========================================================= */
    .dashboard {
      min-height: 100vh;
      background: var(--bg-secondary);
    }

    .dash-header {
      background: var(--card-bg);
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      z-index: 50;
      box-shadow: var(--card-shadow);
    }

    .dash-header-inner {
      max-width: 1300px;
      margin: 0 auto;
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .dash-brand-area {
      display: flex;
      align-items: baseline;
      gap: 14px;
    }

    .dash-brand {
      font-size: 20px;
      font-weight: 900;
      letter-spacing: 2px;
      color: var(--text-primary);
      font-family: 'Cinzel', serif;
    }

    .dash-page-title {
      font-size: 13px;
      color: var(--text-muted);
      font-weight: 500;
      letter-spacing: 0.3px;
    }

    .dash-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .enquiry-badge {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      border-radius: 999px;
      padding: 4px 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .logout-btn {
      display: flex;
      align-items: center;
      gap: 7px;
      background: none;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      color: var(--text-secondary);
      font-size: 13px;
      font-weight: 600;
      padding: 7px 14px;
      cursor: pointer;
      transition: background 0.2s ease, color 0.2s ease;
    }

    .logout-btn:hover {
      background: var(--error-bg);
      color: var(--error-color);
      border-color: var(--error-color);
    }

    /* =========================================================
       DASHBOARD MAIN
       ========================================================= */
    .dash-content {
      max-width: 1300px;
      margin: 0 auto;
      padding: 32px 24px 80px;
    }

    /* =========================================================
       TABLE
       ========================================================= */
    .table-wrap {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: var(--card-shadow);
    }

    .enq-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    .enq-table thead tr {
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-color);
    }

    .enq-table th {
      padding: 13px 18px;
      text-align: left;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: var(--text-muted);
    }

    .enq-table tbody tr {
      border-bottom: 1px solid var(--border-color);
      transition: background 0.15s ease;
    }

    .enq-table tbody tr:last-child {
      border-bottom: none;
    }

    .enq-table tbody tr:hover {
      background: var(--bg-secondary);
    }

    .enq-table td {
      padding: 14px 18px;
      color: var(--text-primary);
      vertical-align: top;
    }

    .row-num {
      color: var(--text-muted);
      font-size: 12px;
      width: 36px;
    }

    .col-name {
      font-weight: 600;
      white-space: nowrap;
      min-width: 120px;
    }

    .col-email a {
      color: var(--text-secondary);
      text-decoration: none;
      white-space: nowrap;
    }

    .col-email a:hover {
      text-decoration: underline;
      color: var(--text-primary);
    }

    .col-msg {
      max-width: 420px;
      line-height: 1.55;
      color: var(--text-secondary);
    }

    .col-date {
      font-size: 12px;
      color: var(--text-muted);
      white-space: nowrap;
      min-width: 140px;
    }

    /* =========================================================
       SKELETON
       ========================================================= */
    .sk {
      background: linear-gradient(
        90deg,
        var(--skeleton-base) 25%,
        var(--skeleton-shine) 50%,
        var(--skeleton-base) 75%
      );
      background-size: 600px 100%;
      animation: shimmer 1.4s ease infinite;
      border-radius: 4px;
      height: 14px;
    }

    .sk-name  { width: 110px; }
    .sk-email { width: 160px; }
    .sk-msg   { width: 85%; }
    .sk-date  { width: 100px; }

    /* =========================================================
       STATE BOX (empty / error)
       ========================================================= */
    .state-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 380px;
      gap: 14px;
      text-align: center;
      color: var(--text-muted);
    }

    .state-box svg {
      opacity: 0.35;
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

    .retry-btn {
      margin-top: 4px;
      padding: 9px 22px;
      background: var(--text-primary);
      color: var(--bg-primary);
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s ease;
    }

    .retry-btn:hover {
      opacity: 0.8;
    }

    /* =========================================================
       RESPONSIVE
       ========================================================= */
    @media (max-width: 768px) {
      .enq-table th:first-child,
      .enq-table td.row-num {
        display: none;
      }

      .col-msg {
        max-width: 200px;
      }

      .dash-page-title {
        display: none;
      }
    }
  `]
})
export class ViewEnquiryComponent implements OnInit {

  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  isLoggedIn  = false;
  loginEmail  = '';
  loginPassword = '';
  loginError  = '';
  showPassword = false;

  enquiries: Enquiry[] = [];
  isLoading  = false;
  loadError  = '';
  readonly skeletons = [1, 2, 3, 4, 5];

  ngOnInit(): void {
    if (this.isBrowser) {
      this.isLoggedIn = sessionStorage.getItem(SESSION_KEY) === 'true';
      if (this.isLoggedIn) this.fetchEnquiries();
    }
  }

  login(): void {
    const emailOk    = this.loginEmail.trim().toLowerCase() === ADMIN_EMAIL;
    const passwordOk = this.loginPassword === ADMIN_PASSWORD;

    if (!emailOk || !passwordOk) {
      this.loginError = 'Invalid credentials. Please try again.';
      return;
    }

    this.loginError = '';
    this.isLoggedIn = true;
    if (this.isBrowser) sessionStorage.setItem(SESSION_KEY, 'true');
    this.fetchEnquiries();
  }

  logout(): void {
    this.isLoggedIn = false;
    this.enquiries  = [];
    this.loadError  = '';
    if (this.isBrowser) sessionStorage.removeItem(SESSION_KEY);
    this.loginEmail    = '';
    this.loginPassword = '';
  }

  fetchEnquiries(): void {
    this.isLoading = true;
    this.loadError = '';
    this.cdr.detectChanges();

    this.api.getEnquiries().subscribe({
      next: (data) => {
        this.enquiries = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.loadError = err.status === 401
          ? 'Session expired. Please log in again.'
          : 'Could not fetch enquiries. Please try again.';
        if (err.status === 401) this.logout();
        this.cdr.detectChanges();
      }
    });
  }

  formatDate(isoString: string): string {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
}
