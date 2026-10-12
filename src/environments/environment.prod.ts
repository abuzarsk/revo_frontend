export const environment = {
  production: true,
  /**
   * Base URL for all API calls made from the Angular application in production.
   * Update this to match the host where your live backend runs.
   */
  apiBaseUrl: 'https://revo.pinnaci.com/apis/public/',//'https://api.revo.app',
  imageBaseUrl: 'https://revo.pinnaci.com/apis/public/uploads/',
  appUrl: 'https://revo.pinnaci.com',

  googleClientId: '',
  googleSecret: '',

  /**
   * Centralized list of REST endpoints that the UI can reference.
   * Keep paths relative so they can be composed with apiBaseUrl.
   * Mirrored with the development environment.
   */
  apis: {
    signup: 'auth/signup',
    login: 'auth/login',
    changeRole: 'auth/change-role',
    googleLogin: 'auth/google-login',
    checkEmail: 'auth/check-email',
    auth_product_form: 'auth/product-form',
    user: 'user',
    allCompanies: 'admin/allcompanies',
    companyrequests: 'admin/companyrequests',
    mediators: 'admin/mediators',
    users: 'admin/users',
    verifycompany: '/admin/companies/verify',
    pausecompany: '/admin/companies/pause',
    cancelcompany: '/admin/companies/cancel',
    rejectcompany: '/admin/companies/reject',
    resumecompany: '/admin/companies/resume',
    brands: 'brands',
    revoconnects:'revo-connects',
    search: 'search',
    formSubmissions: 'form-submissions',
    dashboard: 'dashboard',
    company: 'company',
    mediator: 'mediator',
    my_products: 'my_products',
    company_products: 'company_products',
    products: 'products',
    form: 'form',
    submission: 'submission',
    module: 'module',
    moduleAccess: 'module-access',
    api: 'api-config',
    companyUser: 'company-user',
    moduleAccessModules: 'module-access/modules',
    apisLinkModuleApis: 'access/module',
    mediatorCompany: 'mediator-company',
    mediatorUser: 'mediator-user',  
    promotedProduct: 'promote-product',
    bankUpi: 'user/bank',
    orderHistory: 'user/order-history',
    getBrandsList: 'getBrandsList'
  },
} as const;
