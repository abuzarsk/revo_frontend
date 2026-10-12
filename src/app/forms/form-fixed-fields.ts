import { FormElement, OptionsElement } from './form-element.model';

export const FIXED_FORM_FIELD_IDS = {
  FORM_NAME: 'fixed_form_name',
  DIVIDER: 'fixed_divider',
  ORDER_ID: 'fixed_order_id',
  ORDER_AMOUNT: 'fixed_order_amount',
  REVIEWER_NAME: 'fixed_reviewer_name',
  DEAL_TYPE: 'fixed_deal_type',
} as const;

const baseStyles = {
  fontSize: 14,
  color: '#111827',
  textAlign: 'left' as const,
};

export function isFixedFieldId(id: string): boolean {
  return Object.values(FIXED_FORM_FIELD_IDS).includes(
    id as (typeof FIXED_FORM_FIELD_IDS)[keyof typeof FIXED_FORM_FIELD_IDS]
  );
}

export function isFixedFormElement(el: FormElement): boolean {
  return !!el.fixed || isFixedFieldId(el.id);
}

function normalizeLabel(label: string | undefined): string {
  return (label || '').trim().toLowerCase();
}

function labelIncludes(label: string | undefined, needle: string): boolean {
  return normalizeLabel(label).includes(needle.toLowerCase());
}

function isOrderAmountLabel(label: string | undefined): boolean {
  const normalized = normalizeLabel(label).replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
  return normalized.includes('order amt') || normalized.includes('order amount');
}

export function createDefaultFixedElements(): FormElement[] {
  return [
    {
      id: FIXED_FORM_FIELD_IDS.FORM_NAME,
      type: 'heading',
      label: 'Form Name',
      required: false,
      fixed: true,
      helperText: '',
      styles: {
        fontSize: 24,
        color: '#111827',
        textAlign: 'left',
      },
      validation: {},
      logic: {},
    },
    {
      id: FIXED_FORM_FIELD_IDS.DIVIDER,
      type: 'divider',
      label: '',
      required: false,
      fixed: true,
      helperText: '',
      styles: { ...baseStyles },
      validation: {},
      logic: {},
    },
    {
      id: FIXED_FORM_FIELD_IDS.ORDER_ID,
      type: 'text',
      label: 'Order Id',
      placeholder: 'Enter order id',
      required: true,
      fixed: true,
      helperText: '',
      styles: { ...baseStyles },
      validation: {},
      logic: {},
    },
    {
      id: FIXED_FORM_FIELD_IDS.ORDER_AMOUNT,
      type: 'number',
      label: 'Order amount',
      placeholder: 'Enter order amount',
      required: true,
      fixed: true,
      helperText: '',
      styles: { ...baseStyles },
      validation: {},
      logic: {},
    },
    {
      id: FIXED_FORM_FIELD_IDS.REVIEWER_NAME,
      type: 'text',
      label: 'Reviewer Name',
      placeholder: 'Enter reviewer name',
      required: true,
      fixed: true,
      helperText: '',
      styles: { ...baseStyles },
      validation: {},
      logic: {},
    },
    {
      id: FIXED_FORM_FIELD_IDS.DEAL_TYPE,
      type: 'dropdown',
      label: 'Deal Type',
      placeholder: 'Select deal type',
      required: true,
      fixed: true,
      helperText: '',
      styles: { ...baseStyles },
      validation: {},
      logic: {},
      options: ['Cashback', 'Review', 'Other'],
    } as OptionsElement,
  ];
}

function findLegacyMatch(
  elements: FormElement[],
  def: FormElement,
  usedIds: Set<string>
): FormElement | undefined {
  const available = elements.filter((el) => !usedIds.has(el.id));

  const byId = available.find((el) => el.id === def.id);
  if (byId) {
    return byId;
  }

  if (def.type === 'heading') {
    return available.find(
      (el) => el.type === 'heading' && labelIncludes(el.label, 'form name')
    );
  }

  if (def.type === 'divider') {
    return available.find(
      (el) => el.type === 'divider' && (el.fixed || isFixedFieldId(el.id))
    );
  }

  if (def.id === FIXED_FORM_FIELD_IDS.ORDER_ID) {
    return available.find(
      (el) =>
        (el.type === 'text' || el.type === 'number') &&
        labelIncludes(el.label, 'order id')
    );
  }

  if (def.id === FIXED_FORM_FIELD_IDS.ORDER_AMOUNT) {
    return available.find(
      (el) =>
        (el.type === 'number' || el.type === 'text') &&
        isOrderAmountLabel(el.label)
    );
  }

  if (def.id === FIXED_FORM_FIELD_IDS.REVIEWER_NAME) {
    return available.find(
      (el) => el.type === 'text' && labelIncludes(el.label, 'reviewer name')
    );
  }

  if (def.id === FIXED_FORM_FIELD_IDS.DEAL_TYPE) {
    return available.find(
      (el) =>
        (el.type === 'dropdown' || el.type === 'radio' || el.type === 'text') &&
        labelIncludes(el.label, 'deal type')
    );
  }

  return available.find((el) => normalizeLabel(el.label) === normalizeLabel(def.label));
}

/**
 * Ensure product forms include the mandatory fixed fields.
 * Extra custom fields are kept; email fields are removed.
 */
export function ensureFixedFormElements(
  elements: FormElement[],
  useFixedFields: boolean
): FormElement[] {
  if (!useFixedFields) {
    return elements.filter((el) => el.type !== 'email');
  }

  const source = elements.filter((el) => el.type !== 'email');
  const defaults = createDefaultFixedElements();
  const usedIds = new Set<string>();

  const mergedFixed = defaults.map((def) => {
    const existing = findLegacyMatch(source, def, usedIds);
    if (!existing) {
      return def;
    }

    usedIds.add(existing.id);

    return {
      ...def,
      ...existing,
      id: def.id,
      type: def.type,
      label: def.label,
      required: def.required,
      fixed: true,
      placeholder: def.placeholder ?? existing.placeholder,
      options:
        def.type === 'dropdown'
          ? (def as OptionsElement).options
          : undefined,
    } as FormElement;
  });

  const rest = source.filter(
    (el) =>
      !usedIds.has(el.id) &&
      !isFixedFormElement(el) &&
      el.type !== 'heading' &&
      el.type !== 'divider'
  );

  return [...mergedFixed, ...rest];
}
