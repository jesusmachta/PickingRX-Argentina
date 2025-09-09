import { Component } from '@angular/core';
import { LocalPickingRxService } from '../../services/local-picking-rx.service';
import { LocalAuthService } from '../../services/local-auth.service';
import { PickingRX } from '../../models/picking-rx.interface';

@Component({
  selector: 'app-picking-rx-demo',
  template: `
    <div class="container mx-auto p-4">
      <h1 class="text-2xl font-bold mb-6">Local Picking RX Demo</h1>

      <!-- Demo Controls -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-lg font-semibold mb-4">Demo Controls</h2>
        <div class="flex flex-wrap gap-2 mb-4">
          <button
            (click)="switchToUserWithStore()"
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Usuario con Tienda
          </button>
          <button
            (click)="switchToUserWithoutStore()"
            class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
            Usuario sin Tienda
          </button>
          <button
            (click)="addSampleOrders()"
            class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
            Agregar Pedidos de Prueba
          </button>
          <button
            (click)="clearOrders()"
            class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
            Limpiar Pedidos
          </button>
        </div>
      </div>

      <!-- Main Component -->
      <app-local-picking-rx
        [showHeader]="true"
        [showNotifications]="true"
        [customTitle]="'Sistema de Picking Local'">
      </app-local-picking-rx>
    </div>
  `,
  standalone: false
})
export class DemoComponent {
  constructor(
    private pickingService: LocalPickingRxService,
    private authService: LocalAuthService
  ) {}

  switchToUserWithStore(): void {
    this.authService.loginAsUserWithStore(1);
    console.log('Switched to user with store');
  }

  switchToUserWithoutStore(): void {
    this.authService.loginAsUserWithoutStore();
    console.log('Switched to user without store');
  }

  addSampleOrders(): void {
    const sampleOrders: PickingRX[] = [
      {
        id: 'SAMPLE-001',
        date: new Date(),
        idOrden: 'SAMPLE-001',
        itemRxString: 'Ibuprofeno 400mg x 20, Paracetamol 500mg x 15',
        itemRX: [
          {
            barcode: '111111',
            name: 'Ibuprofeno 400mg',
            quantity: '20',
            sku: 'IBU400',
            image: '',
            opportunityReason: 'Producto con oportunidad de venta adicional',
            opportunity: true
          },
          {
            barcode: '222222',
            name: 'Paracetamol 500mg',
            quantity: '15',
            sku: 'PAR500',
            image: '',
            opportunityReason: '',
            opportunity: false
          }
        ],
        state: 0,
        storeId: 1
      },
      {
        id: 'SAMPLE-002',
        date: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
        idOrden: 'SAMPLE-002',
        itemRxString: 'Amoxicilina 500mg x 12',
        itemRX: [
          {
            barcode: '333333',
            name: 'Amoxicilina 500mg',
            quantity: '12',
            sku: 'AMX500',
            image: '',
            opportunityReason: '',
            opportunity: false
          }
        ],
        state: 0,
        storeId: 1
      }
    ];

    sampleOrders.forEach(order => {
      this.pickingService.addOrder(order);
    });

    console.log('Added sample orders');
  }

  clearOrders(): void {
    this.pickingService.clearOrders();
    console.log('Cleared all orders');
  }
}
