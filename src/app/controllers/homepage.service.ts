import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import {
  HomepageConfig,
  FunctionalityItem,
} from '../models/homepage.interface';
import { CORPORATE_COLORS } from '../shared/constants/colors';

@Injectable({
  providedIn: 'root',
})
export class HomepageService {
  constructor(private router: Router) {}

  /**
   * Obtiene la configuración de la homepage
   */
  getHomepageConfig(): Observable<HomepageConfig> {
    const config: HomepageConfig = {
      title: 'Remitos',
      subtitle: '',
      functionalities: [
        {
          id: 'picking-rx',
          title: 'Picking RX',
          description:
            'Gestión de pedidos de domicilios pendientes y preparados',
          icon: 'truck',
          route: '/picking-rx',
          isEnabled: true,
          color: CORPORATE_COLORS.PRIMARY,
        },
      ],
    };

    return of(config);
  }

  /**
   * Navega a una funcionalidad específica
   */
  navigateToFunctionality(functionality: FunctionalityItem): void {
    if (functionality.isEnabled) {
      this.router.navigate([functionality.route]);
    } else {
      console.warn(
        `La funcionalidad '${functionality.title}' está deshabilitada`
      );
    }
  }
}
