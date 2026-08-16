import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, ProjectImage, TeamImage, TeamMember, OurLeader } from '../services/api.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-container">
      <h1>7HIVE Admin Panel</h1>

      <!-- Project Images Section -->
      <section class="admin-section">
        <h2>Project Images</h2>
        
        <div class="upload-area">
          <input 
            type="file" 
            #projectFileInput
            (change)="onProjectFilesSelected($event)"
            multiple 
            accept="image/*"
            class="file-input"
          />
          <button 
            type="button"
            (click)="projectFileInput.click()"
            class="btn btn-primary"
          >
            Select Project Images
          </button>
          <span *ngIf="selectedProjectFiles.length > 0" class="file-count">
            {{ selectedProjectFiles.length }} file(s) selected
          </span>
          <button 
            type="button"
            *ngIf="selectedProjectFiles.length > 0"
            (click)="uploadProjectImages()"
            [disabled]="uploading"
            class="btn btn-success"
          >
            {{ uploading ? 'Uploading...' : 'Upload ' + selectedProjectFiles.length + ' Images' }}
          </button>
        </div>

        <div *ngIf="projectImages.length > 0" class="image-grid">
          <div *ngFor="let img of projectImages" class="image-card">
            <img [src]="img.filepath" [alt]="img.filename" />
            <div class="image-info">
              <p>{{ img.filename }}</p>
              <button 
                (click)="deleteProjectImage(img.id)"
                class="btn btn-danger btn-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Team Members Section (Unified) -->
      <section class="admin-section">
        <h2>Team Members</h2>

        <div class="form-group">
          <label>Member Name</label>
          <input
            type="text"
            [(ngModel)]="memberTitle"
            class="form-control"
            placeholder="Enter member name"
          />
        </div>

        <div class="form-group">
          <label>Role / Description</label>
          <textarea
            [(ngModel)]="memberDescription"
            class="form-control"
            rows="3"
            placeholder="Enter role or short description"
          ></textarea>
        </div>

        <div class="upload-area">
          <input
            type="file"
            #memberFileInput
            (change)="onMemberFileSelected($event)"
            accept="image/*"
            class="file-input"
          />
          <button type="button" (click)="memberFileInput.click()" class="btn btn-primary">
            {{ memberFile ? memberFile.name : 'Select Photo' }}
          </button>
          <button
            type="button"
            *ngIf="memberTitle && memberDescription && memberFile"
            (click)="addTeamMember()"
            [disabled]="uploading"
            class="btn btn-success"
          >
            {{ uploading ? 'Adding...' : 'Add Member' }}
          </button>
        </div>

        <div *ngIf="teamMembers.length > 0" class="member-grid">
          <div *ngFor="let m of teamMembers" class="member-card">
            <img [src]="m.filepath" [alt]="m.title" />
            <div class="member-info">
              <strong>{{ m.title }}</strong>
              <p>{{ m.description }}</p>
              <button (click)="deleteTeamMember(m.id)" class="btn btn-danger btn-sm">Delete</button>
            </div>
          </div>
        </div>
        <p *ngIf="teamMembers.length === 0" class="hint">No team members added yet.</p>
      </section>

      <!-- Team Images Section -->
      <section class="admin-section">
        <h2>Team Images</h2>
        
        <div class="upload-area">
          <input 
            type="file" 
            #teamFileInput
            (change)="onTeamFilesSelected($event)"
            multiple 
            accept="image/*"
            class="file-input"
          />
          <button 
            type="button"
            (click)="teamFileInput.click()"
            class="btn btn-primary"
          >
            Select Team Images
          </button>
          <span *ngIf="selectedTeamFiles.length > 0" class="file-count">
            {{ selectedTeamFiles.length }} file(s) selected
          </span>
          <button 
            type="button"
            *ngIf="selectedTeamFiles.length > 0"
            (click)="uploadTeamImages()"
            [disabled]="uploading"
            class="btn btn-success"
          >
            {{ uploading ? 'Uploading...' : 'Upload ' + selectedTeamFiles.length + ' Images' }}
          </button>
        </div>

        <div *ngIf="teamImages.length > 0" class="image-grid">
          <div *ngFor="let img of teamImages" class="image-card">
            <img [src]="img.filepath" [alt]="img.filename" />
            <div class="image-info">
              <p>{{ img.filename }}</p>
              <button 
                (click)="deleteTeamImage(img.id)"
                class="btn btn-danger btn-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Team Intro Section -->
      <section class="admin-section">
        <h2>Team Introduction</h2>
        
        <div class="form-group">
          <label>Title</label>
          <input 
            type="text" 
            [(ngModel)]="teamIntroTitle"
            class="form-control"
            placeholder="Enter team title"
          />
        </div>

        <div class="form-group">
          <label>Description</label>
          <textarea 
            [(ngModel)]="teamIntroDescription"
            class="form-control"
            rows="5"
            placeholder="Enter team description"
          ></textarea>
        </div>

        <button 
          type="button"
          (click)="saveTeamIntro()"
          [disabled]="!teamIntroTitle || !teamIntroDescription"
          class="btn btn-primary"
        >
          Save Team Intro
        </button>
        <p *ngIf="!teamIntroTitle || !teamIntroDescription" class="hint">
          Please fill in both title and description to save
        </p>
      </section>

      <!-- Our Leader Section -->
      <section class="admin-section">
        <h2>Our Leader</h2>

        <!-- Current leader preview -->
        <div *ngIf="currentLeader" class="leader-preview">
          <div class="leader-preview-row">
            <img [src]="currentLeader.filepath" [alt]="currentLeader.title" class="leader-thumb" />
            <strong class="leader-preview-title">{{ currentLeader.title }}</strong>
          </div>
          <p class="leader-preview-desc">{{ currentLeader.description }}</p>
        </div>
        <p *ngIf="!currentLeader" class="hint">No leader set yet.</p>

        <div class="leader-form" style="margin-top:20px">
          <h3 style="margin:0 0 14px;font-size:15px;color:#555">{{ currentLeader ? 'Replace Leader' : 'Add Leader' }}</h3>
          <div class="form-group">
            <label>Name / Title *</label>
            <input type="text" [(ngModel)]="leaderForm.title" class="form-control" placeholder="e.g. Ar. Rahul Sharma" />
          </div>
          <div class="form-group">
            <label>Description / Bio *</label>
            <textarea [(ngModel)]="leaderForm.description" class="form-control" rows="4" placeholder="Brief intro about the leader..."></textarea>
          </div>
          <div class="form-group">
            <label>Photo *</label>
            <input type="file" accept="image/*" (change)="onLeaderFileSelected($event)" class="form-control" />
            <p *ngIf="leaderForm.file" class="hint">Selected: {{ leaderForm.file.name }}</p>
          </div>
          <button
            type="button"
            class="btn btn-success"
            [disabled]="uploading || !leaderForm.title || !leaderForm.description || !leaderForm.file"
            (click)="saveLeader()">
            {{ uploading ? 'Saving...' : (currentLeader ? 'Replace Leader' : 'Save Leader') }}
          </button>
        </div>
      </section>

      <!-- Portfolio Projects Section -->
      <section class="admin-section">
        <h2>Portfolio Projects</h2>

        <!-- Create Form -->
        <div class="portfolio-form">
          <h3 style="margin:0 0 16px;font-size:16px;color:#555">Create New Project</h3>

          <div class="form-row">
            <div class="form-group">
              <label>Project Title *</label>
              <input type="text" [(ngModel)]="pf.title" class="form-control" placeholder="Project title" />
            </div>
            <div class="form-group">
              <label>Category *</label>
              <select [(ngModel)]="pf.category" class="form-control">
                <option value="">-- Select Category --</option>
                <option value="architecture">Architecture</option>
                <option value="interior">Interior</option>
                <option value="turnkey">Turnkey</option>
                <option value="siteexecution">Site Execution</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Short Description *</label>
            <input type="text" [(ngModel)]="pf.shortDescription" class="form-control" placeholder="One-line description" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Location</label>
              <input type="text" [(ngModel)]="pf.location" class="form-control" placeholder="e.g. Bangalore" />
            </div>
            <div class="form-group">
              <label>Year</label>
              <input type="number" [(ngModel)]="pf.year" class="form-control" placeholder="e.g. 2025" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Area</label>
              <input type="text" [(ngModel)]="pf.area" class="form-control" placeholder="e.g. 2400 sqft" />
            </div>
            <div class="form-group">
              <label>Client Name</label>
              <input type="text" [(ngModel)]="pf.clientName" class="form-control" placeholder="Client name" />
            </div>
          </div>

          <div class="form-group">
            <label>Full Description</label>
            <textarea [(ngModel)]="pf.fullDescription" class="form-control" rows="3" placeholder="Detailed description (optional)"></textarea>
          </div>

          <button
            type="button"
            (click)="createPortfolioProject()"
            [disabled]="uploading || !pf.title || !pf.shortDescription || !pf.category"
            class="btn btn-success">
            {{ uploading ? 'Creating...' : 'Create Project' }}
          </button>
        </div>

        <!-- Project List -->
        <div *ngIf="portfolioProjects.length > 0" style="margin-top:32px">
          <h3 style="margin:0 0 16px;font-size:16px;color:#555">Existing Projects</h3>
          <div class="portfolio-project-list">
            <div *ngFor="let p of portfolioProjects" class="portfolio-project-item">

              <div class="ppi-meta">
                <strong>{{ p.projectTitle }}</strong>
                <span class="cat-badge">{{ p.category || 'no category' }}</span>
                <span style="color:#999;font-size:12px">{{ p.portfolioProjectId }}</span>
              </div>

              <div class="ppi-actions">
                <!-- Change Category -->
                <select
                  [value]="p.category || ''"
                  (change)="updateProjectCategory(p.portfolioProjectId, $any($event.target).value)"
                  class="form-control cat-select">
                  <option value="">-- category --</option>
                  <option value="architecture">Architecture</option>
                  <option value="interior">Interior</option>
                  <option value="turnkey">Turnkey</option>
                  <option value="siteexecution">Site Execution</option>
                </select>

                <!-- Upload Main Images -->
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  [id]="'img-upload-' + p.portfolioProjectId"
                  style="display:none"
                  (change)="onPortfolioImagesSelected($event, p.portfolioProjectId)"
                />
                <button
                  type="button"
                  class="btn btn-primary btn-sm"
                  (click)="triggerPortfolioImgUpload(p.portfolioProjectId)">
                  Upload Images
                </button>

                <button
                  type="button"
                  class="btn btn-danger btn-sm"
                  (click)="deletePortfolioProject(p.portfolioProjectId)">
                  Delete
                </button>
              </div>

              <!-- Cover image preview -->
              <div *ngIf="p.coverImage" class="ppi-cover">
                <img [src]="p.coverImage" [alt]="p.projectTitle" />
              </div>

            </div>
          </div>
        </div>
        <p *ngIf="portfolioProjects.length === 0" class="hint">No portfolio projects yet.</p>

      </section>

      <!-- Status Messages -->
      <div *ngIf="statusMessage" class="status-message" [class.error]="isError">
        {{ statusMessage }}
      </div>
    </div>
  `,
  styles: [`
    .admin-container {
      max-width: 1200px;
      margin: 40px auto;
      padding: 24px;
    }

    h1 {
      text-align: center;
      margin-bottom: 40px;
      color: #333;
    }

    .admin-section {
      background: white;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 32px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    h2 {
      margin-bottom: 20px;
      color: #555;
      border-bottom: 2px solid #f0f0f0;
      padding-bottom: 10px;
    }

    .upload-area {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
      flex-wrap: wrap;
      align-items: center;
    }

    .file-count {
      color: #28a745;
      font-weight: 600;
      padding: 8px 12px;
      background: #d4edda;
      border-radius: 4px;
      font-size: 14px;
    }

    .hint {
      margin-top: 8px;
      color: #6c757d;
      font-size: 13px;
      font-style: italic;
    }

    .file-input {
      display: none;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0056b3;
    }

    .btn-success {
      background: #28a745;
      color: white;
    }

    .btn-success:hover:not(:disabled) {
      background: #218838;
    }

    .btn-danger {
      background: #dc3545;
      color: white;
    }

    .btn-danger:hover {
      background: #c82333;
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 12px;
    }

    .image-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }

    .image-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      overflow: hidden;
      transition: transform 0.3s;
    }

    .image-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .image-card img {
      width: 100%;
      height: 200px;
      object-fit: cover;
    }

    .image-info {
      padding: 12px;
      background: #f8f9fa;
    }

    .image-info p {
      margin: 0 0 8px 0;
      font-size: 12px;
      color: #666;
      word-break: break-all;
    }

    .member-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }

    .member-card {
      border: 1px solid #ddd;
      border-radius: 10px;
      overflow: hidden;
    }

    .member-card img {
      width: 100%;
      height: 180px;
      object-fit: cover;
      display: block;
    }

    .member-info {
      padding: 12px;
      background: #f8f9fa;
    }

    .member-info strong {
      font-size: 14px;
      display: block;
      margin-bottom: 4px;
    }

    .member-info p {
      font-size: 12px;
      color: #666;
      margin: 0 0 10px;
      line-height: 1.5;
      word-break: break-word;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: #555;
    }

    .form-control {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      font-family: inherit;
    }

    .form-control:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
    }

    textarea.form-control {
      resize: vertical;
    }

    .status-message {
      position: fixed;
      bottom: 24px;
      right: 24px;
      padding: 16px 24px;
      background: #28a745;
      color: white;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideIn 0.3s;
    }

    .status-message.error {
      background: #dc3545;
    }

    .leader-preview {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
      background: #f8f9fa;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 14px;
    }

    .leader-preview-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .leader-thumb {
      width: 40px;
      height: 52px;
      object-fit: cover;
      border-radius: 4px;
      flex-shrink: 0;
    }

    .leader-preview-title {
      font-size: 14px;
      font-weight: 600;
      color: #222;
    }

    .leader-preview-desc {
      font-size: 13px;
      color: #666;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .leader-form {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      border: 1px solid #e0e0e0;
    }

    .portfolio-form {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      border: 1px solid #e0e0e0;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    @media (max-width: 600px) {
      .form-row { grid-template-columns: 1fr; }
    }

    .portfolio-project-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .portfolio-project-item {
      background: #f8f9fa;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .ppi-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .cat-badge {
      background: #007bff;
      color: white;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 12px;
      text-transform: capitalize;
    }

    .ppi-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .cat-select {
      width: auto;
      padding: 6px 10px;
      font-size: 13px;
    }

    .ppi-cover {
      width: 120px;
      height: 80px;
      border-radius: 6px;
      overflow: hidden;
    }

    .ppi-cover img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `]
})
export class AdminComponent implements OnInit {
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  projectImages: ProjectImage[] = [];
  teamImages: TeamImage[] = [];
  teamMembers: TeamMember[] = [];
  selectedProjectFiles: File[] = [];
  selectedTeamFiles: File[] = [];
  uploading = false;

  memberTitle = '';
  memberDescription = '';
  memberFile: File | null = null;

  teamIntroTitle = '';
  teamIntroDescription = '';

  currentLeader: OurLeader | null = null;
  leaderForm = { title: '', description: '', file: null as File | null };

  portfolioProjects: any[] = [];
  pf = {
    title: '',
    shortDescription: '',
    fullDescription: '',
    location: '',
    area: '',
    clientName: '',
    year: null as number | null,
    category: '',
  };

  statusMessage = '';
  isError = false;

  ngOnInit() {
    this.loadProjectImages();
    this.loadTeamImages();
    this.loadTeamMembers();
    this.loadPortfolioProjects();
    this.loadLeader();
  }

  loadProjectImages() {
    this.api.getProjectImages().subscribe({
      next: (images) => {
        this.projectImages = images;
        this.cdr.detectChanges();
        console.log('Loaded project images:', images.length);
      },
      error: (err) => {
        console.error('Failed to load project images:', err);
        this.showMessage('Failed to load project images', true);
      }
    });
  }

  loadTeamImages() {
    this.api.getTeamImages().subscribe({
      next: (images) => {
        this.teamImages = images;
        this.cdr.detectChanges();
        console.log('Loaded team images:', images.length);
      },
      error: (err) => {
        console.error('Failed to load team images:', err);
        this.showMessage('Failed to load team images', true);
      }
    });
  }

  onProjectFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedProjectFiles = Array.from(input.files);
      console.log('Selected project files:', this.selectedProjectFiles.length);
    }
  }

  onTeamFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedTeamFiles = Array.from(input.files);
      console.log('Selected team files:', this.selectedTeamFiles.length);
    }
  }

  uploadProjectImages() {
    if (this.selectedProjectFiles.length === 0) return;

    console.log('Uploading project images:', this.selectedProjectFiles.length);
    this.uploading = true;
    this.api.uploadProjectImages(this.selectedProjectFiles).subscribe({
      next: (uploaded) => {
        console.log('Upload successful:', uploaded);
        this.uploading = false;
        this.selectedProjectFiles = [];
        this.showMessage(`Successfully uploaded ${uploaded.length} project images`);
        setTimeout(() => this.loadProjectImages(), 500);
      },
      error: (err) => {
        this.uploading = false;
        console.error('Upload failed:', err);
        this.showMessage('Failed to upload project images', true);
      }
    });
  }

  uploadTeamImages() {
    if (this.selectedTeamFiles.length === 0) return;

    console.log('Uploading team images:', this.selectedTeamFiles.length);
    this.uploading = true;
    this.api.uploadTeamImages(this.selectedTeamFiles).subscribe({
      next: (uploaded) => {
        console.log('Upload successful:', uploaded);
        this.uploading = false;
        this.selectedTeamFiles = [];
        this.showMessage(`Successfully uploaded ${uploaded.length} team images`);
        setTimeout(() => this.loadTeamImages(), 500);
      },
      error: (err) => {
        this.uploading = false;
        console.error('Upload failed:', err);
        this.showMessage('Failed to upload team images', true);
      }
    });
  }

  deleteProjectImage(id: number) {
    if (!confirm('Are you sure you want to delete this image?')) return;

    console.log('Deleting project image:', id);
    this.api.deleteProjectImage(id).subscribe({
      next: () => {
        console.log('Delete successful');
        this.showMessage('Project image deleted successfully');
        setTimeout(() => this.loadProjectImages(), 300);
      },
      error: (err) => {
        console.error('Delete failed:', err);
        this.showMessage('Failed to delete project image', true);
      }
    });
  }

  deleteTeamImage(id: number) {
    if (!confirm('Are you sure you want to delete this image?')) return;

    console.log('Deleting team image:', id);
    this.api.deleteTeamImage(id).subscribe({
      next: () => {
        console.log('Delete successful');
        this.showMessage('Team image deleted successfully');
        setTimeout(() => this.loadTeamImages(), 300);
      },
      error: (err) => {
        console.error('Delete failed:', err);
        this.showMessage('Failed to delete team image', true);
      }
    });
  }

  saveTeamIntro() {
    if (!this.teamIntroTitle || !this.teamIntroDescription) return;

    this.api.createTeamIntro({
      title: this.teamIntroTitle,
      description: this.teamIntroDescription
    }).subscribe({
      next: () => {
        this.showMessage('Team intro saved successfully');
        this.teamIntroTitle = '';
        this.teamIntroDescription = '';
      },
      error: (err) => {
        console.error('Save failed:', err);
        this.showMessage('Failed to save team intro', true);
      }
    });
  }

  loadTeamMembers() {
    this.api.getTeamMembers().subscribe({
      next: (members) => {
        this.teamMembers = members;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load team members:', err);
      }
    });
  }

  onMemberFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.memberFile = input.files[0];
    }
  }

  addTeamMember() {
    if (!this.memberTitle || !this.memberDescription || !this.memberFile) return;
    this.uploading = true;
    this.api.createTeamMember(this.memberTitle, this.memberDescription, this.memberFile).subscribe({
      next: () => {
        this.uploading = false;
        this.memberTitle = '';
        this.memberDescription = '';
        this.memberFile = null;
        this.showMessage('Team member added successfully');
        this.loadTeamMembers();
      },
      error: (err) => {
        this.uploading = false;
        console.error('Failed to add team member:', err);
        this.showMessage('Failed to add team member', true);
      }
    });
  }

  deleteTeamMember(id: number) {
    if (!confirm('Delete this team member?')) return;
    this.api.deleteTeamMember(id).subscribe({
      next: () => {
        this.showMessage('Team member deleted');
        this.loadTeamMembers();
      },
      error: (err) => {
        console.error('Delete failed:', err);
        this.showMessage('Failed to delete team member', true);
      }
    });
  }

  loadLeader() {
    this.api.getOurLeader().subscribe({
      next: (data) => { this.currentLeader = data; this.cdr.detectChanges(); },
      error: () => { this.currentLeader = null; this.cdr.detectChanges(); }
    });
  }

  onLeaderFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.leaderForm.file = input.files[0];
    }
  }

  saveLeader() {
    if (!this.leaderForm.title || !this.leaderForm.description || !this.leaderForm.file) return;
    this.uploading = true;
    this.api.createOrReplaceOurLeader(this.leaderForm.title, this.leaderForm.description, this.leaderForm.file).subscribe({
      next: (data) => {
        this.uploading = false;
        this.currentLeader = data;
        this.leaderForm = { title: '', description: '', file: null };
        this.showMessage('Leader saved successfully');
        this.cdr.detectChanges();
      },
      error: () => {
        this.uploading = false;
        this.showMessage('Failed to save leader', true);
      }
    });
  }

  deleteLeader() {
    if (!confirm('Remove this leader entry?')) return;
    this.api.deleteOurLeader().subscribe({
      next: () => {
        this.currentLeader = null;
        this.showMessage('Leader removed');
        this.cdr.detectChanges();
      },
      error: () => this.showMessage('Failed to remove leader', true)
    });
  }

  loadPortfolioProjects() {
    this.api.getPortfolioProjects().subscribe({
      next: (projects) => {
        this.portfolioProjects = projects;
        this.cdr.detectChanges();
      },
      error: () => this.showMessage('Failed to load portfolio projects', true)
    });
  }

  createPortfolioProject() {
    if (!this.pf.title || !this.pf.shortDescription || !this.pf.category) return;
    this.uploading = true;
    this.api.createPortfolioProject({
      projectTitle: this.pf.title,
      shortDescription: this.pf.shortDescription,
      fullDescription: this.pf.fullDescription || undefined,
      location: this.pf.location || undefined,
      area: this.pf.area || undefined,
      clientName: this.pf.clientName || undefined,
      year: this.pf.year ?? undefined,
      category: this.pf.category,
    }).subscribe({
      next: () => {
        this.uploading = false;
        this.pf = { title: '', shortDescription: '', fullDescription: '', location: '', area: '', clientName: '', year: null, category: '' };
        this.showMessage('Portfolio project created');
        this.loadPortfolioProjects();
      },
      error: () => {
        this.uploading = false;
        this.showMessage('Failed to create portfolio project', true);
      }
    });
  }

  updateProjectCategory(portfolioProjectId: string, category: string) {
    if (!category) return;
    this.api.updatePortfolioProject(portfolioProjectId, { category }).subscribe({
      next: () => {
        this.showMessage('Category updated');
        this.loadPortfolioProjects();
      },
      error: () => this.showMessage('Failed to update category', true)
    });
  }

  deletePortfolioProject(portfolioProjectId: string) {
    if (!confirm('Delete this portfolio project and all its images?')) return;
    this.api.deletePortfolioProject(portfolioProjectId).subscribe({
      next: () => {
        this.showMessage('Portfolio project deleted');
        this.loadPortfolioProjects();
      },
      error: () => this.showMessage('Failed to delete portfolio project', true)
    });
  }

  triggerPortfolioImgUpload(portfolioProjectId: string) {
    const el = document.getElementById('img-upload-' + portfolioProjectId) as HTMLInputElement;
    if (el) el.click();
  }

  onPortfolioImagesSelected(event: Event, portfolioProjectId: string) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const files = Array.from(input.files);
    this.uploading = true;
    this.api.uploadPortfolioMainImages(portfolioProjectId, files).subscribe({
      next: () => {
        this.uploading = false;
        this.showMessage(`Uploaded ${files.length} image(s) for ${portfolioProjectId}`);
        this.loadPortfolioProjects();
        input.value = '';
      },
      error: () => {
        this.uploading = false;
        this.showMessage('Failed to upload images', true);
        input.value = '';
      }
    });
  }

  private showMessage(message: string, isError = false) {
    this.statusMessage = message;
    this.isError = isError;
    setTimeout(() => {
      this.statusMessage = '';
    }, 3000);
  }
}
