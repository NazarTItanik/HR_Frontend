import { Component, OnInit, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';

import { ApiService } from '../../services/api-service/api-service';
import { Notification } from '../../services/notification/notification';
import { CandidateStage } from '../../models/enums/candidateStage';
import { LoadingService } from '../../services/loading-service/loading-service';

interface Vacancy {
  id: number;
  title: string;
}

@Component({
  selector: 'app-request-access',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    FloatLabelModule,
    SelectModule,
    ToastModule
  ],
  templateUrl: './request-access.html',
  styleUrl: './request-access.css',
  encapsulation: ViewEncapsulation.None
})
export class RequestAccess implements OnInit {

  private api = inject(ApiService);
  private notification = inject(Notification);
  private loading = inject(LoadingService);


  resumeFile: File | null = null;
  submitted = false;
  vacancies: Vacancy[] = [];
  requestForm = new FormGroup({
    firstName: new FormControl('', [Validators.required, Validators.maxLength(50)]),
    middleName: new FormControl('', Validators.maxLength(50)),
    lastName: new FormControl('', [Validators.required, Validators.maxLength(50)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    contactNumber: new FormControl('', Validators.maxLength(20)),
    vacancyId: new FormControl(null, Validators.required),
    linkedIn: new FormControl('', Validators.maxLength(200)),
    notes: new FormControl('', Validators.maxLength(1000))
  });

  ngOnInit(): void {


    this.loadVacancies();
  }

  loadVacancies(): void {
    this.api.get<Vacancy[]>('api/GetVacancies').subscribe({
      next: (data) => {
        this.vacancies = data;
      },
      error: (err) => {
        console.error('Failed to load vacancies:', err);
        this.notification.error('Could not load available positions. Please refresh and try again.');
      }
    });
  }

  onResumeSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        this.notification.warn('Resume must be under 5MB');
        return;
      }

      this.resumeFile = file;
    }
  }

  // isInvalid(controlName: string): boolean {
  //   const control = this.requestForm.get(controlName);
  //   return !!(control && control.invalid && (control.touched || control.dirty));
  // }

  onSubmit(): void {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      this.notification.warn('Please fill in all required fields');
      return;
    }

    this.loading.show();
    const formValue = this.requestForm.value;

    const formData = new FormData();

    formData.append('firstName', formValue.firstName!.trim());
    formData.append('lastName', formValue.lastName!.trim());
    formData.append('email', formValue.email!.trim());

    if (formValue.middleName) {
      formData.append('middleName', formValue.middleName.trim());
    }
    if (formValue.contactNumber) {
      formData.append('contactNumber', formValue.contactNumber.trim());
    }
    if (formValue.vacancyId) {
      formData.append('vacancyId', formValue.vacancyId);
    }
    if (formValue.linkedIn) {
      formData.append('linkedIn', formValue.linkedIn.trim());
    }
    if (formValue.notes) {
      formData.append('notes', formValue.notes.trim());
    }

    formData.append('dateOfApplication', new Date().toISOString());
    formData.append('stage', CandidateStage.New.toString());
    formData.append('candidateSource', 'Self-Application');

    if (this.resumeFile) {
      formData.append('resumeFile', this.resumeFile);
    }

    this.api.post('api/Candidates', formData).subscribe({
      next: () => {
        this.loading.hide();
        this.submitted = true;
        this.notification.success('Application submitted! We will contact you soon.');
      },
      error: (err) => {
        this.loading.hide();
        console.error('Submission failed:', err);

        let errorMessage = 'Failed to submit application. Please try again.';
        if (err.error?.errors) {
          const firstError = Object.values(err.error.errors)[0] as string[];
          errorMessage = firstError[0] || errorMessage;
        }

        this.notification.error(errorMessage);
      }
    });
  }
}