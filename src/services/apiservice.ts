import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
//import { environment } from '@env/environment';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Apiservice {
  
  constructor(private http: HttpClient) {}

  login(data: any) {
    return this.http.post(environment.apiBaseUrl+environment.apis.login, data);
  }

  signup(data: FormData | Record<string, unknown>) {
    return this.http.post(environment.apiBaseUrl + environment.apis.signup, data);
  }

  checkEmail(data: { email: string }) {
    return this.http.post(environment.apiBaseUrl + environment.apis.checkEmail, data);
  }

  googleLogin(token:any){
    return this.http.get(environment.apiBaseUrl+environment.apis.googleLogin,{headers:{'Authorization':'Bearer '+token}});
  }

  getAllCompanies(token:any,page:number = 1){
    return this.http.get(environment.apiBaseUrl+environment.apis.allCompanies+"?page="+page,{headers:{'Authorization':'Bearer '+token}});
  }

  getCompanyRequests(token:any,page:number = 1){
    return this.http.get(environment.apiBaseUrl+environment.apis.companyrequests+"?page="+page,{headers:{'Authorization':'Bearer '+token}});
  }

  getMediators(token:any,page:number = 1){
    return this.http.get(environment.apiBaseUrl+environment.apis.mediators+"?page="+page,{headers:{'Authorization':'Bearer '+token}});
  }

  getUsers(token:any,page:number = 1){
    return this.http.get(environment.apiBaseUrl+environment.apis.users+"?page="+page,{headers:{'Authorization':'Bearer '+token}});
  }

  verifyCompany(token:any,data:any){
    return this.http.post(environment.apiBaseUrl+environment.apis.verifycompany,data,{headers:{'Authorization':'Bearer '+token}});
  }

  pauseCompany(token:any,data:any){
    return this.http.post(environment.apiBaseUrl+environment.apis.pausecompany,data,{headers:{'Authorization':'Bearer '+token}});
  }

  cancelCompany(token:any,data:any){
    return this.http.post(environment.apiBaseUrl+environment.apis.cancelcompany,data,{headers:{'Authorization':'Bearer '+token}});
  }
  rejectCompany(token:any,data:any){
    return this.http.post(environment.apiBaseUrl+environment.apis.rejectcompany,data,{headers:{'Authorization':'Bearer '+token}});
  }

  resumeCompany(token:any,data:any){
    return this.http.post(environment.apiBaseUrl+environment.apis.resumecompany,data,{headers:{'Authorization':'Bearer '+token}});
  }

  brandCreate(token:any,data:any){
    return this.http.post(environment.apiBaseUrl+environment.apis.brands,data,{headers:{'Authorization':'Bearer '+token}});
  }

  getBrands(token:any, page: number = 1, perPage?: number){
    const query = perPage && perPage > 0
      ? `?page=${page}&per_page=${perPage}`
      : `?page=${page}`;
    return this.http.get(environment.apiBaseUrl+environment.apis.brands+query,{headers:{'Authorization':'Bearer '+token}});
  }

  brandUpdate(token:any,id:any,data:any){
    return this.http.post(environment.apiBaseUrl+environment.apis.brands+"/"+id+"/update",data,{headers:{'Authorization':'Bearer '+token}});
  }

  createProduct(token:any,data:any){
    return this.http.post(environment.apiBaseUrl+environment.apis.products,data,{headers:{'Authorization':'Bearer '+token}});
  }

  getProductsByCompany(
    token: any,
    page: number = 1,
    filters?: {
      brand_id?: string | number;
      has_submission?: string;
      has_refund?: string;
    },
    perPage?: number,
  ) {
    const params = new URLSearchParams();
    params.set('page', String(page));
    if (perPage != null && perPage > 0) {
      params.set('per_page', String(perPage));
    }
    if (filters?.brand_id != null && filters.brand_id !== '') {
      params.set('brand_id', String(filters.brand_id));
    }
    if (filters?.has_submission != null && filters.has_submission !== '') {
      params.set('has_submission', filters.has_submission);
    }
    if (filters?.has_refund != null && filters.has_refund !== '') {
      params.set('has_refund', filters.has_refund);
    }
    return this.http.get(
      environment.apiBaseUrl + environment.apis.products + '/company?' + params.toString(),
      { headers: { Authorization: 'Bearer ' + token } },
    );
  }

  getCompanyProductById(token:any, id:any){
    return this.http.get(environment.apiBaseUrl+environment.apis.products+"/"+id,{headers:{'Authorization':'Bearer '+token}});
  }

  updateProduct(token:any,id:any,data:any){
    return this.http.post(environment.apiBaseUrl+environment.apis.products+"/"+id+"/update",data,{headers:{'Authorization':'Bearer '+token}});
  }

  getCompanySearch(token:any,alias:any){
    return this.http.get(environment.apiBaseUrl+environment.apis.company+'/search/'+alias,{headers:{'Authorization':'Bearer '+token}});
  }
  
  revoConnect(token:any,data:any){
    return this.http.post(environment.apiBaseUrl+environment.apis.revoconnects,data,{headers:{'Authorization':'Bearer '+token}});
  }

  getMediatorConnectedCompanies(token:any){
    return this.http.get(environment.apiBaseUrl+environment.apis.mediator+"/connected-companies",{headers:{'Authorization':'Bearer '+token}});
  }

  getMediatorRequestedCompanies(token:any){
    return this.http.get(environment.apiBaseUrl+environment.apis.mediator+"/requested-companies",{headers:{'Authorization':'Bearer '+token}});
  }

  getMediatorRejectedCompanies(token:any){
    return this.http.get(environment.apiBaseUrl+environment.apis.mediator+"/rejected-companies",{headers:{'Authorization':'Bearer '+token}});
  }


  getMediatorProductsById(token:any, id:any){
    return this.http.get(environment.apiBaseUrl+environment.apis.mediator+"/products/"+id,{headers:{'Authorization':'Bearer '+token}});
  }
  /**
   * Fetch the list of modules the current user has access to.
   * Requires a valid JWT token returned from the login endpoint.
   */
  getModuleAccessModules(token: any,company_id:any) {
    return this.http.get(
      environment.apiBaseUrl + environment.apis.moduleAccessModules+"/"+company_id,
      {
        headers: {
          'Authorization': 'Bearer ' + token,
        },
      }
    );
  }

  getUserAcessModules(token: any,user_id:any) {
    return this.http.get(
      environment.apiBaseUrl + environment.apis.moduleAccessModules+"/"+user_id,
      {
        headers: {
          'Authorization': 'Bearer ' + token,
        },
      }
    );
  }


  /**
   * Fetch list of APIs linked to modules (used for API Management etc.).
   */
  getApisLinkModuleApis(token: any) {
    return this.http.get(
      environment.apiBaseUrl + environment.apis.apisLinkModuleApis+"/my_brands",
      {
        headers: {
          'Authorization': 'Bearer ' + token,
        },
      }
    );
  }

  /**
   * Fetch mediator company information.
   */
  getMediatorCompany(token: any) {
    return this.http.get(
      environment.apiBaseUrl + environment.apis.mediatorCompany,
      {
        headers: {
          'Authorization': 'Bearer ' + token,
        },
      }
    );
  }

  addMediatorCompany(token:any,data:any){
    return this.http.post(environment.apiBaseUrl+environment.apis.mediatorCompany,data,{headers:{'Authorization':'Bearer '+token}});
  }

  getCompanyFromSlug(slug:any){
    return this.http.get(environment.apiBaseUrl+environment.apis.company+"/"+slug);
  }

  mediatorSignup(data: any) {
    return this.http.post(environment.apiBaseUrl+environment.apis.mediator, data);
  }

  getCompanyMediator(id:any,token:any){
    return this.http.get(environment.apiBaseUrl+environment.apis.company+"/"+environment.apis.mediator+"/"+id,{headers:{'Authorization':'Bearer '+token}});
  }

  // verifyMediator(id:any,token:any,data:any){
  //   //return this.http.post(environment.apiBaseUrl+environment.apis.mediator+"/"+id+"/verify",{headers:{'Authorization':'Bearer '+token}},data);
  //   return this.http.put(environment.apiBaseUrl+environment.apis.mediator+"/"+id+"/verify",data,{headers:{'Authorization':'Bearer '+token}});
  // }

  getMediatorSearchByUsername(token:any,username:any){
    return this.http.get(environment.apiBaseUrl+environment.apis.mediator+"/username/"+username,{headers:{'Authorization':'Bearer '+token}});
  }


  // allbrands(token:any){
  //   return this.http.get(environment.apiBaseUrl+environment.apis.brand,{headers:{'Authorization':'Bearer '+token}});
  // }

  // brandList(token:any,page:any=1){
  //   return this.http.get(environment.apiBaseUrl+environment.apis.brand,{headers:{'Authorization':'Bearer '+token}});
  // }

  // brandListPaginated(token:any,page:any=1){
  //   return this.http.get(environment.apiBaseUrl+environment.apis.brand+"/page?page="+page,{headers:{'Authorization':'Bearer '+token}});
  // }

  // brandCreate(data:any,token:any){
  //   return this.http.post(environment.apiBaseUrl+environment.apis.brand,data,{headers:{'Authorization':'Bearer '+token}});
  // }
  
  // brandUpdate(data:any,token:any,id:any){
  //   return this.http.post(environment.apiBaseUrl+environment.apis.brand+"/"+id+"/update",data,{headers:{'Authorization':'Bearer '+token}});
  // }

  // brandDelete(token:any,id:any){
  //   return this.http.delete(environment.apiBaseUrl+environment.apis.brand+"/"+id,{headers:{'Authorization':'Bearer '+token}});
  // }

  myproductList(token:any){
    return this.http.get(environment.apiBaseUrl+environment.apis.my_products,{headers:{'Authorization':'Bearer '+token}});
  }

  productForUsersList(token:any){
    return this.http.get(environment.apiBaseUrl+environment.apis.products,{headers:{'Authorization':'Bearer '+token}});
  }

  productListByBrand(token:any,brandId:any,page:any=1){
    return this.http.get(
      environment.apiBaseUrl+environment.apis.my_products+"/brand/"+brandId+"?page="+page,
      {headers:{'Authorization':'Bearer '+token}}
    );
  }

  productListPaginated(token:any,page:any=1){
    return this.http.get(environment.apiBaseUrl+environment.apis.my_products+"/page?page="+page,{headers:{'Authorization':'Bearer '+token}});
  }

  productCreate(data:any,token:any){
    return this.http.post(environment.apiBaseUrl+environment.apis.my_products,data,{headers:{'Authorization':'Bearer '+token}});
  }
  
  productUpdate(data:any,token:any,id:any){
    return this.http.post(environment.apiBaseUrl+environment.apis.my_products+"/"+id+"/update",data,{headers:{'Authorization':'Bearer '+token}});
  }

  productDelete(token:any,id:any){
    return this.http.delete(environment.apiBaseUrl+environment.apis.my_products+"/"+id,{headers:{'Authorization':'Bearer '+token}});
  }

  // productGetById(token:any,id:any){
  //   return this.http.get(environment.apiBaseUrl+environment.apis.my_products+"/"+id,{headers:{'Authorization':'Bearer '+token}});
  // }

  // form(token:any,product_id:any){
  //   return this.http.get(environment.apiBaseUrl+environment.apis.form+"/product/"+product_id,{headers:{'Authorization':'Bearer '+token}});
  // }

  // formBuilderCreate(data:any,token:any){
  //   return this.http.post(environment.apiBaseUrl+environment.apis.form,data,{headers:{'Authorization':'Bearer '+token}});
  // }

  

  // formBuilderUpdate(data:any,token:any,id:any){
  //   return this.http.post(environment.apiBaseUrl+environment.apis.form+"/"+id+"/update",data,{headers:{'Authorization':'Bearer '+token}});
  // }

  formBuilderDelete(token:any,id:any){
    return this.http.delete(environment.apiBaseUrl+environment.apis.form+"/"+id,{headers:{'Authorization':'Bearer '+token}});
  }

  // formSubmission(token:any,formId:any,data:any){
  //   return this.http.post(
  //     environment.apiBaseUrl+environment.apis.form+"/"+formId+"/submission",
  //     data,
  //     {
  //       headers:{
  //         'Authorization':'Bearer '+token
  //       },
  //     }
  //   );
  // }

  // getFormSubmissions(token:any,formId:any){
  //   return this.http.get(
  //     environment.apiBaseUrl+environment.apis.submission+"/form/"+formId,
  //     {
  //       headers:{
  //         'Authorization':'Bearer '+token
  //       },
  //     }
  //   );
  // }


  //Mediator User
  getMediatorUser(token:any){
    return this.http.get(environment.apiBaseUrl+environment.apis.mediatorUser,{headers:{'Authorization':'Bearer '+token}});
  }

  addMediatorUser(mediator_id:any,token:any){
    return this.http.post(environment.apiBaseUrl+environment.apis.mediatorUser+"/"+mediator_id,{headers:{'Authorization':'Bearer '+token}});
  }

  getUsersByMediatorId(token:any){
    return this.http.get(environment.apiBaseUrl+environment.apis.mediatorUser+"/users",{headers:{'Authorization':'Bearer '+token}});
  }

  verifyUser(token:any,id:any,data:any){
    return this.http.post(environment.apiBaseUrl+environment.apis.user+"/"+id,data,{headers:{'Authorization':'Bearer '+token}});
  }



  //Company
  getCompanyByAlias(token:any,alias:any){
    return this.http.get(environment.apiBaseUrl+environment.apis.company+"/alias/"+alias,{headers:{'Authorization':'Bearer '+token}});
  }

  // getAllCompanies(token:any, page:number = 1){
  //   return this.http.get(environment.apiBaseUrl+environment.apis.company+"?page="+page,{headers:{'Authorization':'Bearer '+token}});
  // }

  getVerifiedCompanies(token:any,page:number = 1){
    return this.http.get(environment.apiBaseUrl+environment.apis.company+"/verified?page="+page,{headers:{'Authorization':'Bearer '+token}});
  }

  getUnverifiedCompanies(token:any,page:number = 1){
    return this.http.get(environment.apiBaseUrl+environment.apis.company+"/unverified?page="+page,{headers:{'Authorization':'Bearer '+token}});
  }

  updateCompany(token:any,id:any,data:any){
    return this.http.post(environment.apiBaseUrl+environment.apis.company+"/"+id+"/update",data,{headers:{'Authorization':'Bearer '+token}});
  }

  getAllModules(token:any){
    return this.http.get(environment.apiBaseUrl+environment.apis.module,{headers:{'Authorization':'Bearer '+token}});
  }

  getModuleAccess(token:any,role:any=null){
    if(role)
      return this.http.get(environment.apiBaseUrl+environment.apis.moduleAccess+"/"+role,{headers:{'Authorization':'Bearer '+token}});
    else
      return this.http.get(environment.apiBaseUrl+environment.apis.moduleAccess,{headers:{'Authorization':'Bearer '+token}});
  }

  addModuleAccess(token:any,data:any){
    return this.http.post(environment.apiBaseUrl+environment.apis.moduleAccess,data,{headers:{'Authorization':'Bearer '+token}});
  }

  removeModuleAccess(token:any,data:any){
    return this.http.post(environment.apiBaseUrl+environment.apis.moduleAccess+"/remove-access",data,{headers:{'Authorization':'Bearer '+token}});
  }

  apis(token:any){
    return this.http.get(environment.apiBaseUrl+environment.apis.api.replace('/',''),{headers:{'Authorization':'Bearer '+token}});
  }

  companyUser(token:any, page:number = 1){
    return this.http.get(
      environment.apiBaseUrl+environment.apis.companyUser+"/companies?page="+page+"&limit=2",
      {headers:{'Authorization':'Bearer '+token}}
    );
  }

  searchCompanyByAlias(token:any, alias:any){
    return this.http.get(
      environment.apiBaseUrl+environment.apis.company+"/search/alias/"+alias,
      {headers:{'Authorization':'Bearer '+token}}
    );
  }

  addUserToCompany(token:any,data:any){
    return this.http.post(environment.apiBaseUrl+environment.apis.companyUser,data,{headers:{'Authorization':'Bearer '+token}});
  }

  // promoteordemoteProduct(token:any,data:any){
  //   return this.http.post(environment.apiBaseUrl+environment.apis.promotedProduct,data,{headers:{'Authorization':'Bearer '+token}});
  // }

  // updateProductPromoteDemote(token:any,data:any){
  //   return this.http.post(environment.apiBaseUrl+environment.apis.promotedProduct+"/update",data,{headers:{'Authorization':'Bearer '+token}});
  // }

  getCompanyProductsForMediator(token:any,page:number = 1){
    return this.http.get(environment.apiBaseUrl+environment.apis.company_products,{headers:{'Authorization':'Bearer '+token}});
  }

  getCompaniesConnectedMediator(token:any){
    return this.http.get(environment.apiBaseUrl+environment.apis.company+"/connected-mediators",{headers:{'Authorization':'Bearer '+token}});
  }

  getCompaniesRequestedMediator(token:any){
    return this.http.get(environment.apiBaseUrl+environment.apis.company+"/requested-mediators",{headers:{'Authorization':'Bearer '+token}});
  }

  getCompaniesRejectedMediator(token:any){
    return this.http.get(environment.apiBaseUrl+environment.apis.company+"/rejected-mediators",{headers:{'Authorization':'Bearer '+token}});
  }

  verifyMediator(token:any,data:any){
    return this.http.post(environment.apiBaseUrl+environment.apis.company+"/verify-mediator/",data,{headers:{'Authorization':'Bearer '+token}});
  }

  searchbyalias(token:any,alias:any){
    return this.http.get(environment.apiBaseUrl+environment.apis.search+"/"+alias,{headers:{'Authorization':'Bearer '+token}});
  }

  getUserConnections(token:any){
    return this.http.get(environment.apiBaseUrl+environment.apis.user+"/connections",{headers:{'Authorization':'Bearer '+token}});
  }

  updateUserConnections(token:any,data:any){
    return this.http.post(environment.apiBaseUrl+environment.apis.revoconnects+"/update",data,{headers:{'Authorization':'Bearer '+token}});
  }

  revoForm(token:any,form_id:any){
    return this.http.get(environment.apiBaseUrl+environment.apis.form+"/"+form_id,{headers:{'Authorization':'Bearer '+token}});
  }

  revoFormUpdate(token:any,data:any){
    return this.http.post(environment.apiBaseUrl+environment.apis.form+"/update",data,{headers:{'Authorization':'Bearer '+token}});
  }
   
  promotedemoteProduct(token:any,data:any){
    return this.http.post(environment.apiBaseUrl+environment.apis.products+"/promotedemote",data,{headers:{'Authorization':'Bearer '+token}});
  }

  getMediatorProducts(
    token: any,
    page: number = 1,
    filters?: {
      brand_id?: string | number;
      has_submission?: string;
      has_refund?: string;
    },
  ) {
    const params = new URLSearchParams();
    params.set('page', String(page));
    if (filters?.brand_id != null && filters.brand_id !== '') {
      params.set('brand_id', String(filters.brand_id));
    }
    if (filters?.has_submission != null && filters.has_submission !== '') {
      params.set('has_submission', filters.has_submission);
    }
    if (filters?.has_refund != null && filters.has_refund !== '') {
      params.set('has_refund', filters.has_refund);
    }
    return this.http.get(
      environment.apiBaseUrl + environment.apis.mediator + '/products?' + params.toString(),
      { headers: { Authorization: 'Bearer ' + token } },
    );
  }
  
  promotedemoteMediatorProduct(token:any,data:any){
    return this.http.post(environment.apiBaseUrl+environment.apis.products+"/mediator/promote",data,{headers:{'Authorization':'Bearer '+token}});
  }

  getUserProducts(
    token: any,
    page: number = 1,
    filters?: {
      brand_id?: string | number;
      has_submission?: string;
      has_refund?: string;
    },
    perPage?: number,
  ) {
    const params = new URLSearchParams();
    params.set('page', String(page));
    if (perPage != null && perPage > 0) {
      params.set('per_page', String(perPage));
    }
    if (filters?.brand_id != null && filters.brand_id !== '') {
      params.set('brand_id', String(filters.brand_id));
    }
    if (filters?.has_submission != null && filters.has_submission !== '') {
      params.set('has_submission', filters.has_submission);
    }
    if (filters?.has_refund != null && filters.has_refund !== '') {
      params.set('has_refund', filters.has_refund);
    }
    return this.http.get(
      environment.apiBaseUrl + environment.apis.user + '/products?' + params.toString(),
      { headers: { Authorization: 'Bearer ' + token } },
    );
  }

  getProductForm(token:any,product_id:any){
    return this.http.get(environment.apiBaseUrl+environment.apis.user+"/form/promote/"+product_id,{headers:{'Authorization':'Bearer '+token}});
  }

  getProductFromRefundForm(token:any,product_id:any){
    return this.http.get(environment.apiBaseUrl+environment.apis.user+"/form/refund/"+product_id,{headers:{'Authorization':'Bearer '+token}});
  }
  
  getProductRefundForm(token:any,product_id:any){
    return this.http.get(environment.apiBaseUrl+environment.apis.user+"/form/refund/"+product_id,{headers:{'Authorization':'Bearer '+token}});
  }
  getProductById(token:any,product_id:any){
    return this.http.get(environment.apiBaseUrl+environment.apis.user+"/products/promote/"+product_id,{headers:{'Authorization':'Bearer '+token}});
  }

  formSubmission(token:any,data:any){
    return this.http.post(environment.apiBaseUrl+environment.apis.user+"/form-submissions",data,{headers:{'Authorization':'Bearer '+token}});
  }

  refundFormSubmission(token:any,data:any){
    return this.http.post(environment.apiBaseUrl+environment.apis.user+"/refundForm-submissions",data,{headers:{'Authorization':'Bearer '+token}});
  }

  /** Company role only. Backend rejects every other role. */
  /** Company role only. Expected price is product form price minus less. */
  getCompanyRefunds(
    token: string,
    page: number = 1,
    perPage: number = 100,
    filters?: { status?: string; q?: string },
  ) {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('per_page', String(perPage));
    if (filters?.status && filters.status !== 'all') {
      params.set('status', filters.status);
    }
    if (filters?.q) {
      params.set('q', filters.q);
    }
    return this.http.get(
      environment.apiBaseUrl + 'company/refunds?' + params.toString(),
      { headers: { Authorization: 'Bearer ' + token } },
    );
  }

  getCompanySubmissions(
    token: string,
    page: number = 1,
    perPage: number = 10,
    filters?: { product_id?: string; status?: string; q?: string },
  ) {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('per_page', String(perPage));
    if (filters?.product_id && filters.product_id !== 'all') {
      params.set('product_id', filters.product_id);
    }
    if (filters?.status && filters.status !== 'all') {
      params.set('status', filters.status);
    }
    if (filters?.q) {
      params.set('q', filters.q);
    }
    return this.http.get(
      environment.apiBaseUrl + 'company/submissions?' + params.toString(),
      { headers: { Authorization: 'Bearer ' + token } },
    );
  }

  getFormSubmissions(token:any,promote_id:any, page: number = 1, perPage?: number){
    const query = perPage && perPage > 0
      ? `?page=${page}&per_page=${perPage}`
      : `?page=${page}`;
    return this.http.get(environment.apiBaseUrl+environment.apis.company+'/'+environment.apis.formSubmissions+"/"+promote_id+query,{headers:{'Authorization':'Bearer '+token}});
  }

  getUserFromSubmission(token:any,promote_id:any, page: number = 1, perPage?: number){
    const query = perPage && perPage > 0
      ? `?page=${page}&per_page=${perPage}`
      : `?page=${page}`;
    return this.http.get(environment.apiBaseUrl+environment.apis.user+"/form-submissions/"+promote_id+query,{headers:{'Authorization':'Bearer '+token}});
  }

  getUserFromRefundSubmission(token:any,promote_id:any, page: number = 1, perPage?: number){
    const query = perPage && perPage > 0
      ? `?page=${page}&per_page=${perPage}`
      : `?page=${page}`;
    return this.http.get(environment.apiBaseUrl+environment.apis.user+"/refundForm-submissions/"+promote_id+query,{headers:{'Authorization':'Bearer '+token}});
  }

  getCompanyAndMediatorFromRefundSubmission(token:any,promote_id:any, page: number = 1, perPage?: number){
    const query = perPage && perPage > 0
      ? `?page=${page}&per_page=${perPage}`
      : `?page=${page}`;
    return this.http.get(environment.apiBaseUrl+environment.apis.company+"/refundForm-submissions/"+promote_id+query,{headers:{'Authorization':'Bearer '+token}});
  }

  getMediatorFromSubmission(token:any,promote_id:any, page: number = 1, perPage?: number){
    const query = perPage && perPage > 0
      ? `?page=${page}&per_page=${perPage}`
      : `?page=${page}`;
    return this.http.get(environment.apiBaseUrl+environment.apis.mediator+"/form-submissions/"+promote_id+query,{headers:{'Authorization':'Bearer '+token}});
  }

  acceptRefundSubmission(token:any,data:any){
    return this.http.post(environment.apiBaseUrl+environment.apis.company+"/refundForm-submissions/update",data,{headers:{'Authorization':'Bearer '+token}});
  }

  rejectRefundSubmission(token:any,data:any){
    return this.http.post(environment.apiBaseUrl+environment.apis.company+"/refundForm-submissions/update",data,{headers:{'Authorization':'Bearer '+token}});
  }

  acceptRefundSubmissionMediator(token:any,data:any){
    return this.http.post(environment.apiBaseUrl+environment.apis.mediator+"/refundForm-submissions/update",data,{headers:{'Authorization':'Bearer '+token}});
  }

  rejectRefundSubmissionMediator(token:any,data:any){
    return this.http.post(environment.apiBaseUrl+environment.apis.mediator+"/refundForm-submissions/update",data,{headers:{'Authorization':'Bearer '+token}});
  }

  changeUserDefaultRole(token:any,data:any){
    return this.http.post(environment.apiBaseUrl+environment.apis.changeRole,data,{headers:{'Authorization':'Bearer '+token}});
  }

  getPromoteIdFromProduct(token:any,product_id:any){
    return this.http.get(environment.apiBaseUrl+environment.apis.products+"/promote/"+product_id,{headers:{'Authorization':'Bearer '+token}});
  }

  getDashboardData(token:any){
    return this.http.get(environment.apiBaseUrl+environment.apis.dashboard,{headers:{'Authorization':'Bearer '+token}});
  }


  getBankUpi(token: any) {
    return this.http.get(
      environment.apiBaseUrl + environment.apis.bankUpi,
      { headers: { Authorization: 'Bearer ' + token } },
    );
  }

  saveBankUpi(token: any, data: any) {
    return this.http.post(
      environment.apiBaseUrl + environment.apis.bankUpi,
      data,
      { headers: { Authorization: 'Bearer ' + token } },
    );
  }

  updateBankUpi(token: any, data: any) {
    return this.http.post(
      environment.apiBaseUrl + environment.apis.bankUpi+"/update",
      data,
      { headers: { Authorization: 'Bearer ' + token } },
    );
  }


  postAuthProductForm(data: any, token?: string | null) {
    const options: { headers?: { Authorization: string } } = {};
    if (token) {
      options.headers = { Authorization: 'Bearer ' + token };
    }
    return this.http.post(
      environment.apiBaseUrl + environment.apis.auth_product_form,
      data,
      options,
    );
  }

  getUserOrderHistory(
    token: any,
    page: number = 1,
    perPage?: number,
    filters?: {
      search?: string;
      status?: string;
      platform?: string;
      sort?: string;
      dateFrom?: string;
      dateTo?: string;
    },
  ) {
    const params = new URLSearchParams();
    params.set('page', String(page));
    if (perPage && perPage > 0) {
      params.set('per_page', String(perPage));
    }
    if (filters?.search) {
      params.set('search', filters.search);
    }
    if (filters?.status) {
      params.set('status', filters.status);
    }
    if (filters?.platform) {
      params.set('platform', filters.platform);
    }
    if (filters?.sort) {
      params.set('sort', filters.sort);
    }
    if (filters?.dateFrom) {
      params.set('date_from', filters.dateFrom);
    }
    if (filters?.dateTo) {
      params.set('date_to', filters.dateTo);
    }

    return this.http.get(
      `${environment.apiBaseUrl}${environment.apis.orderHistory}?${params.toString()}`,
      { headers: { Authorization: 'Bearer ' + token } },
    );
  }

  getBrandsList(token: any) {
    return this.http.get(
      environment.apiBaseUrl + environment.apis.getBrandsList,
      { headers: { Authorization: 'Bearer ' + token } },
    );
  }

  getProductSubmissionExcel(token: any, id: any) {
    return this.http.get(
      environment.apiBaseUrl + environment.apis.products + '/' + id + '/excel',
      {
        headers: { Authorization: 'Bearer ' + token },
        responseType: 'blob',
        observe: 'response',
      },
    );
  }

  downloadFileAsBlob(url: string, token?: string | null) {
    const options: {
      responseType: 'blob';
      headers?: { Authorization: string };
    } = { responseType: 'blob' };
    if (token) {
      options.headers = { Authorization: 'Bearer ' + token };
    }
    return this.http.get(url, options);
  }

  uploadFormImage(token: any, data: any) {
    return this.http.post(
      environment.apiBaseUrl + environment.apis.user+"/formimageupload",
      data,
      { headers: { Authorization: 'Bearer ' + token } },
    );
  }

  // googleLogin(token:any){
  //   return this.http.get(environment.apiBaseUrl+environment.apis.googleLogin,{headers:{'Authorization':'Bearer '+token}});
  // }
}
