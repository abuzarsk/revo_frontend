import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LoginComponent } from '../lscomponent/login/login.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, LoginComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  protected readonly year = new Date().getFullYear();
}
