import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { PickingRX, PickingRXState, ItemRX } from '../models/picking-rx.interface';

@Injectable({
  providedIn: 'root'
})
export class LocalPickingRxService {
  private ordersSubject = new BehaviorSubject<PickingRX[]>([]);
  public orders$ = this.ordersSubject.asObservable();

  private mockOrders: PickingRX[] = [
    {
      id: 'ORD-001',
      city: 'Bogotá',
      country: 'Colombia',
      date: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      idOrden: 'ORD-001',
      itemRxString: 'Paracetamol 500mg x 20, Ibuprofeno 400mg x 10, Aspirina 100mg x 30',
      itemRX: [
        {
          barcode: '123456789',
          name: 'Paracetamol 500mg',
          quantity: '20',
          sku: 'PAR500',
          image: '',
          opportunityReason: '',
          opportunity: false
        },
        {
          barcode: '987654321',
          name: 'Ibuprofeno 400mg',
          quantity: '10',
          sku: 'IBU400',
          image: '',
          opportunityReason: '',
          opportunity: true
        },
        {
          barcode: '456789123',
          name: 'Aspirina 100mg',
          quantity: '30',
          sku: 'ASP100',
          image: '',
          opportunityReason: 'Producto con oportunidad de venta adicional',
          opportunity: false
        }
      ],
      state: PickingRXState.PENDIENTE,
      storeId: 1
    },
    {
      id: 'ORD-002',
      city: 'Medellín',
      country: 'Colombia',
      date: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      idOrden: 'ORD-002',
      itemRxString: 'Amoxicilina 500mg x 15, Azitromicina 250mg x 6',
      itemRX: [
        {
          barcode: '111222333',
          name: 'Amoxicilina 500mg',
          quantity: '15',
          sku: 'AMX500',
          image: '',
          opportunityReason: '',
          opportunity: false
        },
        {
          barcode: '444555666',
          name: 'Azitromicina 250mg',
          quantity: '6',
          sku: 'AZI250',
          image: '',
          opportunityReason: 'Producto con oportunidad',
          opportunity: true
        }
      ],
      state: PickingRXState.PREPARADO,
      storeId: 1,
      preparedDate: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
      preparedWithOpportunity: true
    },
    {
      id: 'ORD-003',
      city: 'Cali',
      country: 'Colombia',
      date: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
      idOrden: 'ORD-003',
      itemRxString: 'Omeprazol 20mg x 28, Ranitidina 150mg x 14',
      itemRX: [
        {
          barcode: '777888999',
          name: 'Omeprazol 20mg',
          quantity: '28',
          sku: 'OME20',
          image: '',
          opportunityReason: '',
          opportunity: false
        },
        {
          barcode: '000111222',
          name: 'Ranitidina 150mg',
          quantity: '14',
          sku: 'RAN150',
          image: '',
          opportunityReason: '',
          opportunity: false
        }
      ],
      state: PickingRXState.PREPARADO,
      storeId: 1,
      preparedDate: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
      preparedWithOpportunity: false
    }
  ];

  constructor() {
    // Initialize with mock data
    this.ordersSubject.next([...this.mockOrders]);
  }

  // Get all orders
  getAllOrders(): Observable<PickingRX[]> {
    return this.orders$;
  }

  // Get pending orders
  getPendingOrders(): Observable<PickingRX[]> {
    return this.orders$.pipe(
      map(orders => orders.filter(order => order.state === PickingRXState.PENDIENTE))
    );
  }

  // Get prepared orders
  getPreparedOrders(): Observable<PickingRX[]> {
    return this.orders$.pipe(
      map(orders => orders.filter(order => order.state === PickingRXState.PREPARADO))
    );
  }

  // Mark order as prepared
  markAsPrepared(orderId: string, withOpportunity: boolean = false): Promise<void> {
    return new Promise((resolve) => {
      const currentOrders = this.ordersSubject.value;
      const orderIndex = currentOrders.findIndex(order => order.id === orderId);

      if (orderIndex !== -1) {
        currentOrders[orderIndex] = {
          ...currentOrders[orderIndex],
          state: PickingRXState.PREPARADO,
          preparedDate: new Date(),
          preparedWithOpportunity: withOpportunity
        };

        this.ordersSubject.next([...currentOrders]);
      }

      resolve();
    });
  }

  // Mark order as pending (revert)
  markAsPending(orderId: string): Promise<void> {
    return new Promise((resolve) => {
      const currentOrders = this.ordersSubject.value;
      const orderIndex = currentOrders.findIndex(order => order.id === orderId);

      if (orderIndex !== -1) {
        currentOrders[orderIndex] = {
          ...currentOrders[orderIndex],
          state: PickingRXState.PENDIENTE,
          preparedDate: undefined,
          preparedWithOpportunity: undefined
        };

        this.ordersSubject.next([...currentOrders]);
      }

      resolve();
    });
  }

  // Add new order
  addOrder(order: PickingRX): Promise<void> {
    return new Promise((resolve) => {
      const currentOrders = this.ordersSubject.value;
      this.ordersSubject.next([...currentOrders, order]);
      resolve();
    });
  }

  // Update order
  updateOrder(orderId: string, updates: Partial<PickingRX>): Promise<void> {
    return new Promise((resolve) => {
      const currentOrders = this.ordersSubject.value;
      const orderIndex = currentOrders.findIndex(order => order.id === orderId);

      if (orderIndex !== -1) {
        currentOrders[orderIndex] = {
          ...currentOrders[orderIndex],
          ...updates
        };

        this.ordersSubject.next([...currentOrders]);
      }

      resolve();
    });
  }

  // Get order by ID
  getOrderById(orderId: string): Observable<PickingRX | null> {
    return this.orders$.pipe(
      map(orders => orders.find(order => order.id === orderId) || null)
    );
  }

  // Delete order
  deleteOrder(orderId: string): Promise<void> {
    return new Promise((resolve) => {
      const currentOrders = this.ordersSubject.value;
      const filteredOrders = currentOrders.filter(order => order.id !== orderId);
      this.ordersSubject.next(filteredOrders);
      resolve();
    });
  }

  // Set new order list (for external data management)
  setOrders(orders: PickingRX[]): void {
    this.ordersSubject.next([...orders]);
  }

  // Get current orders synchronously
  getCurrentOrders(): PickingRX[] {
    return [...this.ordersSubject.value];
  }

  // Clear all orders
  clearOrders(): void {
    this.ordersSubject.next([]);
  }
}
