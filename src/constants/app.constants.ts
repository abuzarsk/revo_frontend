/**
 * Application-wide constants
 * Centralized location for all constants used throughout the application
 */

/**
 * LocalStorage Keys
 */
export const STORAGE_KEYS = {
  TOKEN_OBJ: 'token_obj',
  CURRENT_ROLE: 'current_role',

  MODULE_ACCESS_MODULES: 'module_access_modules',
  APIS_LINK_MODULE_APIS: 'apis_link_module_apis',
  MEDIATOR_COMPANY: 'mediator_company',
  SELECTED_COMPANY_ID: 'selected_company_id',
} as const;

/**
 * Route Paths
 */
export const ROUTES = {
  HOME: '/home',
  LOGIN: '/login',
  SIGNUP: '/signup',
  MEDIATORS: 'mediators',
  GOOGLE_LOGIN: '/google-login',
  DASHBOARD: '',
  COMPANIES: 'companies',
  USERCOMPANIES: 'usercompanies',
  USERS: 'users',
  BRANDS: 'brands',
  PRODUCTS: 'products',
  AFFILIATE: 'affiliate',
  PAYMENT_PENDING: 'payment-pending',
  INCOME: 'income',
  PAYMENT_COMPLETED: 'payment-completed',
  API_MANAGEMENT: 'api-management',
  ANALYTICS_REPORTS: 'analytics-reports',
  ACCESS_MANAGEMENT: 'access-management',
  BANK_UPI: 'bank-upi',
  ORDER_HISTORY: 'order-history',
  MY_SUBMISSIONS: 'my-submissions',
  NOTIFICATIONS: 'notifications',
  MESSAGES: 'messages',
  ANNOUNCEMENTS: 'announcements',
  PAYOUTS: 'payouts',
  PROFILE: 'profile',
  SECURITY: 'security',
  HELP: 'help',
  SETTINGS: 'settings',
  COMPANY_PROFILE: 'company-profile',
  SUBMISSIONS: 'submissions',
  REFUNDS: 'refunds',
  CAMPAIGNS: 'campaigns',
  ANALYTICS: 'analytics',
  COMPANY_REQUESTS: 'company-requests',
  MY_TASKS: 'my-tasks',
  PERFORMANCE: 'performance',
  PARTNER_SUBMISSIONS: 'partner-submissions',
  PARTNER_CAMPAIGNS: 'partner-campaigns',
  PARTNER_ANALYTICS: 'partner-analytics',
} as const;

/**
 * Menu Item Keys (for sidebar navigation)
 */
export const MENU_KEYS = {
  DASHBOARD: 'Dashboard',
  USERS: 'users',
  BRANDS_AND_PRODUCTS: 'BrandsAndProducts',
  BRANDS: 'brands',
  COMPANIES: 'companies',
  MY_PRODUCTS: 'my_products',
  PRODUCTS: 'products',
  USERCOMPANIES: 'usercompanies',
  AFFILIATE: 'Affiliate',
  PAYMENT_PENDING: 'PaymentPending',
  INCOME: 'Income',
  PAYMENT_COMPLETED: 'PaymentCompleted',
  API_MANAGEMENT: 'ApiManagement',
  ANALYTICS_REPORTS: 'AnalyticsReports',
  ACCESS_MANAGEMENT: 'AccessManagement',
  MEDIATORS: 'mediators',
  SUBMISSIONS: 'submissions',
  MODULES: 'modules',
  API_ACCESS: 'api_access',
  COMPANY_PRODUCTS: 'company_products',
  BANK_UPI: 'bank_upi',
  ORDER_HISTORY: 'order_history',
  MY_SUBMISSIONS: 'my_submissions',
  NOTIFICATIONS: 'notifications',
  MESSAGES: 'messages',
  ANNOUNCEMENTS: 'announcements',
  PAYOUTS: 'payouts',
  PROFILE: 'profile',
  SECURITY: 'security',
  HELP: 'help',
  SETTINGS: 'settings',
  COMPANY_PROFILE: 'company_profile',
  REFUNDS: 'refunds',
  CAMPAIGNS: 'campaigns',
  ANALYTICS: 'analytics',
  COMPANY_REQUESTS: 'company_requests',
  MY_TASKS: 'my_tasks',
  PERFORMANCE: 'performance',
} as const;

/**
 * User Roles
 */
export const USER_ROLES = {
  ADMIN: 'Admin',
  COMPANY: 'Company',
  MEDIATOR: 'Mediator',
  USER: 'User',

} as const;

/**
 * Entity Types (ordered list)
 */
export const ENTITY_TYPES = {
  ADMIN: 'admin',
  COMPANY: 'company',
  MEDIATOR: 'mediator',
  USER: 'user',
} as const;

/**
 * Entity Type IDs (for ordering/reference)
 */
export const ENTITY_TYPE_IDS = {
  ADMIN: 1,
  COMPANY: 2,
  MEDIATOR: 3,
  USER: 4,
} as const;

/**
 * Validation Patterns
 */
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\d{10,15}$/,
} as const;

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  // Authentication
  LOGIN_REQUIRED: 'Email/Phone and Password are required.',
  LOGIN_FAILED: 'Login failed. Please check your credentials.',
  LOGIN_INVALID_INPUT: 'Input is neither valid email nor valid phone number.',
  
  // Signup
  SIGNUP_ROLE_REQUIRED: 'Please select your role!',
  SIGNUP_USER_REQUIRED: 'Name, Mobile and Email are required for user role.',
  SIGNUP_COMPANY_REQUIRED: 'Name, Mobile, Group Link, Slots, and Company Size are required for company role.',
  SIGNUP_PASSWORD_REQUIRED: 'Password and Confirm Password are required.',
  SIGNUP_PASSWORD_MISMATCH: 'Password and Confirm Password must match.',
  
  // Generic
  GENERIC_ERROR: 'An error occurred. Please try again.',
  UNAUTHORIZED: 'You are not authorized to access this resource.',
} as const;

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  SIGNUP_SUCCESS: 'Signup successful!',
  SAVE_SUCCESS: 'Saved successfully!',
  DELETE_SUCCESS: 'Deleted successfully!',
  UPDATE_SUCCESS: 'Updated successfully!',
} as const;

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * API Response Keys
 */
export const API_RESPONSE_KEYS = {
  DATA: 'data',
  TOKEN: 'token',
  MESSAGE: 'message',
  ERROR: 'error',
  SUCCESS: 'success',
} as const;

/**
 * Brand API endpoint constants (relative paths)
 * Mirrors backend routes:
 * - /brand
 * - /brand/:id
 * - /brand/:id/update
 * - /brand/:id (DELETE)
 * - /brand/page
 */
export const BRAND_APIS = {
  CREATE: '/brand',
  GET_ID: '/brand/:id',
  UPDATE: '/brand/:id/update',
  DELETE: '/brand/:id',
  GET_ALL: '/brand',
  GET_PAGINATED: '/brand/page',
} as const;


// INSERT_YOUR_CODE
/**
 * API Method constants (for CRUD operations and retrieval)
 */
export const API_METHODS = {
  CREATE: 'CREATE',
  GET_ID: 'GET_ID',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  GET_ALL: 'GET_ALL',
  GET_PAGINATED: 'GET_PAGINATED',
} as const;

/**
 * Form Field Names
 */
export const FORM_FIELDS = {
  NAME: 'name',
  EMAIL: 'email',
  MOBILE: 'mobile',
  PHONE: 'phone',
  PASSWORD: 'password',
  CONFIRM_PASSWORD: 'confirmPassword',
  ROLE: 'role',
  GROUP_LINK: 'groupLink',
  SLOTS: 'slots',
  COMPANY_SIZE: 'companySize',
  VAL: 'val',
  EMAIL_OR_MOBILE: 'emailormobile',
} as const;

/**
 * Default Values
 */
export const DEFAULTS = {
  ACTIVE_MENU_ITEM: 'Dashboard',
  BRAND_NAME: 'Revo',
  SELECTED_PLATFORM: 'Dribbble',
  SELECTED_MONTH: 'Month',
} as const;

/**
 * Months (for charts/date displays)
 */
export const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
] as const;

/**
 * Chart Colors
 */
export const CHART_COLORS = {
  PURPLE: '#8B5CF6',
  GREEN: '#10B981',
  RED: '#EF4444',
  GRAY: '#6B7280',
} as const;

/**
 * Pagination
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const;

/**
 * Date Formats
 */
export const DATE_FORMATS = {
  SHORT_DATE: 'shortDate',
  LONG_DATE: 'longDate',
  DATE_TIME: 'short',
} as const;

export class FormStatus {
  static readonly Draft = 0;
  static readonly Published = 1;
  static readonly Unpublished = 2;
}

export class FormStatusReverse {
  static readonly 0 = 'Draft';
  static readonly 1 = 'Published';
  static readonly 2 = 'Unpublished';
}

// INSERT_YOUR_CODE
/**
 * Fetches the token object from localStorage and parses it as JSON.
 *
 * Safe for SSR: returns null on the server where localStorage is not available.
 *
 * @returns The token object if found and valid JSON, otherwise null.
 */
export function getTokenFromLocalStorage(name: string): any | null {
  // Guard for Server-Side Rendering where window/localStorage are not defined
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null;
  }

  const data = localStorage.getItem(name);
  if (!data) {
    return null;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse token from localStorage:', e);
    return null;
  }
}

export const IMAGE_FOLDERS = {
  COMPANY: 'companies',
  MEDIATORS: 'mediators',
  BRANDS: 'brands',
  PRODUCTS: 'products',
  REFUNDS: 'refunds',
  FORM_IMAGES: 'formimages',
};

/**
 * Sidebar menu for admin.
 * Only contains core navigation: Dashboard, Companies, Mediators, Users.
 */
export const ADMIN_SIDEBAR_MENU = [
  {
    key: MENU_KEYS.DASHBOARD,
    label: 'Dashboard',
    route: ROUTES.DASHBOARD,
    icon: 'dashboard',
  },
  {
    key: MENU_KEYS.COMPANIES,
    label: 'Companies',
    route: ROUTES.COMPANIES,
    icon: 'business',
  },
  {
    key: MENU_KEYS.MEDIATORS,
    label: 'Mediators',
    route: ROUTES.MEDIATORS, // Update this route if there is a dedicated mediators route
    icon: 'supervised_user_circle',
  },
  {
    key: MENU_KEYS.USERS,
    label: 'Users',
    route: ROUTES.USERS,
    icon: 'group',
  },
];


export const COMPANY_SIDEBAR_MENU = [
  {
    key: MENU_KEYS.DASHBOARD,
    label: 'Dashboard',
    route: ROUTES.DASHBOARD,
    icon: 'dashboard',
  },
  {
    key: MENU_KEYS.BRANDS,
    label: 'Brands',
    route: ROUTES.BRANDS,
    icon: 'brands',
  },
  {
    key: MENU_KEYS.PRODUCTS,
    label: 'Products',
    route: ROUTES.PRODUCTS,
    icon: 'product',
  },
  {
    key: MENU_KEYS.SUBMISSIONS,
    label: 'Submissions',
    route: ROUTES.SUBMISSIONS,
    icon: 'submissions',
  },
  {
    key: MENU_KEYS.REFUNDS,
    label: 'Refunds',
    route: ROUTES.REFUNDS,
    icon: 'refunds',
  },
  {
    key: MENU_KEYS.MEDIATORS,
    label: 'Mediators',
    route: ROUTES.MEDIATORS,
    icon: 'supervised_user_circle',
  },
  {
    key: MENU_KEYS.CAMPAIGNS,
    label: 'Campaigns',
    route: ROUTES.CAMPAIGNS,
    icon: 'campaigns',
  },
  {
    key: MENU_KEYS.ANALYTICS,
    label: 'Analytics',
    route: ROUTES.ANALYTICS,
    icon: 'analytics',
  },
  {
    key: MENU_KEYS.MESSAGES,
    label: 'Messages',
    route: ROUTES.MESSAGES,
    icon: 'messages',
    section: 'Workspace',
  },
  {
    key: MENU_KEYS.NOTIFICATIONS,
    label: 'Notifications',
    route: ROUTES.NOTIFICATIONS,
    icon: 'notifications',
    section: 'Workspace',
  },
  {
    key: MENU_KEYS.PAYOUTS,
    label: 'Payouts',
    route: ROUTES.PAYOUTS,
    icon: 'payouts',
    section: 'Account',
  },
  {
    key: MENU_KEYS.COMPANY_PROFILE,
    label: 'Company Profile',
    route: ROUTES.COMPANY_PROFILE,
    icon: 'business',
    section: 'Account',
  },
  {
    key: MENU_KEYS.SECURITY,
    label: 'Security',
    route: ROUTES.SECURITY,
    icon: 'security',
    section: 'Account',
  },
  {
    key: MENU_KEYS.SETTINGS,
    label: 'Settings',
    route: ROUTES.SETTINGS,
    icon: 'settings',
    section: 'Account',
  },
];


// INSERT_YOUR_CODE
export const MEDIATOR_SIDEBAR_MENU = [
  {
    key: MENU_KEYS.DASHBOARD,
    label: 'Dashboard',
    route: ROUTES.DASHBOARD,
    icon: 'dashboard',
  },
  {
    key: MENU_KEYS.COMPANIES,
    label: 'Companies',
    route: ROUTES.COMPANIES,
    icon: 'business',
  },
  {
    key: MENU_KEYS.COMPANY_REQUESTS,
    label: 'Company Requests',
    route: ROUTES.COMPANY_REQUESTS,
    icon: 'requests',
  },
  {
    key: MENU_KEYS.PRODUCTS,
    label: 'Products',
    route: ROUTES.PRODUCTS,
    icon: 'product',
  },
  {
    key: MENU_KEYS.SUBMISSIONS,
    label: 'Submissions',
    route: ROUTES.PARTNER_SUBMISSIONS,
    icon: 'submissions',
  },
  {
    key: MENU_KEYS.MY_TASKS,
    label: 'My Tasks',
    route: ROUTES.MY_TASKS,
    icon: 'tasks',
  },
  {
    key: MENU_KEYS.CAMPAIGNS,
    label: 'Campaigns',
    route: ROUTES.PARTNER_CAMPAIGNS,
    icon: 'campaigns',
  },
  {
    key: MENU_KEYS.ANALYTICS,
    label: 'Analytics',
    route: ROUTES.PARTNER_ANALYTICS,
    icon: 'analytics',
  },
  {
    key: MENU_KEYS.PERFORMANCE,
    label: 'Performance',
    route: ROUTES.PERFORMANCE,
    icon: 'performance',
  },
  {
    key: MENU_KEYS.MESSAGES,
    label: 'Messages',
    route: ROUTES.MESSAGES,
    icon: 'messages',
    section: 'Workspace',
  },
  {
    key: MENU_KEYS.NOTIFICATIONS,
    label: 'Notifications',
    route: ROUTES.NOTIFICATIONS,
    icon: 'notifications',
    section: 'Workspace',
  },
  {
    key: MENU_KEYS.BANK_UPI,
    label: 'Bank & UPI',
    route: ROUTES.BANK_UPI,
    icon: 'bank',
    section: 'Account',
  },
  {
    key: MENU_KEYS.PROFILE,
    label: 'Profile',
    route: ROUTES.PROFILE,
    icon: 'profile',
    section: 'Account',
  },
  {
    key: MENU_KEYS.SECURITY,
    label: 'Security',
    route: ROUTES.SECURITY,
    icon: 'security',
    section: 'Account',
  },
  {
    key: MENU_KEYS.SETTINGS,
    label: 'Settings',
    route: ROUTES.SETTINGS,
    icon: 'settings',
    section: 'Account',
  },
];

export const USER_SIDEBAR_MENU = [
  {
    key: MENU_KEYS.DASHBOARD,
    label: 'Dashboard',
    route: ROUTES.DASHBOARD,
    icon: 'dashboard',
    section: 'Main',
  },
  {
    key: MENU_KEYS.USERCOMPANIES,
    label: 'Companies',
    route: ROUTES.USERCOMPANIES,
    icon: 'companies',
    section: 'Main',
  },
  {
    key: MENU_KEYS.PRODUCTS,
    label: 'Products',
    route: ROUTES.PRODUCTS,
    icon: 'product',
    section: 'Main',
  },
  {
    key: MENU_KEYS.MY_SUBMISSIONS,
    label: 'My Submissions',
    route: ROUTES.MY_SUBMISSIONS,
    icon: 'submissions',
    section: 'Main',
  },
  {
    key: MENU_KEYS.ORDER_HISTORY,
    label: 'Order History',
    route: ROUTES.ORDER_HISTORY,
    icon: 'orders',
    section: 'Main',
  },
  {
    key: MENU_KEYS.NOTIFICATIONS,
    label: 'Notifications',
    route: ROUTES.NOTIFICATIONS,
    icon: 'notifications',
    section: 'Community',
  },
  {
    key: MENU_KEYS.MESSAGES,
    label: 'Messages',
    route: ROUTES.MESSAGES,
    icon: 'messages',
    section: 'Community',
  },
  {
    key: MENU_KEYS.ANNOUNCEMENTS,
    label: 'Announcements',
    route: ROUTES.ANNOUNCEMENTS,
    icon: 'announcements',
    section: 'Community',
  },
  {
    key: MENU_KEYS.PAYOUTS,
    label: 'Payouts',
    route: ROUTES.PAYOUTS,
    icon: 'payouts',
    section: 'Account',
  },
  {
    key: MENU_KEYS.BANK_UPI,
    label: 'Bank & UPI',
    route: ROUTES.BANK_UPI,
    icon: 'bank',
    section: 'Account',
  },
  {
    key: MENU_KEYS.PROFILE,
    label: 'Profile',
    route: ROUTES.PROFILE,
    icon: 'profile',
    section: 'Account',
  },
  {
    key: MENU_KEYS.SECURITY,
    label: 'Security',
    route: ROUTES.SECURITY,
    icon: 'security',
    section: 'Account',
  },
  {
    key: MENU_KEYS.HELP,
    label: 'Help & Support',
    route: ROUTES.HELP,
    icon: 'help',
    section: 'Account',
  },
  {
    key: MENU_KEYS.SETTINGS,
    label: 'Settings',
    route: ROUTES.SETTINGS,
    icon: 'settings',
    section: 'Account',
  },
];
/**
 * User/company/mediator account status.
 * 1 = Verified, 2 = Unverified, 3 = Paused, 4 = Cancelled, 5 = Rejected
 */
export const STATUS = {
  VERIFIED: 1,
  UNVERIFIED: 2,
  PAUSED: 3,
  CANCELLED: 4,
  REJECTED: 5,
};

export const FORM_TYPE_IDS = {
  FORM: 1,
  REFUND: 2,
}

export const STATUS_LABELS: Record<number, string> = {
  1: 'Verified',
  2: 'Unverified',
  3: 'Paused',
  4: 'Cancelled',
  5: 'Rejected',
};






