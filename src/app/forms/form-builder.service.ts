import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import {
  FormDefinition,
  FormElement,
  FormElementType,
} from './form-element.model';
import {
  ensureFixedFormElements,
  isFixedFormElement,
} from './form-fixed-fields';
import { Apiservice } from '../../services/apiservice';

@Injectable({
  providedIn: 'root',
})
export class FormBuilderService {
  private platformId = inject(PLATFORM_ID);
  private productId: string | null = null;
  private formId: string | null = null;
  private formType: string | null = null;

  constructor(private apiService: Apiservice) {
    
  }

  private _formDef = new BehaviorSubject<FormDefinition>({
    title: 'Untitled Form',
    elements: [],
  });

  private _selectedElementId = new BehaviorSubject<string | null>(null);

  formDef$ = this._formDef.asObservable();
  selectedElementId$ = this._selectedElementId.asObservable();

  get formDef(): FormDefinition {
    return this._formDef.value;
  }

  get selectedElementId(): string | null {
    return this._selectedElementId.value;
  }

  selectElement(id: string | null) {
    this._selectedElementId.next(id);
  }

  private generateId(type: FormElementType): string {
    const rand = Math.random().toString(36).substring(2, 7);
    return `${type}_${Date.now()}_${rand}`;
  }

  createElementFromType(type: FormElementType): FormElement {
    const base: FormElement = {
      id: this.generateId(type),
      type,
      label: this.defaultLabel(type),
      placeholder: this.defaultPlaceholder(type),
      required: false,
      helperText: '',
      styles: {
        fontSize: 14,
        color: '#111827',
        textAlign: 'left',
      },
      validation: {},
      logic: {},
    };

    if (type === 'dropdown' || type === 'radio' || type === 'checkbox') {
      return {
        ...base,
        options: ['Option 1', 'Option 2'],
      };
    }

    if (type === 'button') {
      return {
        ...base,
        buttonStyle: 'primary',
        label: 'Submit',
      };
    }

    if (type === 'image') {
      return {
        ...base,
        src: 'https://via.placeholder.com/400x150',
        alt: 'Image',
      };
    }

    if (type === 'image_upload') {
      return {
        ...base,
        label: 'Image Upload',
        placeholder: 'Choose an image',
      };
    }

    if (type === 'heading') {
      return {
        ...base,
        label: 'Form Heading',
      };
    }

    if (type === 'divider') {
      return {
        ...base,
        label: '',
        helperText: '',
      };
    }

    return base;
  }

  private defaultLabel(type: FormElementType): string {
    switch (type) {
      case 'text':
        return 'Text';
      case 'email':
        return 'Email';
      case 'number':
        return 'Number';
      case 'dropdown':
        return 'Dropdown';
      case 'radio':
        return 'Radio Buttons';
      case 'checkbox':
        return 'Checkboxes';
      case 'file':
        return 'File Upload';
      case 'date':
        return 'Date';
      case 'textarea':
        return 'Textarea';
      case 'image':
        return 'Image';
      case 'image_upload':
        return 'Image Upload';
      case 'heading':
        return 'Heading';
      case 'divider':
        return 'Divider';
      case 'button':
        return 'Submit Button';
      default:
        return 'Field';
    }
  }

  private defaultPlaceholder(type: FormElementType): string | undefined {
    switch (type) {
      case 'text':
        return 'Enter text';
      case 'email':
        return 'Enter email';
      case 'number':
        return 'Enter number';
      case 'textarea':
        return 'Enter description';
      default:
        return undefined;
    }
  }

  loadFromJson(json: string) {
    try {
      const parsed = JSON.parse(json) as FormDefinition;
      if (!parsed || !Array.isArray(parsed.elements)) {
        throw new Error('Invalid form format');
      }
      const before = JSON.stringify(parsed.elements || []);
      const normalized = this.normalizeFormDefinition(parsed);
      this._formDef.next(normalized);
      this._selectedElementId.next(null);

      // Persist when fixed fields were injected / normalized
      if (
        this.usesFixedFields() &&
        before !== JSON.stringify(normalized.elements)
      ) {
        this.logFormJson('Product form normalized with fixed fields');
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      //console.error('Failed to parse form JSON', e);
      // Simple feedback; in real app, use a toast service
      //alert('Invalid JSON');
    }
  }

  exportToJson(): string {
    return JSON.stringify(this.formDef, null, 2);
  }

  /**
   * Sets the product ID for the current form
   * Should be called when loading a form for a specific product
   */
  setProductId(productId: string | null): void {
    this.productId = productId;
  }

  /**
   * Gets the current product ID
   */
  getProductId(): string | null {
    return this.productId;
  }

  /**
   * Sets the form ID for the current form
   * Should be called when loading a form from the API
   */
  setFormId(formId: string | null): void {
    this.formId = formId;
  }

  /**
   * Gets the current form ID
   */
  getFormId(): string | null {
    return this.formId;
  }

  setFormType(formType: string | number | null): void {
    this.formType = formType != null ? String(formType) : null;
  }

  usesFixedFields(): boolean {
    return this.formType === '1';
  }

  isFixedElement(id: string): boolean {
    const el = this.formDef.elements.find((e) => e.id === id);
    return el ? isFixedFormElement(el) : false;
  }

  private normalizeFormDefinition(form: FormDefinition): FormDefinition {
    return {
      ...form,
      elements: ensureFixedFormElements(form.elements, this.usesFixedFields()),
    };
  }

  /**
   * Logs the current form definition as JSON to the console
   * Called automatically after any form mutation (add, edit, delete, reorder, title change)
   */
  private logFormJson(action: string = 'Form updated'): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const json = this.exportToJson();
    console.log(JSON.parse(json)); // Log as formatted object

    // Get token from localStorage
    let token: string | null = null;
    try {
      const tokenObj = JSON.parse(localStorage.getItem('token_obj') || '{}');
      token = tokenObj.token || null;
    } catch (error) {
      console.error('Error getting token from localStorage:', error);
    }

    // Get product ID
    const productId = this.productId;
    
    // Get form ID
    const formId = this.formId;

    console.log('Token:', token);
    console.log('Product ID:', productId);
    console.log('Form ID:', formId);

    // Uncomment when API method is ready
    if (token && formId) {

      const form_data= JSON.parse(json);
      var data:any = {
        form_name: form_data.title,
        form_json: JSON.stringify(form_data.elements),
        form_id: formId,
      }
      console.log(JSON.stringify(data));
      this.apiService.revoFormUpdate( token,data).subscribe((res: any) => {
        console.log('Form updated via API:', res);
      }, (error: any) => {
        console.error('Error updating form via API:', error);
      });
    }
  }

  setTitle(title: string) {
    const form = { ...this.formDef, title };
    this._formDef.next(form);
    //this.logFormJson('Form title updated');
  }

  addElement(type: FormElementType, index?: number) {
    // Heading / Divider are only available as fixed fields on product forms
    if (type === 'heading' || type === 'divider') {
      return;
    }

    const newEl = this.createElementFromType(type);
    const form = { ...this.formDef, elements: [...this.formDef.elements] };

    if (index == null || index < 0 || index > form.elements.length) {
      form.elements.push(newEl);
    } else {
      form.elements.splice(index, 0, newEl);
    }

    this._formDef.next(form);
    this.selectElement(newEl.id);
    this.logFormJson(`Element added: ${type}`);
  }

  updateElement(id: string, patch: Partial<FormElement>) {
    const form = { ...this.formDef, elements: [...this.formDef.elements] };
    const idx = form.elements.findIndex((e) => e.id === id);
    if (idx === -1) {
      return;
    }
    form.elements[idx] = {
      ...form.elements[idx],
      ...patch,
    } as FormElement;
    this._formDef.next(form);
    this.logFormJson(`Element updated: ${form.elements[idx].type} (${id})`);
  }

  deleteElement(id: string) {
    const form = { ...this.formDef, elements: [...this.formDef.elements] };
    const elementToDelete = form.elements.find((e) => e.id === id);
    if (elementToDelete && isFixedFormElement(elementToDelete)) {
      return;
    }
    form.elements = form.elements.filter((e) => e.id !== id);
    this._formDef.next(form);
    if (this.selectedElementId === id) {
      this.selectElement(null);
    }
    this.logFormJson(`Element deleted: ${elementToDelete?.type || 'unknown'} (${id})`);
  }

  reorderElements(previousIndex: number, currentIndex: number) {
    const form = { ...this.formDef, elements: [...this.formDef.elements] };
    if (
      previousIndex < 0 ||
      currentIndex < 0 ||
      previousIndex >= form.elements.length ||
      currentIndex >= form.elements.length ||
      previousIndex === currentIndex
    ) {
      return;
    }
    const el = form.elements.splice(previousIndex, 1)[0];
    form.elements.splice(currentIndex, 0, el);
    this._formDef.next(form);
    this.logFormJson(`Elements reordered: from index ${previousIndex} to ${currentIndex}`);
  }

}
