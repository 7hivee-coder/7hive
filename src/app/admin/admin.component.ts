import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, ProjectImage, TeamImage, TeamMember } from '../services/api.service';

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

  statusMessage = '';
  isError = false;

  ngOnInit() {
    this.loadProjectImages();
    this.loadTeamImages();
    this.loadTeamMembers();
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

  private showMessage(message: string, isError = false) {
    this.statusMessage = message;
    this.isError = isError;
    setTimeout(() => {
      this.statusMessage = '';
    }, 3000);
  }
}
