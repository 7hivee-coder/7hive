import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  protected readonly theme = inject(ThemeService);

  get isDarkTheme(): boolean {
    return this.theme.isDarkTheme();
  }

  ngOnInit(): void {
    this.theme.init();
  }

  toggleTheme(): void {
    this.theme.toggle();
  }
}
