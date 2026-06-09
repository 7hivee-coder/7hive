import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

// =========================
// INTERFACES
// =========================
export interface ProjectImage {
  id: number;
  filename: string;
  filepath: string;
}

export interface TeamIntro {
  id: number;
  title: string;
  description: string;
}

export interface TeamImage {
  id: number;
  filename: string;
  filepath: string;
}

export interface ApiResponse {
  message: string;
}

export interface TeamMember {
  id: number;
  title: string;
  description: string;
  filename: string;
  filepath: string;
}

export interface Enquiry {
  id: number;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  // =========================
  // PROJECT IMAGES
  // =========================
  getProjectImages(): Observable<ProjectImage[]> {
    return this.http.get<ProjectImage[]>(`${this.baseUrl}/images/`);
  }

  uploadProjectImages(files: File[]): Observable<ProjectImage[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    return this.http.post<ProjectImage[]>(`${this.baseUrl}/upload-images/`, formData);
  }

  deleteProjectImage(imageId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/images/${imageId}`);
  }

  // =========================
  // TEAM INTRO
  // =========================
  getTeamIntro(): Observable<TeamIntro[]> {
    return this.http.get<TeamIntro[]>(`${this.baseUrl}/teamintro`);
  }

  createTeamIntro(data: { title: string; description: string }): Observable<TeamIntro> {
    return this.http.post<TeamIntro>(`${this.baseUrl}/teamintro`, data);
  }

  // =========================
  // TEAM IMAGES
  // =========================
  getTeamImages(): Observable<TeamImage[]> {
    return this.http.get<TeamImage[]>(`${this.baseUrl}/teamimages`);
  }

  uploadTeamImages(files: File[]): Observable<TeamImage[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    return this.http.post<TeamImage[]>(`${this.baseUrl}/teamimages`, formData);
  }

  deleteTeamImage(imageId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/teamimages/${imageId}`);
  }

  // =========================
  // TEAM MEMBERS (unified)
  // =========================
  getTeamMembers(): Observable<TeamMember[]> {
    return this.http.get<TeamMember[]>(`${this.baseUrl}/team-members`);
  }

  createTeamMember(title: string, description: string, file: File): Observable<TeamMember> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('file', file);
    return this.http.post<TeamMember>(`${this.baseUrl}/team-members`, formData);
  }

  deleteTeamMember(memberId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/team-members/${memberId}`);
  }

  // =========================
  // ENQUIRIES
  // =========================
  createEnquiry(name: string, email: string, message: string): Observable<Enquiry> {
    return this.http.post<Enquiry>(`${this.baseUrl}/enquiries`, { name, email, message });
  }

  getEnquiries(): Observable<Enquiry[]> {
    const headers = new HttpHeaders({
      Authorization: 'Basic ' + btoa('7hivedesignstudio@gmail.com:7hivedesignstudio')
    });
    return this.http.get<Enquiry[]>(`${this.baseUrl}/enquiries`, { headers });
  }
}
