import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { FormBuilderService } from './form-builder.service';
import { FormElement } from './form-element.model';
import { isFixedFormElement } from './form-fixed-fields';
import { FormsModule } from '@angular/forms';

// <div class="canvas-toolbar" (click)="$event.stopPropagation()">
//         <input
//           type="text"
//           class="form-title-input"
//           [value]="(formDef$ | async)?.title"
//           (input)="onTitleChange($any($event.target).value)"
//           placeholder="Form Name"
//         />
//         <div class="toolbar-actions">
//           <button type="button" class="btn-outline" (click)="toggleJson()">
//             {{ showJson ? 'Hide JSON' : 'Show JSON' }}
//           </button>
//         </div>
//       </div>

@Component({
  selector: 'app-form-canvas',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule],
  template: `
    <div class="canvas-root" [class.canvas-root--preview]="mode === 'preview'" (click)="mode !== 'preview' && clearSelection()">
      

      <div
        cdkDropList
        class="canvas-dropzone"
        [class.drag-disabled]="formStatus === '1' || mode === 'preview'"
        [cdkDropListDisabled]="formStatus === '1' || mode === 'preview'"
        (cdkDropListDropped)="formStatus !== '1' && mode !== 'preview' ? onDrop($event) : null"
        (click)="$event.stopPropagation()"
      >
        <ng-container *ngIf="formDef$ | async as formDef">
          <div *ngIf="formDef.elements.length === 0" class="canvas-empty">
            {{ mode === 'preview' ? 'Fields you add will appear here.' : 'Add a field to start this form.' }}
          </div>

          <div
            class="canvas-element"
            *ngFor="let el of formDef.elements; let i = index"
            (click)="onSelect(el.id, $event)"
            [class.selected]="(selectedId$ | async) === el.id"
            [class.canvas-element--fixed]="isFixed(el)"
            cdkDrag
            [cdkDragDisabled]="formStatus === '1' || mode === 'preview'"
            [cdkDragData]="el"
          >
            <div class="canvas-element-header">
              <button type="button" class="el-copy" (click)="onSelect(el.id, $event)">
                <span class="el-label">{{ el.label || (el.type | titlecase) }}</span>
                <span class="el-meta">{{ el.type }}{{ el.required ? ' · required' : '' }}</span>
              </button>
              <div class="canvas-element-actions" *ngIf="formStatus !== '1' && mode !== 'preview'">
                <button
                  type="button"
                  class="icon-btn"
                  (click)="moveElementUp(i, $event)"
                  [disabled]="i === 0"
                  aria-label="Move up"
                >
                  <i class="fa fa-arrow-up" aria-hidden="true"></i>
                </button>
                <button
                  type="button"
                  class="icon-btn"
                  (click)="moveElementDown(i, $event)"
                  [disabled]="i === formDef.elements.length - 1"
                  aria-label="Move down"
                >
                  <i class="fa fa-arrow-down" aria-hidden="true"></i>
                </button>
                <button
                  type="button"
                  class="icon-btn"
                  *ngIf="!isFixed(el)"
                  (click)="deleteElement(el.id); $event.stopPropagation()"
                  aria-label="Remove field"
                >
                  <i class="fa fa-trash-o" aria-hidden="true"></i>
                </button>
              </div>
            </div>

            <div class="canvas-element-body">
              <ng-container [ngSwitch]="el.type">
                <ng-container *ngSwitchCase="'heading'">
                  <h2
                    [ngStyle]="{
                      'font-size.px': el.styles?.fontSize,
                      color: el.styles?.color,
                      'text-align': el.styles?.textAlign
                    }"
                  >
                    {{ el.label }}
                  </h2>
                </ng-container>

                <ng-container *ngSwitchCase="'divider'">
                  <hr />
                </ng-container>

                <ng-container *ngSwitchCase="'image'">
                  <img
                    [src]="$any(el).src || ''"
                    [alt]="$any(el).alt || ''"
                    class="preview-image"
                  />
                </ng-container>

                <ng-container *ngSwitchCase="'button'">
                  <button
                    type="button"
                    class="preview-button"
                    [ngClass]="$any(el).buttonStyle || 'primary'"
                  >
                    {{ el.label || 'Submit' }}
                  </button>
                </ng-container>

                <ng-container *ngSwitchCase="'text'">
                  <label class="field-label">
                    {{ el.label }}
                    <span *ngIf="el.required" class="required">*</span>
                  </label>
                  <input
                    type="text"
                    class="field-input"
                    [placeholder]="el.placeholder"
                  />
                </ng-container>

                <ng-container *ngSwitchCase="'email'">
                  <label class="field-label">
                    {{ el.label }}
                    <span *ngIf="el.required" class="required">*</span>
                  </label>
                  <input
                    type="email"
                    class="field-input"
                    [placeholder]="el.placeholder"
                  />
                </ng-container>

                <ng-container *ngSwitchCase="'number'">
                  <label class="field-label">
                    {{ el.label }}
                    <span *ngIf="el.required" class="required">*</span>
                  </label>
                  <input
                    type="number"
                    class="field-input"
                    [placeholder]="el.placeholder"
                  />
                </ng-container>

                <ng-container *ngSwitchCase="'textarea'">
                  <label class="field-label">
                    {{ el.label }}
                    <span *ngIf="el.required" class="required">*</span>
                  </label>
                  <textarea
                    class="field-textarea"
                    [placeholder]="el.placeholder"
                  ></textarea>
                </ng-container>

                <ng-container *ngSwitchCase="'dropdown'">
                  <label class="field-label">
                    {{ el.label }}
                    <span *ngIf="el.required" class="required">*</span>
                  </label>
                  <select class="field-input">
                    <option disabled selected>
                      {{ el.placeholder || 'Select...' }}
                    </option>
                    <option *ngFor="let opt of $any(el).options">
                      {{ opt }}
                    </option>
                  </select>
                </ng-container>

                <ng-container *ngSwitchCase="'radio'">
                  <label class="field-label">
                    {{ el.label }}
                    <span *ngIf="el.required" class="required">*</span>
                  </label>
                  <div
                    class="choice-row"
                    *ngFor="let opt of $any(el).options"
                  >
                    <input type="radio" [name]="el.id" /> {{ opt }}
                  </div>
                </ng-container>

                <ng-container *ngSwitchCase="'checkbox'">
                  <label class="field-label">
                    {{ el.label }}
                    <span *ngIf="el.required" class="required">*</span>
                  </label>
                  <div
                    class="choice-row"
                    *ngFor="let opt of $any(el).options"
                  >
                    <input type="checkbox" /> {{ opt }}
                  </div>
                </ng-container>

                <ng-container *ngSwitchCase="'date'">
                  <label class="field-label">
                    {{ el.label }}
                    <span *ngIf="el.required" class="required">*</span>
                  </label>
                  <input type="date" class="field-input" />
                </ng-container>

                <ng-container *ngSwitchCase="'file'">
                  <label class="field-label">
                    {{ el.label }}
                    <span *ngIf="el.required" class="required">*</span>
                  </label>
                  <input type="file" class="field-input" />
                </ng-container>

                <ng-container *ngSwitchCase="'image_upload'">
                  <label class="field-label">
                    {{ el.label }}
                    <span *ngIf="el.required" class="required">*</span>
                  </label>
                  <div class="image-upload-field image-upload-field--builder">
                    <input type="file" class="field-input" accept="image/*" disabled />
                    <span class="image-upload-hint">Users can upload an image here</span>
                  </div>
                </ng-container>
              </ng-container>
            </div>
          </div>
        </ng-container>
      </div>

      <div *ngIf="showJson" class="json-panel" (click)="$event.stopPropagation()">
        <textarea
          class="json-textarea"
          [(ngModel)]="jsonText"
        ></textarea>
        <div class="json-actions">
          <button type="button" class="btn-primary" (click)="onLoadJson()">
            Load from JSON
          </button>
          <button type="button" class="btn-outline" (click)="onExportJson()">
            Refresh JSON
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .canvas-root {
        display: flex;
        flex-direction: column;
        background: transparent;
        color: oklch(0.25 0.035 260);
        font-family: Inter, system-ui, sans-serif;
      }
      .canvas-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 14px;
        border-bottom: 1px solid #e2e8f0;
        background: #ffffff;
      }
      .form-title-input {
        border: none;
        outline: none;
        font-size: 18px;
        font-weight: 600;
        background: transparent;
        min-width: 0;
      }
      .toolbar-actions {
        display: flex;
        gap: 8px;
      }
      .btn-outline,
      .btn-primary {
        border-radius: 16px;
        padding: 4px 10px;
        font-size: 12px;
        border: 1px solid #cbd5f5;
        background: white;
        cursor: pointer;
      }
      .btn-primary {
        background: #2563eb;
        border-color: #2563eb;
        color: white;
      }
      .btn-outline:hover,
      .btn-primary:hover {
        filter: brightness(0.97);
      }

      .canvas-dropzone {
        flex: 1;
        overflow-y: auto;
        padding: 0;
      }
      .canvas-empty {
        border: 1px dashed oklch(0.93 0.012 270);
        border-radius: 0.75rem;
        padding: 2rem 1rem;
        text-align: center;
        color: oklch(0.58 0.035 260);
        font-size: 14px;
        background: #fff;
      }
      .canvas-element {
        display: flex;
        flex-direction: column;
        background: #ffffff;
        border-radius: 0.75rem;
        border: 1px solid oklch(0.93 0.012 270);
        padding: 0.5rem;
        margin-bottom: 0.5rem;
        cursor: pointer;
      }
      .canvas-element:hover {
        border-color: oklch(0.55 0.23 285);
      }
      .canvas-element.selected {
        border-color: oklch(0.55 0.23 285);
        background: oklch(0.965 0.02 280);
      }
      .canvas-root--preview .canvas-element-header {
        display: none;
      }
      .canvas-root--preview .canvas-element {
        border: 0;
        background: transparent;
        padding: 0;
        margin-bottom: 1rem;
        cursor: default;
        box-shadow: none;
      }
      .canvas-root--preview .canvas-element:hover,
      .canvas-root--preview .canvas-element.selected {
        border: 0;
        background: transparent;
      }
      .canvas-root:not(.canvas-root--preview) .canvas-element-body {
        display: none;
      }
      .canvas-element.cdk-drag-animating {
        transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
      }
      .canvas-dropzone.cdk-drop-list-dragging .canvas-element:not(.cdk-drag-placeholder) {
        transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
      }
      .canvas-element.cdk-drag-preview {
        box-shadow: 0 5px 15px rgba(15, 23, 42, 0.2);
        opacity: 0.9;
      }
      .canvas-element.cdk-drag-placeholder {
        opacity: 0.4;
        background: #f1f5f9;
      }
      .canvas-element-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .el-copy {
        min-width: 0;
        flex: 1;
        padding: 0;
        border: 0;
        background: transparent;
        text-align: left;
        cursor: pointer;
        font: inherit;
        color: inherit;
      }
      .drag-handle {
        cursor: grab;
        color: #94a3b8;
        font-size: 16px;
        margin-right: 8px;
        user-select: none;
      }
      .drag-handle:active {
        cursor: grabbing;
      }
      .canvas-dropzone.drag-disabled .canvas-element {
        cursor: default;
      }
      .canvas-dropzone.drag-disabled .canvas-element:hover {
        background: transparent;
      }
      .canvas-dropzone.drag-disabled .canvas-element.cdk-drag {
        cursor: default !important;
      }
      .el-label {
        display: block;
        overflow: hidden;
        font-weight: 500;
        font-size: 14px;
        color: oklch(0.25 0.035 260);
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .el-meta {
        display: block;
        margin-top: 0.125rem;
        font-size: 11px;
        color: oklch(0.58 0.035 260);
      }
      .canvas-element--fixed {
        border-color: oklch(0.93 0.012 270);
      }
      .canvas-element-actions {
        display: flex;
        gap: 4px;
      }
      .icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        background: transparent;
        border: none;
        border-radius: calc(1.125rem - 2px);
        color: oklch(0.58 0.035 260);
        cursor: pointer;
        font-size: 14px;
      }
      .icon-btn:hover:not(:disabled) {
        color: #0f172a;
      }
      .icon-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
      .canvas-element-body {
        font-size: 13px;
      }
      .field-label {
        display: block;
        margin-bottom: 0.375rem;
        font-size: 13px;
        font-weight: 500;
      }
      .required {
        color: oklch(0.64 0.22 12);
      }
      .field-input,
      .field-textarea {
        width: 100%;
        height: 2.5rem;
        border-radius: calc(1.125rem - 2px);
        border: 1px solid oklch(0.93 0.012 270);
        padding: 0 0.75rem;
        font: inherit;
        font-size: 14px;
        background: #fff;
        box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
      }
      .field-textarea {
        height: 6rem;
        min-height: 6rem;
        padding-top: 0.5rem;
        resize: vertical;
      }
      .helper-text {
        margin-top: 3px;
        font-size: 11px;
        color: #6b7280;
      }
      .choice-row {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 3px;
      }
      hr {
        border: none;
        border-top: 1px solid #e5e7eb;
        margin: 6px 0;
      }
      .preview-image {
        max-width: 100%;
        border-radius: 8px;
      }
      .image-upload-field--builder {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .image-upload-hint {
        font-size: 12px;
        color: #6b7280;
      }
      .preview-button {
        border-radius: 999px;
        border: none;
        padding: 6px 18px;
        font-size: 13px;
        cursor: pointer;
      }
      .preview-button.primary {
        background: #2563eb;
        color: #ffffff;
      }
      .preview-button.secondary {
        background: #e5e7eb;
        color: #111827;
      }
      .preview-button.outline {
        background: transparent;
        border: 1px solid #9ca3af;
        color: #111827;
      }

      .json-panel {
        border-top: 1px solid #e2e8f0;
        background: #0f172a;
        padding: 8px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        height: 200px;
      }
      .json-textarea {
        flex: 1;
        width: 100%;
        background: #020617;
        color: #e5e7eb;
        border-radius: 6px;
        border: 1px solid #1e293b;
        padding: 6px 8px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
          'Liberation Mono', 'Courier New', monospace;
        font-size: 11px;
        resize: none;
      }
      .json-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
    `,
  ],
})
export class FormCanvasComponent {
  private fb = inject(FormBuilderService);

  formDef$ = this.fb.formDef$;
  selectedId$ = this.fb.selectedElementId$;

  showJson = false;
  jsonText = '';

  // The passed value will be named form_json_data.
  @Input() set form_json_data(value: any) {
    console.log('form_json_data setter called with:', value);
    console.log('Type of value:', typeof value);
    
    if (!value || value === '') {
      console.log('Value is empty, skipping');
      return;
    }
    
    let parsedData: any;
    
    // Parse if it's a string
    if (typeof value === 'string') {
      try {
        parsedData = JSON.parse(value);
      } catch (e) {
        console.error('Error parsing JSON string:', e);
        return;
      }
    } else {
      parsedData = value;
    }
    
    console.log('Parsed data:', parsedData);
    
    // Extract form_name and set as title
    if (parsedData.form_name) {
      console.log('Setting form title from form_name:', parsedData.form_name);
      this.fb.setTitle(parsedData.form_name);
    }
    
    // Prepare the form JSON to load
    // If there's a form_json property, use that; otherwise use the whole object
    let formJsonToLoad: any;
    if (parsedData.form_json) {
      // If form_json is a string, parse it; if it's already an object, use it
      formJsonToLoad = typeof parsedData.form_json === 'string' 
        ? JSON.parse(parsedData.form_json) 
        : parsedData.form_json;
    } else {
      // Use the parsed data directly (assuming it's the form definition)
      formJsonToLoad = parsedData;
    }
    
    // Stringify for loadFromJson (which expects a JSON string)
    const jsonString = JSON.stringify(formJsonToLoad);
    
    console.log('JSON String to load:', jsonString);
    
    // Set the jsonText and load into fb on input change
    this.jsonText = jsonString;
    try {
      this.fb.loadFromJson(jsonString);
      console.log('Form loaded successfully');
    } catch (error) {
      console.error('Error loading form from JSON:', error);
    }
  }

  @Input() formStatus: string = '';
  @Input() mode: 'list' | 'preview' = 'list';

  constructor() {
    this.jsonText = this.fb.exportToJson();
  }

  onTitleChange(title: string) {
    this.fb.setTitle(title);
  }

  clearSelection() {
    this.fb.selectElement(null);
  }

  onSelect(id: string, event: MouseEvent) {
    event.stopPropagation();
    this.fb.selectElement(id);
  }

  isFixed(el: FormElement): boolean {
    return isFixedFormElement(el);
  }

  deleteElement(id: string) {
    this.fb.deleteElement(id);
  }

  onDrop(event: CdkDragDrop<FormElement[]>) {
    if (event.previousIndex !== event.currentIndex) {
      this.fb.reorderElements(event.previousIndex, event.currentIndex);
    }
  }

  moveElementUp(index: number, event: MouseEvent) {
    event.stopPropagation();
    if (index > 0) {
      this.fb.reorderElements(index, index - 1);
    }
  }

  moveElementDown(index: number, event: MouseEvent) {
    event.stopPropagation();
    const form = this.fb.formDef;
    if (index < form.elements.length - 1) {
      this.fb.reorderElements(index, index + 1);
    }
  }

  toggleJson() {
    this.showJson = !this.showJson;
    if (this.showJson) {
      this.jsonText = this.fb.exportToJson();
    }
  }

  onExportJson() {
    this.jsonText = this.fb.exportToJson();
  }

  onLoadJson() {
    // Use the variable 'form_json_data' if supplied, otherwise use the textarea value
    const value = this.jsonText;
    this.fb.loadFromJson(value);
  }
}
