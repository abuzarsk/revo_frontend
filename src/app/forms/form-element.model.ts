export type FormElementType =
  | 'text'
  | 'email'
  | 'number'
  | 'dropdown'
  | 'radio'
  | 'checkbox'
  | 'file'
  | 'date'
  | 'textarea'
  | 'image'
  | 'image_upload'
  | 'heading'
  | 'divider'
  | 'button';

export interface ElementStyles {
  fontSize?: number; // px
  color?: string; // CSS color
  textAlign?: 'left' | 'center' | 'right';
}

export interface ValidationRules {
  minLength?: number;
  maxLength?: number;
  pattern?: string; // regex string or format name
  minDate?: string; // ISO date string for date range validation
  maxDate?: string; // ISO date string for date range validation
}

export interface LogicRule {
  showWhenFieldId?: string | null;
  operator?: 'equals' | 'not_equals' | null;
  value?: string | null;
}

export interface FormElementBase {
  id: string;
  type: FormElementType;
  label?: string;
  placeholder?: string;
  required?: boolean;
  helperText?: string;
  /** Built-in fields that cannot be removed from product forms. */
  fixed?: boolean;
  styles?: ElementStyles;
  validation?: ValidationRules;
  logic?: LogicRule;
}

export interface OptionsElement extends FormElementBase {
  options?: string[];
}

export interface ButtonElement extends FormElementBase {
  buttonStyle?: 'primary' | 'secondary' | 'outline';
}

export interface ImageElement extends FormElementBase {
  src?: string;
  alt?: string;
}

export type FormElement =
  | FormElementBase
  | OptionsElement
  | ButtonElement
  | ImageElement;

export interface FormDefinition {
  title: string;
  elements: FormElement[];
}


