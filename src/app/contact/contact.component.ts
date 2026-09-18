import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent {
  readonly contactForm;
  private readonly api = inject(ApiService);

  submitting = false;
  submitted = false;
  submitError = '';

  constructor(private readonly fb: FormBuilder) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      message: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  onSave(): void {
    if (this.contactForm.invalid || this.submitting) return;
    this.submitting = true;
    this.submitError = '';
    const { name, email, message } = this.contactForm.value;
    this.api.createEnquiry(name!, email!, message!).subscribe({
      next: () => {
        this.submitting = false;
        this.submitted = true;
        this.contactForm.reset();
      },
      error: (err) => {
        this.submitting = false;
        const detail = err?.error?.detail ?? '';
        if (detail === 'EMAIL_DOES_NOT_EXIST') {
          this.submitError = 'This email address does not exist. Please check your email and try again.';
        } else {
          this.submitError = 'Something went wrong. Please try again.';
        }
      }
    });
  }

  resetForm(): void {
    this.submitted = false;
    this.submitError = '';
    this.contactForm.reset();
  }
}
