import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilderService } from './form-builder.service';
import { FormElement } from './form-element.model';
import { isFixedFormElement } from './form-fixed-fields';
import { combineLatest, map, Observable } from 'rxjs';

@Component({
  selector: 'app-properties-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="panel">
      <div class="panel-header">Field Properties</div>

      <ng-container *ngIf="vm$ | async as vm">
        <div *ngIf="!vm.selected" class="content">
          <div class="section">
            <div class="section-title">Form Settings</div>
           
          </div>
          <div class="empty-message">
            Select a field on the canvas to edit its properties.
          </div>
        </div>

        <div *ngIf="vm.selected && vm.selected.type === 'divider'" class="empty">
          Divider elements have no configurable properties.
        </div>

        <div *ngIf="vm.selected && vm.selected.type !== 'divider'" class="content">
          <p class="fixed-field-note" *ngIf="isFixed(vm.selected)">
            This is a fixed field. It cannot be deleted, but it can be rearranged.
          </p>
          <div class="section">
            <div class="section-title">Basic</div>

            <label class="field-label">
              Label
              <input
                type="text"
                class="field-input"
                [(ngModel)]="vm.selected.label"
                (ngModelChange)="update('label', $event)"
                [disabled]="isFixed(vm.selected) && vm.selected.type !== 'heading'"
              />
            </label>

            <label
              class="field-label"
              *ngIf="showPlaceholder(vm.selected.type)"
            >
              Placeholder
              <input
                type="text"
                class="field-input"
                [(ngModel)]="vm.selected.placeholder"
                (ngModelChange)="update('placeholder', $event)"
              />
            </label>

            <label
              class="checkbox-row"
              *ngIf="vm.selected.type !== 'heading'"
            >
              <input
                type="checkbox"
                [(ngModel)]="vm.selected.required"
                (ngModelChange)="update('required', $event)"
                [disabled]="isFixed(vm.selected)"
              />
              Required
            </label>

          </div>

          <div
            class="section"
            *ngIf="vm.selected.type === 'heading'"
          >
            <div class="section-title">Styles</div>

            <label class="field-label inline">
              Font size
              <input
                type="number"
                class="field-input small"
                [ngModel]="vm.selected.styles?.fontSize"
                (ngModelChange)="updateStyle('fontSize', $event)"
              />
              <span class="suffix">px</span>
            </label>

            <label class="field-label inline">
              Color
              <input
                type="color"
                class="color-input"
                [ngModel]="vm.selected.styles?.color"
                (ngModelChange)="updateStyle('color', $event)"
              />
            </label>
          </div>

          <div
            class="section"
            *ngIf="vm.selected.type !== 'heading' && vm.selected.type !== 'email' && vm.selected.type !== 'dropdown' && vm.selected.type !== 'checkbox' && vm.selected.type !== 'radio'"
          >
            <div class="section-title">Validation</div>

            <!-- Date Range for Date fields -->
            <ng-container *ngIf="vm.selected.type === 'date'">
              <label class="field-label">
                Min date
                <input
                  type="date"
                  class="field-input"
                  [ngModel]="vm.selected.validation?.minDate"
                  (ngModelChange)="updateValidation('minDate', $event)"
                />
              </label>

              <label class="field-label">
                Max date
                <input
                  type="date"
                  class="field-input"
                  [ngModel]="vm.selected.validation?.maxDate"
                  (ngModelChange)="updateValidation('maxDate', $event)"
                />
              </label>
            </ng-container>

            <!-- Min/Max Length for non-date fields -->
            <ng-container *ngIf="vm.selected.type !== 'date'">
              <label class="field-label inline">
                Min length
                <input
                  type="number"
                  class="field-input small"
                  [ngModel]="vm.selected.validation?.minLength"
                  (ngModelChange)="updateValidation('minLength', $event)"
                />
              </label>

              <label class="field-label inline">
                Max length
                <input
                  type="number"
                  class="field-input small"
                  [ngModel]="vm.selected.validation?.maxLength"
                  (ngModelChange)="updateValidation('maxLength', $event)"
                />
              </label>

              <label
                class="field-label"
                *ngIf="vm.selected.type !== 'number' && vm.selected.type !== 'textarea'"
              >
                Validation Rules
                <select
                  class="field-input"
                  [ngModel]="vm.selected.validation?.pattern || 'text'"
                  (ngModelChange)="updateValidation('pattern', $event)"
                >
                  <option value="text">Text</option>
                  <option value="email">Email</option>
                  <option value="number">Number</option>
                </select>
              </label>
            </ng-container>
          </div>

          <div
            class="section"
            *ngIf="supportsOptions(vm.selected.type)"
          >
            <div class="section-title">Options</div>
            <div class="hint">
              One option per line.
            </div>
            <textarea
              class="field-textarea"
              rows="5"
              [ngModel]="$any(vm.selected).options?.join('\n')"
              (ngModelChange)="onOptionsChange($event, vm.selected)"
              [disabled]="isFixed(vm.selected)"
            ></textarea>
          </div>

          <div
            class="section"
            *ngIf="vm.selected.type === 'button'"
          >
            <div class="section-title">Button Style</div>
            <div class="segmented">
              <button
                type="button"
                [class.active]="$any(vm.selected).buttonStyle === 'primary'"
                (click)="updateButtonStyle(vm.selected, 'primary')"
              >
                Primary
              </button>
              <button
                type="button"
                [class.active]="$any(vm.selected).buttonStyle === 'secondary'"
                (click)="updateButtonStyle(vm.selected, 'secondary')"
              >
                Secondary
              </button>
              <button
                type="button"
                [class.active]="$any(vm.selected).buttonStyle === 'outline'"
                (click)="updateButtonStyle(vm.selected, 'outline')"
              >
                Outline
              </button>
            </div>
          </div>

          <div
            class="section"
            *ngIf="vm.selected.type === 'image'"
          >
            <div class="section-title">Image</div>
            <label class="field-label">
              Image URL
              <input
                type="text"
                class="field-input"
                [ngModel]="$any(vm.selected).src"
                (ngModelChange)="onImageUpdate('src', $event, vm.selected)"
              />
            </label>
            <label class="field-label">
              Alt text
              <input
                type="text"
                class="field-input"
                [ngModel]="$any(vm.selected).alt"
                (ngModelChange)="onImageUpdate('alt', $event, vm.selected)"
              />
            </label>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [
    `
      .panel {
        height: 100%;
        display: flex;
        flex-direction: column;
        background: #f8fafc;
        border-left: 1px solid #e2e8f0;
      }
      .panel-header {
        padding: 12px 16px;
        font-weight: 600;
        border-bottom: 1px solid #e2e8f0;
      }
      .empty {
        padding: 16px;
        font-size: 13px;
        color: #6b7280;
      }
      .empty-message {
        padding: 16px;
        margin-top: 12px;
        font-size: 13px;
        color: #6b7280;
        text-align: center;
        font-style: italic;
      }
      .content {
        padding: 8px 12px 16px;
        overflow-y: auto;
      }
      .fixed-field-note {
        margin: 0 0 10px;
        padding: 8px 10px;
        font-size: 12px;
        line-height: 1.4;
        color: #92400e;
        background: #fffbeb;
        border: 1px solid #fde68a;
        border-radius: 6px;
      }
      .section {
        margin-bottom: 12px;
        padding-bottom: 12px;
        border-bottom: 1px solid #e5e7eb;
      }
      .section:last-child {
        border-bottom: none;
      }
      .section-title {
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: #94a3b8;
        margin-bottom: 6px;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .soon {
        font-size: 10px;
        padding: 1px 6px;
        border-radius: 999px;
        background: #e0f2fe;
        color: #0369a1;
      }
      .field-label {
        display: block;
        font-size: 12px;
        font-weight: 500;
        margin-bottom: 4px;
        color: #0f172a;
      }
      .field-label.inline {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .field-input {
        width: 100%;
        border-radius: 6px;
        border: 1px solid #d1d5db;
        padding: 4px 6px;
        font-size: 12px;
        margin-top: 2px;
      }
      .field-input.small {
        max-width: 80px;
      }
      .field-textarea {
        width: 100%;
        border-radius: 6px;
        border: 1px solid #d1d5db;
        padding: 4px 6px;
        font-size: 12px;
        margin-top: 2px;
        resize: vertical;
      }
      .checkbox-row {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        margin-top: 4px;
      }
      .hint {
        font-size: 11px;
        color: #6b7280;
        margin-top: 2px;
      }
      .suffix {
        font-size: 11px;
        color: #6b7280;
      }
      .color-input {
        border: none;
        background: transparent;
        padding: 0;
        width: 40px;
        height: 24px;
      }
      .segmented {
        display: inline-flex;
        border-radius: 999px;
        border: 1px solid #cbd5f5;
        overflow: hidden;
        margin-top: 4px;
      }
      .segmented button {
        border: none;
        background: transparent;
        padding: 3px 10px;
        font-size: 11px;
        cursor: pointer;
        color: #475569;
      }
      .segmented button.active {
        background: #2563eb;
        color: white;
      }
      code {
        background: #e5e7eb;
        padding: 1px 3px;
        border-radius: 3px;
      }
    `,
  ],
})
export class PropertiesPanelComponent {
  private fb = inject(FormBuilderService);

  formDef$ = this.fb.formDef$;

  vm$: Observable<{ selected: FormElement | null; allFields: FormElement[] }> =
    combineLatest([this.fb.formDef$, this.fb.selectedElementId$]).pipe(
      map(([form, selectedId]) => ({
        selected: form.elements.find((e) => e.id === selectedId) ?? null,
        allFields: form.elements,
      }))
    );

  isFixed(el: FormElement | null): boolean {
    return !!el && isFixedFormElement(el);
  }

  showPlaceholder(type: string): boolean {
    return ['text', 'email', 'number', 'textarea'].includes(type);
  }

  supportsOptions(type: string): boolean {
    return ['dropdown', 'radio', 'checkbox'].includes(type);
  }

  private selectedId(): string | null {
    return this.fb.selectedElementId;
  }

  update<K extends keyof FormElement>(key: K, value: FormElement[K]) {
    const id = this.selectedId();
    if (!id) {
      return;
    }
    this.fb.updateElement(id, { [key]: value } as any);
  }

  updateStyle(key: 'fontSize' | 'color' | 'textAlign', value: any) {
    const id = this.selectedId();
    if (!id) {
      return;
    }
    const form = this.fb.formDef;
    const current = form.elements.find((e) => e.id === id)?.styles || {};
    this.fb.updateElement(id, { styles: { ...current, [key]: value } } as any);
  }

  updateValidation(key: 'minLength' | 'maxLength' | 'pattern' | 'minDate' | 'maxDate', value: any) {
    const id = this.selectedId();
    if (!id) {
      return;
    }
    const form = this.fb.formDef;
    const current = form.elements.find((e) => e.id === id)?.validation || {};
    const parsedValue =
      key === 'minLength' || key === 'maxLength'
        ? value === null || value === '' || Number.isNaN(Number(value))
          ? undefined
          : Number(value)
        : key === 'minDate' || key === 'maxDate'
        ? value === null || value === '' ? undefined : value
        : value;
    this.fb.updateElement(id, {
      validation: { ...current, [key]: parsedValue },
    } as any);
  }

  onOptionsChange(text: string, el: FormElement) {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    this.fb.updateElement(el.id, { ...(el as any), options: lines } as any);
  }

  updateButtonStyle(
    el: FormElement,
    style: 'primary' | 'secondary' | 'outline',
  ) {
    this.fb.updateElement(el.id, { ...(el as any), buttonStyle: style } as any);
  }

  onImageUpdate(key: 'src' | 'alt', value: string, el: FormElement) {
    this.fb.updateElement(el.id, { ...(el as any), [key]: value } as any);
  }

  onFormNameChange(name: string) {
    this.fb.setTitle(name);
  }
}


