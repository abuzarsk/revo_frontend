import { Component, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { FormElementsPanelComponent } from './form-elements-panel.component';
import { FormCanvasComponent } from './form-canvas.component';
import { PropertiesPanelComponent } from './properties-panel.component';
import { Apiservice } from '../../services/apiservice';
import { FormBuilderService } from './form-builder.service';
import { Observable } from 'rxjs';
import { FormDefinition } from './form-element.model';
import { FormStatusReverse } from '../../constants/app.constants';

@Component({
  selector: 'app-builder-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormElementsPanelComponent,
    FormCanvasComponent,
    PropertiesPanelComponent,
  ],
  templateUrl: './builder-page.html',
  styleUrl: './builder-page.css',
})
export class BuilderPageComponent {
  private platformId = inject(PLATFORM_ID);

  token_obj:any="";
  product_id:any="";
  product_id_backup:any="";
  encoded_product_id:any="";
  form_json_data:any=null;
  formDef$!: Observable<FormDefinition>;
  formStatus: string = '';
  formId: string | null = null;
  isPublishing: boolean = false;
  isUnpublishing: boolean = false;
  form_id:any=null;
  formType:any=null;

  constructor(
    private route: ActivatedRoute, 
    private ApiService: Apiservice,
    private cd: ChangeDetectorRef,
    private formBuilderService: FormBuilderService,
    private router: Router
  ) {
    this.formDef$ = this.formBuilderService.formDef$;
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.route.params.subscribe(params => {
      //console.log(params);

     // this.formType = params['type'];
      this.form_id = params['id'];
      console.log(this.form_id);
      // const encodedBrandId = params['id'];

      this.getForm(this.form_id);

      // if (encodedBrandId) {
      //   try {
      //     // Decode the brand ID from base64
      //     this.encoded_product_id = encodedBrandId;
      //     this.product_id = atob(encodedBrandId);
      //     //console.log('Decoded product ID:', product_id);
      //     // Set the product ID in the form builder service
      //     this.formBuilderService.setProductId(this.product_id);
      //     this.getForm(this.product_id);
      //   } catch (error) {
      //     console.error('Error decoding brand ID:', error);
      //     // If decoding fails, try using the value as-is (might be unencoded)
      //   }
      // }
    });


  }

  getForm(product_id:string){
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.token_obj = JSON.parse(localStorage.getItem('token_obj') || '{}');

    //console.log('Token:', this.token_obj.token);
    //console.log('Product ID:', product_id);
    this.ApiService.revoForm(this.token_obj.token,product_id).subscribe((res:any)=>{
      console.log('API Response:', res);
      //console.log('Response Data:', res.data);
      this.product_id_backup = res.data.product_id;
      // Check if data is nested or direct
      if (res.data) {
        // Extract and store form ID from the response
        const formId = res.data.id;
        if (formId) {
          this.formId = String(formId);
          this.formBuilderService.setFormId(this.formId);
        }
        this.formType = res.data.form_type;
        this.formBuilderService.setFormType(this.formType);
        // Extract and store form status (handle both number and string)
        const status = res.data.status || res.data.form_status || 'draft';
        this.formStatus = String(status);
        
        // Extract form_json from the response
        let formJsonData: any = null;
        
        if (res.data.form_json) {
          // Parse form_json if it's a string
          if (typeof res.data.form_json === 'string') {
            try {
              formJsonData = JSON.parse(res.data.form_json);
            } catch (e) {
              console.error('Error parsing form_json string:', e);
              formJsonData = null;
            }
          } else {
            // form_json is already an object
            formJsonData = res.data.form_json;
          }
        }
        
        console.log(formJsonData);
        // If form_json exists, create a proper form definition object
        if (formJsonData) {
          // Create form definition with title and elements
          const formDefinition = {
            title: res.data.form_name || 'Untitled Form',
            elements: Array.isArray(formJsonData) ? formJsonData : (formJsonData.elements || [])
          };
          
          // Stringify the form definition to pass to form-canvas
          this.form_json_data = JSON.stringify(formDefinition);
          console.log('Form JSON extracted and loaded:', formDefinition);
        } else {
          const formDefinition = {
            title: res.data.form_name || 'Untitled Form',
            elements: [],
          };
          this.form_json_data = JSON.stringify(formDefinition);
          console.warn('No form_json found in response, initializing empty form');
        }
        this.cd.detectChanges();
        // Manually trigger change detection to ensure the input binding updates
        if (this.cd && typeof this.cd.detectChanges === 'function') {
          this.cd.detectChanges();
        }
      } else {
        console.warn('No data in response');
      }
    },(error:any)=>{
      console.error('API Error:', error);
    }
  );
  }

  getStatusDisplay(status: string): string {
   // if (!status) return 'Draft';
    // Try to get the display value from FormStatusReverse if status is 0/1/2 or string '0'/'1'/'2'
    // Otherwise, capitalize first letter of each word

    // Support both string and number status values
    let display: string | undefined;
    
    display = (FormStatusReverse as any)[status];

    if (display) {
      return display;
    }

    // Fallback: capitalize first letter of each word
    return status;
  }

  publishForm() {
    console.log('publishForm', this.formId, this.token_obj?.token);
    if (!this.formId || !this.token_obj?.token) {
      console.error('Form ID or token missing');
      return;
    }

    if (this.isPublishing) {
      return;
    }

    // Show confirmation dialog
    const confirmed = confirm('Are you sure you want to publish this form? Once published, the form will be live and accessible to users.');
    
    if (!confirmed) {
      return;
    }

    this.isPublishing = true;

    // Get current form data
    const formDef = this.formBuilderService.formDef;
    const formData = {
      form_name: formDef.title,
      form_json: JSON.stringify(formDef.elements),
      form_id: this.formId,
      status: 1 // or 'active' depending on your API
    };

    this.ApiService.revoFormUpdate(this.token_obj.token,formData).subscribe(
      (res: any) => {
        console.log('Form published successfully:', res);
        // Update local status
        this.formStatus = '1';
        this.isPublishing = false;
        
        // Trigger change detection
        if (this.cd && typeof this.cd.detectChanges === 'function') {
          this.cd.detectChanges();
        }
        
        // Show success message (you can replace with a toast notification)
        alert('Form published successfully!');
      },
      (error: any) => {
        console.error('Error publishing form:', error);
        this.isPublishing = false;
        alert('Failed to publish form. Please try again.');
      }
    );
  }

  isPublished(): boolean {
    return this.formStatus === '1' || 
           this.formStatus === 'published' || this.formStatus === 'active';
  }

  goToProductPage() {

    this.router.navigate(['/products/', this.product_id_backup]);
  }

  unpublishForm() {
    if (!this.formId || !this.token_obj?.token) {
      console.error('Form ID or token missing');
      return;
    }

    if (this.isUnpublishing) {
      return;
    }

    // Show confirmation dialog
    const confirmed = confirm('Are you sure you want to unpublish this form? Once unpublished, the form will no longer be accessible to users.');
    
    if (!confirmed) {
      return;
    }

    this.isUnpublishing = true;

    // Get current form data
    const formDef = this.formBuilderService.formDef;
    const formData = {
      form_name: formDef.title,
      form_json: JSON.stringify(formDef.elements),
      form_id: this.formId,
      status: 2 // Set status to 0 (draft/unpublished)
    };

    this.ApiService.revoFormUpdate(this.token_obj.token,formData).subscribe(
      (res: any) => {
        console.log('Form unpublished successfully:', res);
        // Update local status
        this.formStatus = '0';
        this.isUnpublishing = false;
        
        // Trigger change detection
        if (this.cd && typeof this.cd.detectChanges === 'function') {
          this.cd.detectChanges();
        }
        
        // Show success message
        alert('Form unpublished successfully!');
      },
      (error: any) => {
        console.error('Error unpublishing form:', error);
        this.isUnpublishing = false;
        alert('Failed to unpublish form. Please try again.');
      }
    );
  }
}


