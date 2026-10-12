import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilderService } from './form-builder.service';
import { Observable } from 'rxjs';
import { FormDefinition, FormElement, OptionsElement } from './form-element.model';
import { Apiservice } from '../../services/apiservice';
import { getTokenFromLocalStorage, STORAGE_KEYS } from '../../constants';

interface FieldValue {
  value: any;
  touched: boolean;
  errors: string[];
}

interface ImageUploadState {
  status: 'idle' | 'uploading' | 'uploaded' | 'error';
  error?: string;
}

@Component({
  selector: 'app-preview-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './preview-page.html',
  styleUrl: './preview-page.css',
})
export class PreviewPageComponent implements OnInit {
  
  private fb = inject(FormBuilderService);
  formDef$: Observable<FormDefinition> = this.fb.formDef$;

  fieldValues = new Map<string, FieldValue>();
  imageUploadStates = new Map<string, ImageUploadState>();
  readonly imageUploadPreviews = signal<Record<string, string>>({});
  product_id:any="";
  encoded_product_id:any="";
  private token =
    getTokenFromLocalStorage(STORAGE_KEYS.TOKEN_OBJ)?.token || null;

  constructor(
    private route: ActivatedRoute,
    private apiService: Apiservice,
    private cdr: ChangeDetectorRef,
  ) {
    this.route.params.subscribe((params) => {
      const routeId = params['id'];
      if (!routeId) {
        return;
      }
      // Same as builder: route param is the form id (not base64).
      this.encoded_product_id = routeId;
      this.product_id = routeId;
    });
  }

  ngOnInit() {
    // Log form definition JSON when component initializes
    const formDef = this.fb.formDef;
    console.log('Form Definition JSON:', JSON.stringify(formDef, null, 2));
  }

  getFieldValue(elementId: string): FieldValue {
    if (!this.fieldValues.has(elementId)) {
      this.fieldValues.set(elementId, { value: '', touched: false, errors: [] });
    }
    return this.fieldValues.get(elementId)!;
  }

  setFieldValue(elementId: string, value: any) {
    const field = this.getFieldValue(elementId);
    field.value = value;
    field.errors = this.validateField(elementId, value);
  }

  onFieldBlur(elementId: string) {
    const field = this.getFieldValue(elementId);
    field.touched = true;
    field.errors = this.validateField(elementId, field.value);
  }

  validateField(elementId: string, value: any): string[] {
    const formDef = this.fb.formDef;
    const element = formDef.elements.find((e) => e.id === elementId);
    if (!element) return [];

    const errors: string[] = [];

    // Handle checkbox groups differently
    if (element.type === 'checkbox') {
      const hasSelection = this.hasCheckboxSelection(elementId);
      if (element.required && !hasSelection) {
        errors.push(`${element.label || 'This field'} is required`);
      }
      return errors;
    }

    // Handle radio and dropdown
    if (element.type === 'radio' || element.type === 'dropdown') {
      const hasValue = value !== null && value !== undefined && value !== '' && String(value).trim().length > 0;
      if (element.required && !hasValue) {
        errors.push(`${element.label || 'This field'} is required`);
      }
      return errors;
    }

    // Handle file / image upload
    if (element.type === 'file' || element.type === 'image_upload') {
      const hasFile = value && value !== '';
      if (element.required && !hasFile) {
        errors.push(`${element.label || 'This field'} is required`);
      }
      return errors;
    }

    // Handle date
    if (element.type === 'date') {
      const hasValue = value && String(value).trim().length > 0;
      if (element.required && !hasValue) {
        errors.push(`${element.label || 'This field'} is required`);
      }

      // Date range validation
      if (hasValue && element.validation) {
        const selectedDate = new Date(value);
        const minDate = element.validation.minDate ? new Date(element.validation.minDate) : null;
        const maxDate = element.validation.maxDate ? new Date(element.validation.maxDate) : null;

        // Reset time to compare only dates
        selectedDate.setHours(0, 0, 0, 0);
        if (minDate) minDate.setHours(0, 0, 0, 0);
        if (maxDate) maxDate.setHours(0, 0, 0, 0);

        if (minDate && selectedDate < minDate) {
          const minDateStr = minDate.toLocaleDateString();
          errors.push(`Date must be on or after ${minDateStr}`);
        }

        if (maxDate && selectedDate > maxDate) {
          const maxDateStr = maxDate.toLocaleDateString();
          errors.push(`Date must be on or before ${maxDateStr}`);
        }
      }

      return errors;
    }

    // Handle text inputs
    const stringValue = String(value || '').trim();
    const hasValue = stringValue.length > 0;

    // Required validation
    if (element.required && !hasValue) {
      errors.push(`${element.label || 'This field'} is required`);
    }

    // Skip other validations if empty (unless required already caught it)
    if (!hasValue && !element.required) {
      return errors;
    }

    // Min length validation
    if (element.validation?.minLength && stringValue.length < element.validation.minLength) {
      errors.push(
        `Minimum length is ${element.validation.minLength} characters`
      );
    }

    // Max length validation
    if (element.validation?.maxLength && stringValue.length > element.validation.maxLength) {
      errors.push(
        `Maximum length is ${element.validation.maxLength} characters`
      );
    }

    // Email format validation
    if (element.type === 'email' && hasValue) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(stringValue)) {
        errors.push('Please enter a valid email address');
      }
    }

    // Pattern validation
    if (element.validation?.pattern && hasValue) {
      try {
        let regex: RegExp;
        if (element.validation.pattern === 'email') {
          regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!regex.test(stringValue)) {
            errors.push('Please enter a valid email address');
          }
        } else if (element.validation.pattern === 'number') {
          regex = /^\d+$/;
          if (!regex.test(stringValue)) {
            errors.push('Please enter numbers only');
          }
        } else if (element.validation.pattern === 'text') {
          // Text validation - only allow alphabets (letters), no numbers, no special characters
          const lettersOnlyPattern = /^[a-zA-Z\s]+$/;
          if (!lettersOnlyPattern.test(stringValue)) {
            errors.push('Text field only allows alphabets (letters), no numbers or special characters');
          }
        } else {
          regex = new RegExp(element.validation.pattern);
          if (!regex.test(stringValue)) {
            errors.push('Invalid format');
          }
        }
      } catch (e) {
        // Invalid regex pattern - skip
      }
    }

    return errors;
  }

  getImageUploadState(elementId: string): ImageUploadState {
    if (!this.imageUploadStates.has(elementId)) {
      this.imageUploadStates.set(elementId, { status: 'idle' });
    }
    return this.imageUploadStates.get(elementId)!;
  }

  isImageUploading(elementId: string): boolean {
    return this.getImageUploadState(elementId).status === 'uploading';
  }

  isImageUploaded(elementId: string): boolean {
    return this.getImageUploadState(elementId).status === 'uploaded';
  }

  getImageUploadError(elementId: string): string {
    const state = this.getImageUploadState(elementId);
    return state.status === 'error' ? state.error || 'Upload failed.' : '';
  }

  private setImageUploadPreview(elementId: string, url: string | null): void {
    const current = this.imageUploadPreviews()[elementId];
    if (current?.startsWith('blob:') && current !== url) {
      URL.revokeObjectURL(current);
    }
    const next = { ...this.imageUploadPreviews() };
    if (url) {
      next[elementId] = url;
    } else {
      delete next[elementId];
    }
    this.imageUploadPreviews.set(next);
  }

  onImageUploadSelected(elementId: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const state = this.getImageUploadState(elementId);

    if (!file) {
      this.setImageUploadPreview(elementId, null);
      this.setFieldValue(elementId, '');
      state.status = 'idle';
      state.error = undefined;
      this.cdr.detectChanges();
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.setImageUploadPreview(elementId, null);
      state.status = 'error';
      state.error = 'Please select an image file.';
      this.setFieldValue(elementId, '');
      input.value = '';
      this.onFieldBlur(elementId);
      this.cdr.detectChanges();
      return;
    }

    const localPreview = URL.createObjectURL(file);
    this.setImageUploadPreview(elementId, localPreview);
    state.status = 'uploading';
    state.error = undefined;
    this.cdr.detectChanges();

    if (!this.token) {
      state.status = 'error';
      state.error = '';
      this.setFieldValue(elementId, '');
      this.onFieldBlur(elementId);
      this.cdr.detectChanges();
      return;
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('file', file);

    this.apiService.uploadFormImage(this.token, formData).subscribe({
      next: (res: any) => {
        const uploaded =
          res?.data?.url ??
          res?.data?.path ??
          res?.data?.filename ??
          res?.data?.file ??
          res?.data?.image ??
          res?.data?.name ??
          (typeof res?.data === 'string' ? res.data : null) ??
          res?.url ??
          res?.path ??
          res?.filename ??
          res?.file;

        if (!uploaded) {
          state.status = 'error';
          state.error = res?.message || 'Upload failed. No file path returned.';
          this.setFieldValue(elementId, '');
          this.onFieldBlur(elementId);
          this.cdr.detectChanges();
          return;
        }

        this.setFieldValue(elementId, String(uploaded));
        state.status = 'uploaded';
        state.error = undefined;
        this.setImageUploadPreview(elementId, localPreview);
        this.onFieldBlur(elementId);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        state.status = 'error';
        state.error =
          err?.error?.message || err?.message || 'Failed to upload image.';
        this.setFieldValue(elementId, '');
        this.onFieldBlur(elementId);
        this.cdr.detectChanges();
      },
    });
  }

  hasCheckboxSelection(elementId: string): boolean {
    const formDef = this.fb.formDef;
    const element = formDef.elements.find((e) => e.id === elementId);
    if (!element || element.type !== 'checkbox') return false;

    const checkboxElement = element as OptionsElement;
    const options = checkboxElement.options || [];
    return options.some((opt: string, index: number) => {
      const field = this.getFieldValue(elementId + '_' + index);
      return field.value === true;
    });
  }

  updateCheckboxGroup(elementId: string, option: string, checked: boolean) {
    // Re-validate the checkbox group after individual checkbox change
    setTimeout(() => {
      const field = this.getFieldValue(elementId);
      field.errors = this.validateField(elementId, null);
    }, 0);
  }

  hasErrors(elementId: string): boolean {
    const field = this.getFieldValue(elementId);
    return field.touched && field.errors.length > 0;
  }

  getErrors(elementId: string): string[] {
    const field = this.getFieldValue(elementId);
    return field.touched ? field.errors : [];
  }

  onSubmit() {
    const formDef = this.fb.formDef;

    // Mark all fields as touched
    formDef.elements.forEach((el) => {
      if (this.isInputField(el)) {
        const field = this.getFieldValue(el.id);
        field.touched = true;
        field.errors = this.validateField(el.id, field.value);
      }
    });

    // Check if form is valid
    let isValid = true;
    formDef.elements.forEach((el) => {
      if (this.isInputField(el)) {
        const field = this.getFieldValue(el.id);
        if (field.errors.length > 0) {
          isValid = false;
        }
      }
    });

    if (isValid) {
      // Collect form data
      const formData: any = {};
      
      formDef.elements.forEach((el) => {
        if (this.isInputField(el)) {
          const field = this.getFieldValue(el.id);
          
          // Handle checkbox groups differently
          if (el.type === 'checkbox') {
            const checkboxElement = el as OptionsElement;
            const options = checkboxElement.options || [];
            const selectedOptions: string[] = [];
            
            options.forEach((opt: string, index: number) => {
              const checkboxField = this.getFieldValue(el.id + '_' + index);
              if (checkboxField.value === true) {
                selectedOptions.push(opt);
              }
            });
            
            formData[el.id] = {
              label: el.label || el.type,
              value: selectedOptions,
            };
          } else {
            formData[el.id] = {
              label: el.label || el.type,
              value: field.value || null,
            };
          }
        }
      });

      // Log form definition and submission data to console as JSON
      console.log('Form Definition JSON:', JSON.stringify(formDef, null, 2));
      console.log('Form Submission Data:', JSON.stringify(formData, null, 2));
      
      alert('Form submitted successfully! Check console for JSON data.');
    } else {
      alert('Please fix the errors before submitting.');
    }
  }

  private isInputField(el: FormElement): boolean {
    return !['heading', 'divider', 'image', 'button'].includes(el.type);
  }
}


