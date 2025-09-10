import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomepageService } from '../../controllers/homepage.service';
import {
  HomepageConfig,
  FunctionalityItem,
} from '../../models/homepage.interface';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.css',
})
export class HomepageComponent implements OnInit {
  homepageConfig: HomepageConfig | null = null;

  constructor(private homepageService: HomepageService) {}

  ngOnInit(): void {
    this.loadHomepageConfig();
  }

  private loadHomepageConfig(): void {
    this.homepageService.getHomepageConfig().subscribe({
      next: (config) => {
        this.homepageConfig = config;
      },
      error: (error) => {
        console.error(
          'Error al cargar la configuración de la homepage:',
          error
        );
      },
    });
  }

  onFunctionalityClick(functionality: FunctionalityItem): void {
    this.homepageService.navigateToFunctionality(functionality);
  }
}
