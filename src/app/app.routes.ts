import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { SignupComponent } from './lscomponent/signup/signup.component';
import { Dashboard } from './dashboard/dashboard';
import { DashboardWelcome } from './dashboard/dashboard-welcome';
import { Companies } from './dashboard/pages/companies/companies';
import { Mediators } from './dashboard/pages/mediators/mediators';
import { Users } from './dashboard/pages/users/users';
import { Brands } from './dashboard/pages/brands/brands';
import { Products } from './dashboard/pages/products/products';
import { ProductDetails } from './dashboard/pages/product-details/product-details';
import { Submission } from './dashboard/pages/submission/submission';
import { guestGuard } from './guards/guest.guard';
import { authGuard } from './guards/auth.guard';
import { Usercompanies } from './dashboard/pages/usercompanies/usercompanies';
import { BankUpi } from './dashboard/pages/bank-upi/bank-upi';
import { OrderHistory } from './dashboard/pages/order-history/order-history';
import { CompanySubmissions } from './dashboard/pages/company-submissions/company-submissions';
import { CompanyRefunds } from './dashboard/pages/company-refunds/company-refunds';
import { CompanyCampaigns } from './dashboard/pages/company-campaigns/company-campaigns';
import { CompanyAnalytics } from './dashboard/pages/company-analytics/company-analytics';
import { BuilderPageComponent } from './forms/builder-page.component';
import { PreviewPageComponent } from './forms/preview-page.component';
import { FormLoadingPageComponent } from './dashboard/pages/form-loading/form-loading';
import { MemberSubmissions } from './dashboard/pages/member/member-submissions';
import { MemberInbox } from './dashboard/pages/member/member-inbox';
import { MemberPayouts } from './dashboard/pages/member/member-payouts';
import { MemberProfile } from './dashboard/pages/member/member-profile';
import { MemberSecurity } from './dashboard/pages/member/member-security';
import { MemberSupport } from './dashboard/pages/member/member-support';
import { MemberSettings } from './dashboard/pages/member/member-settings';
import { CompanyProfile } from './dashboard/pages/company-profile/company-profile';
import { MediatorSubmissions } from './dashboard/pages/mediator-submissions/mediator-submissions';
import { MediatorTasks } from './dashboard/pages/mediator-tasks/mediator-tasks';
import { MediatorAnalytics } from './dashboard/pages/mediator-analytics/mediator-analytics';
import { MediatorPerformance } from './dashboard/pages/mediator-performance/mediator-performance';
import { MediatorCampaigns } from './dashboard/pages/mediator-campaigns/mediator-campaigns';

export const routes: Routes = [
  { path: 'home', component: HomeComponent, canActivate: [guestGuard] },
  { path: 'login', component: HomeComponent, canActivate: [guestGuard] },
  { path: 'signup/:type', component: SignupComponent, canActivate: [guestGuard] } ,
  { path: 'dashboard', redirectTo: '', pathMatch: 'full',  canActivate: [authGuard] } ,
  {
    path: '',
    component: Dashboard,
    canActivate: [authGuard],
    children: [
      { path: '', component: DashboardWelcome },
      { path: 'companies', component: Companies },
      { path: 'company-requests', component: Companies },
      { path: 'partner-submissions', component: MediatorSubmissions },
      { path: 'my-tasks', component: MediatorTasks },
      { path: 'partner-campaigns', component: MediatorCampaigns },
      { path: 'partner-analytics', component: MediatorAnalytics },
      { path: 'performance', component: MediatorPerformance },
      { path: 'mediators', component: Mediators },
      { path: 'users', component: Users },
      { path: 'brands', component: Brands },
      { path: 'products', component: Products },
      { path: 'products/:id', component: ProductDetails },
      { path: 'products/:id/promoted/:promote_id', component: ProductDetails },
      
      { path: 'usercompanies', component: Usercompanies },
      { path: 'bank-upi', component: BankUpi },
      { path: 'order-history', component: OrderHistory },
      { path: 'submissions', component: CompanySubmissions },
      { path: 'refunds', component: CompanyRefunds },
      { path: 'campaigns', component: CompanyCampaigns },
      { path: 'analytics', component: CompanyAnalytics },
      { path: 'builder/:id', component: BuilderPageComponent },
      { path: 'my-submissions', component: MemberSubmissions },
      { path: 'notifications', component: MemberInbox, data: { kind: 'notifications' } },
      { path: 'messages', component: MemberInbox, data: { kind: 'messages' } },
      { path: 'announcements', component: MemberInbox, data: { kind: 'announcements' } },
      { path: 'payouts', component: MemberPayouts },
      { path: 'profile', component: MemberProfile },
      { path: 'security', component: MemberSecurity },
      { path: 'help', component: MemberSupport },
      { path: 'settings', component: MemberSettings },
      { path: 'company-profile', component: CompanyProfile },
    ],
  },
  { path: 'preview/:id', component: PreviewPageComponent },
  { path: 'form/:id', component: FormLoadingPageComponent},
  { path: 'refundform/:id', component: FormLoadingPageComponent },
  { path: 'submission/:id', component: Submission },
  { path: 'refund/submission/:id', component: Submission },

  // { path: 'builder/:id/refund', component: BuilderPageComponent },
  // { path: 'preview/:id/refund', component: PreviewPageComponent },
  // { path: 'form/:id/refund', component: FormLoadingPageComponent },
  // { path: 'submission/:id/refund', component: Submission },
];
