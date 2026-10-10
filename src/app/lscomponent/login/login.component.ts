import { ChangeDetectorRef, Component, HostListener, inject, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Apiservice } from '../../../services/apiservice';
import { environment } from '../../../environments/environment';
import { STORAGE_KEYS } from '../../../constants';

declare var google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  loginForm: FormGroup;
  protected submitted = false;
  protected hidePassword = true;
  protected error: string | null = null;
  private platformId = inject(PLATFORM_ID);

  private googleInitialized = false;
  private lastGoogleButtonWidth = 0;

  constructor(
    private fb: FormBuilder,
    @Inject(Apiservice) private apiservice: Apiservice,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      value: ['', [Validators.required]],
      password: ['', [Validators.required]],
      rememberMe: [false],
    });
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.initGoogleSignIn();
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.waitForGoogleAndRender();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.renderGoogleButton(true);
  }

  private waitForGoogleAndRender(attempts = 0): void {
    if (typeof google !== 'undefined' && google.accounts?.id) {
      this.initGoogleSignIn();
      this.renderGoogleButton(true);
      return;
    }

    if (attempts < 30) {
      setTimeout(() => this.waitForGoogleAndRender(attempts + 1), 100);
    }
  }

  private initGoogleSignIn(): void {
    if (typeof google === 'undefined' || !google.accounts?.id) {
      console.warn('Google Identity script not loaded; skipping Google login init.');
      return;
    }

    if (this.googleInitialized) {
      return;
    }

    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: any) => {
        this.handleGoogleLogin(response);
      },
    });

    this.googleInitialized = true;
  }

  private renderGoogleButton(force = false): void {
    if (typeof google === 'undefined' || !google.accounts?.id) {
      return;
    }

    const buttonHost = document.getElementById('googleBtn');
    const width = this.getGoogleButtonWidth(buttonHost);
    if (!buttonHost || (!force && width === this.lastGoogleButtonWidth)) {
      return;
    }

    buttonHost.innerHTML = '';
    google.accounts.id.renderButton(buttonHost, {
      theme: 'outline',
      size: 'large',
      shape: 'rectangular',
      width,
      text: 'continue_with',
    });

    this.lastGoogleButtonWidth = width;
    this.cdr.detectChanges();
  }

  private getGoogleButtonWidth(buttonHost: HTMLElement | null): number {
    const containerWidth =
      buttonHost?.parentElement?.clientWidth ??
      buttonHost?.closest('.login-card')?.clientWidth ??
      320;

    return Math.max(200, Math.floor(containerWidth));
  }

  handleGoogleLogin(response: any) {
    console.log('Google Login Response:', response);
    
    this.apiservice.googleLogin(response.credential).subscribe((res: any) => {
      console.log('Google Login Response:', res);
      if(res!=null && res.data.token!=null && res.data.token!=''){
        //this.afterSuccessFullLogin(res);
        console.log('Token:', res.data.token);
        localStorage.setItem(STORAGE_KEYS.TOKEN_OBJ, JSON.stringify(res.data));
        localStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, JSON.stringify(res.data.user.default_role));
        this.router.navigate(['/dashboard']);
        //localStorage.setItem('token_obj', JSON.stringify(res.data));
      }else{
        console.log('No token found');
        //this.router.navigate(['/signup'], { queryParams });
      }
    });
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  protected onSubmit(): void {
    this.submitted = true;
    if (this.loginForm.valid) {
      console.log('Login', this.loginForm.value);
      // TODO: call auth service
      if (!this.loginForm.value.value || !this.loginForm.value.password) {
        this.error = "Email/Phone and Password are required.";
        return;
      }
  
      // INSERT_YOUR_CODE
      const value = this.loginForm.value.value || '';
      let isEmail = false;
      let isPhone = false;
  
      // Simple email regex: checks for [something]@[something].[something]
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      // A simple phone regex: digits only, 10-15 length (update as per locale)
      const phoneRegex = /^\d{10,15}$/;
  
      if (emailRegex.test(value)) {
        isEmail = true;
        console.log('Input is an email.');
      } else if (phoneRegex.test(value)) {
        isPhone = true;
        console.log('Input is a phone number.');
      } else {
        this.error = "Input is neither valid email nor valid phone number.";
        console.log('Input is neither valid email nor valid phone number.');
      }
  
      var obj:any= this.loginForm.value;
      if(isEmail==true){
        obj.emailormobile="EMAIL";
      }else{
        obj.emailormobile="MOBILE";
      }

      
      this.apiservice.login(obj).subscribe((res: any) => {
        
        console.log('Login response', res);
        if(res!=null && res.data.token!=null && res.data.token!=''){
          localStorage.setItem(STORAGE_KEYS.TOKEN_OBJ, JSON.stringify(res.data));
          localStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, JSON.stringify(res.data.user.default_role));
          this.router.navigate(['/dashboard']);
        }else{
          console.log('No token found');
          //this.router.navigate(['/signup'], { queryParams });
        }
      },(error: any) => {
        console.log('Login error', error);
      }
    );
    }
  }

  protected togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }
}
