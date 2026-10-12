export interface PaginatedListView {
  loading: boolean;
  total: number;
  currentPage: number;
  lastPage: number;
  perPage: number;
  pageNumbers: number[];
  showingFrom: number;
  showingTo: number;
  itemLabel: string;
  goToPage: (page: number) => void;
}

/** @deprecated Use PaginatedListView */
export type ProductsPaginationView = PaginatedListView & {
  position: 'top' | 'bottom';
};

export interface PaginatedPageMeta {
  items: any[];
  currentPage: number;
  lastPage: number;
  total: number;
  perPage: number;
}

/** @deprecated Use PaginatedPageMeta */
export type ProductsPageMeta = PaginatedPageMeta;

function readPaginationMeta(
  source: Record<string, unknown> | null | undefined,
  requestedPage: number,
  itemsLength: number
): Omit<PaginatedPageMeta, 'items'> {
  const pagination =
    (source?.['pagination'] as Record<string, unknown> | undefined) ??
    (source?.['meta'] as Record<string, unknown> | undefined) ??
    source;

  const hasPaginationBlock = !!(
    source?.['pagination'] ??
    source?.['meta'] ??
    pagination?.['page'] ??
    pagination?.['current_page'] ??
    pagination?.['total_pages'] ??
    pagination?.['last_page'] ??
    pagination?.['per_page']
  );

  const currentPage = Number(
    pagination?.['page'] ??
      pagination?.['current_page'] ??
      requestedPage ??
      1
  );
  const total = Number(
    pagination?.['total'] ?? (hasPaginationBlock ? 0 : itemsLength)
  );
  const perPageFromApi = Number(pagination?.['per_page'] ?? 0);
  const apiLastPage = Number(
    pagination?.['total_pages'] ?? pagination?.['last_page'] ?? 0
  );

  const perPage =
    perPageFromApi > 0
      ? perPageFromApi
      : hasPaginationBlock
        ? Math.max(itemsLength, 1)
        : Math.max(itemsLength, 1);

  const resolvedTotal =
    Number.isFinite(total) && total >= 0 ? total : itemsLength;

  let lastPage = 1;
  if (resolvedTotal > 0 && perPage > 0) {
    lastPage = Math.max(1, Math.ceil(resolvedTotal / perPage));
  } else if (apiLastPage > 0) {
    lastPage = apiLastPage;
  }

  const resolvedCurrentPage =
    Number.isFinite(currentPage) && currentPage > 0 ? currentPage : requestedPage;

  return {
    currentPage: resolvedCurrentPage,
    lastPage,
    total: resolvedTotal,
    perPage,
  };
}

export function parsePaginatedResponse(
  res: any,
  requestedPage: number
): PaginatedPageMeta {
  const payload = res?.data;

  if (Array.isArray(payload?.data)) {
    const meta = readPaginationMeta(payload, requestedPage, payload.data.length);
    return { items: payload.data, ...meta };
  }

  if (Array.isArray(payload)) {
    const meta = readPaginationMeta(res, requestedPage, payload.length);
    return { items: payload, ...meta };
  }

  return {
    items: [],
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 0,
  };
}

/** @deprecated Use parsePaginatedResponse */
export const parseProductsPageResponse = parsePaginatedResponse;

export function getPaginationRedirectPage(
  parsed: PaginatedPageMeta,
  requestedPage: number
): number | null {
  if (parsed.lastPage > 0 && requestedPage > parsed.lastPage) {
    return parsed.lastPage;
  }
  if (requestedPage < 1) {
    return 1;
  }
  return null;
}

export function buildPageNumbers(
  currentPage: number,
  lastPage: number,
  maxVisible = 10
): number[] {
  if (lastPage <= 1) {
    return [1];
  }

  if (lastPage <= maxVisible) {
    const pages: number[] = [];
    for (let i = 1; i <= lastPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = start + maxVisible - 1;

  if (end > lastPage) {
    end = lastPage;
    start = Math.max(1, end - maxVisible + 1);
  }

  const pages: number[] = [];
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
}

export function showingFrom(
  total: number,
  currentPage: number,
  perPage: number
): number {
  if (!total || !perPage) {
    return 0;
  }
  return (currentPage - 1) * perPage + 1;
}

export function showingTo(
  total: number,
  currentPage: number,
  perPage: number,
  itemsOnPage?: number
): number {
  if (!total) {
    return 0;
  }

  const from = showingFrom(total, currentPage, perPage);
  if (!from) {
    return 0;
  }

  if (itemsOnPage !== undefined && itemsOnPage >= 0) {
    return Math.min(from + itemsOnPage - 1, total);
  }

  if (!perPage) {
    return total;
  }

  return Math.min(currentPage * perPage, total);
}

export function buildPageQuery(page: number, perPage?: number): string {
  const params = new URLSearchParams();
  params.set('page', String(page));
  if (perPage != null && perPage > 0) {
    params.set('per_page', String(perPage));
  }
  return params.toString();
}
