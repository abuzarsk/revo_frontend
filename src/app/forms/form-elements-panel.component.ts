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
    <div class="palette">
      <button
        type="button"
        class="palette-item"
        *ngFor="let item of palette"
        (click)="addElement(item.type)"
      >
        {{ item.label }}
      </button>
    </div>
  `,
  styles: [
    `
      .palette {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .palette-item {
        height: 2rem;
        padding: 0 0.75rem;
        border: 1px solid oklch(0.93 0.012 270);
        border-radius: calc(1.125rem - 2px);
        background: #fff;
        box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
        color: oklch(0.25 0.035 260);
        font: inherit;
        font-size: 12px;
        font-weight: 600;
        text-transform: capitalize;
        cursor: pointer;
      }
      .palette-item:hover {
        border-color: oklch(0.55 0.23 285);
        color: oklch(0.55 0.23 285);
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


