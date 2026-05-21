import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { MultiSelectModule } from 'primeng/multiselect';



export interface DialogFieldConfig {
  key: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'date' | 'select' | 'textarea' | 'multiselect' | 'file';
  accept?: string;
  required?: boolean;
  placeholder?: string;
  colSpan?: 3 | 4 | 6 | 8 | 12;
  rows?: number;
  options?: any[];
  optionLabel?: string;
  optionValue?: string;
  numberMode?: 'decimal' | 'currency';
  currency?: string;
  locale?: string;
  min?: number;
  max?: number;
  errorMessages?: Partial<Record<
    'required' | 'email' | 'min' | 'max' | 'minlength' | 'maxlength' | string,
    string
  >>;
}

@Component({
  selector: 'app-dynamic-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,              // ← changed from ButtonModule
    InputTextModule,
    InputNumberModule,
    DatePickerModule,
    SelectModule,
    TextareaModule,
    MultiSelectModule
  ],
  templateUrl: './dynamic-form-dialog.html',
})
export class DynamicFormDialogComponent {
  @Input() header = 'Dialog';
  @Input() saveLabel = 'Save';
  @Input() visible = false;
  @Input() form!: FormGroup;
  @Input() fields: DialogFieldConfig[] = [];

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<Record<string, any>>();
  @Output() cancelled = new EventEmitter<void>();

  submitError = '';


  private fileMap = new Map<string, File>();

  isInvalid(key: string): boolean {
    const control = this.form.get(key);
    return !!(control?.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(field: DialogFieldConfig): string {
    const errors = this.form.get(field.key)?.errors;
    console.log(errors);
    if (!errors) return '';

    // Check custom messages first, then fall back to defaults
    const custom = field.errorMessages ?? {};
    if (errors['required']) return custom['required'] ?? `${field.label} is required.`;
    if (errors['email']) return custom['email'] ?? 'Enter a valid email address.';
    if (errors['min']) return custom['min'] ?? `Minimum value is ${field.min}.`;
    if (errors['max']) return custom['max'] ?? `Maximum value is ${field.max}.`;
    if (errors['minlength']) return custom['minlength'] ?? `Too short.`;
    if (errors['maxlength']) return custom['maxlength'] ?? `Too long.`;

    return 'Invalid value.';
  }

  onSubmit(): void {
    this.submitError = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.submitError = 'Please fill in all required fields correctly.';
      return;
    }

    this.saved.emit(this.form.value);
    this.close();
  }

  onCancel(): void {
    this.cancelled.emit();
    this.close();
  }

  private close(): void {
    this.submitError = '';
    this.form.reset();
    this.fileMap.clear();   // ← add this
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onHide(): void {
    this.submitError = '';
    this.form.reset();
    this.fileMap.clear();   // ← add this
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onFileChange(event: Event, key: string): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.fileMap.set(key, file);
      this.form.get(key)?.setValue(file);
    }
  }

  getFileName(key: string): string {
    return this.fileMap.get(key)?.name ?? '';
  }
}