import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormElementType } from './form-element.model';
import { FormBuilderService } from './form-builder.service';

interface PaletteItem {
  type: FormElementType;
  label: string;
  icon?: string;
}

@Component({
  selector: 'app-form-elements-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="panel">
      <div class="panel-header">Form Elements</div>
      <div class="palette">
        <div
          class="palette-item"
          *ngFor="let item of palette"
          (click)="addElement(item.type)"
        >
          <div class="icon">{{ item.icon }}</div>
          <div class="label">{{ item.label }}</div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .panel {
        height: 100%;
        display: flex;
        flex-direction: column;
        background: #f8fafc;
        border-right: 1px solid #e2e8f0;
      }
      .panel-header {
        padding: 12px 16px;
        font-weight: 600;
        border-bottom: 1px solid #e2e8f0;
      }
      .palette {
        padding: 8px;
        overflow-y: auto;
      }
      .palette-item {
        display: flex;
        align-items: center;
        padding: 8px 10px;
        margin-bottom: 6px;
        border-radius: 6px;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        cursor: pointer;
        font-size: 13px;
        transition: box-shadow 0.15s, background 0.1s, transform 0.1s;
      }
      .palette-item:hover {
        box-shadow: 0 1px 4px rgba(15, 23, 42, 0.12);
        background: #f9fafb;
      }
      .icon {
        width: 20px;
        margin-right: 8px;
        text-align: center;
        font-size: 16px;
      }
      .label {
        flex: 1;
      }
    `,
  ],
})
export class FormElementsPanelComponent {
  private fb = inject(FormBuilderService);

  palette: PaletteItem[] = [
    { type: 'text', label: 'Text Input', icon: 'T' },
    { type: 'number', label: 'Number', icon: '#' },
    { type: 'textarea', label: 'Textarea', icon: '☰' },
    { type: 'dropdown', label: 'Dropdown', icon: '▾' },
    { type: 'radio', label: 'Radio Buttons', icon: '◉' },
    { type: 'checkbox', label: 'Checkboxes', icon: '☑' },
    { type: 'date', label: 'Date Picker', icon: '📅' },
    { type: 'image_upload', label: 'Image Upload', icon: '🖼' },
    // { type: 'file', label: 'File Upload', icon: '📎' },
    // { type: 'image', label: 'Image', icon: '🖼' },
    // { type: 'button', label: 'Submit Button', icon: '▶' },
  ];

  addElement(type: FormElementType) {
    this.fb.addElement(type);
  }
}


