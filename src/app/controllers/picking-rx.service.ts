import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ProcessedDeliveryNote,
  DeliveryNoteStatus,
  StatusConfig,
  PickingRxConfig,
  DeliveryNoteFilters,
  DeliveryItem,
  DeliveryNoteStatusText,
} from '../models/picking-rx.interface';
import { CORPORATE_COLORS } from '../shared/constants/colors';

@Injectable({
  providedIn: 'root',
})
export class PickingRxService {
  private deliveryNotesSubject = new BehaviorSubject<ProcessedDeliveryNote[]>(
    []
  );
  public deliveryNotes$ = this.deliveryNotesSubject.asObservable();

  constructor() {
    this.initializeMockData();
  }

  /**
   * Obtiene la configuración de la vista de Picking RX
   */
  getPickingRxConfig(): Observable<PickingRxConfig> {
    return this.deliveryNotes$.pipe(
      map((notes) => {
        const statusList = this.getStatusConfigs(notes);
        const totalOrders = notes.length;

        const config: PickingRxConfig = {
          title: 'Picking RX',
          subtitle: 'Gestión de notas de entrega y pedidos de domicilio',
          statusList,
          totalOrders,
        };

        return config;
      })
    );
  }

  /**
   * Obtiene las notas de entrega filtradas por estado
   */
  getDeliveryNotesByStatus(
    status: DeliveryNoteStatus
  ): Observable<ProcessedDeliveryNote[]> {
    return this.deliveryNotes$.pipe(
      map((notes) => notes.filter((note) => note.status === status))
    );
  }

  /**
   * Obtiene todas las notas de entrega con filtros opcionales
   */
  getDeliveryNotes(
    filters?: DeliveryNoteFilters
  ): Observable<ProcessedDeliveryNote[]> {
    return this.deliveryNotes$.pipe(
      map((notes) => {
        if (!filters) return notes;

        return notes.filter((note) => {
          if (filters.status && note.status !== filters.status) return false;
          if (filters.priority && note.priority !== filters.priority)
            return false;
          if (filters.searchTerm) {
            const searchLower = filters.searchTerm.toLowerCase();
            return (
              note.orderNumber.toLowerCase().includes(searchLower) ||
              (note.clientName &&
                note.clientName.toLowerCase().includes(searchLower)) ||
              (note.address && note.address.toLowerCase().includes(searchLower))
            );
          }
          return true;
        });
      })
    );
  }

  /**
   * Actualiza el estado de una nota de entrega
   */
  updateDeliveryNoteStatus(
    noteId: string,
    newStatus: DeliveryNoteStatus
  ): Observable<boolean> {
    const currentNotes = this.deliveryNotesSubject.value;
    const noteIndex = currentNotes.findIndex((note) => note.id === noteId);

    if (noteIndex !== -1) {
      const updatedNotes = [...currentNotes];
      updatedNotes[noteIndex] = {
        ...updatedNotes[noteIndex],
        status: newStatus,
        updatedAt: new Date(),
      };
      this.deliveryNotesSubject.next(updatedNotes);
      return of(true);
    }

    return of(false);
  }

  /**
   * Obtiene una nota de entrega específica por ID
   */
  getDeliveryNoteById(
    noteId: string
  ): Observable<ProcessedDeliveryNote | null> {
    return this.deliveryNotes$.pipe(
      map((notes) => notes.find((note) => note.id === noteId) || null)
    );
  }

  /**
   * Obtiene las configuraciones de estado con contadores
   */
  private getStatusConfigs(notes: ProcessedDeliveryNote[]): StatusConfig[] {
    const statusConfigs: StatusConfig[] = [
      {
        status: DeliveryNoteStatus.POR_PREPARAR,
        title: 'Por Preparar',
        description: 'Pedidos pendientes de preparación',
        color: CORPORATE_COLORS.YELLOW,
        icon: 'clock',
        count: notes.filter((n) => n.status === DeliveryNoteStatus.POR_PREPARAR)
          .length,
      },
      {
        status: DeliveryNoteStatus.PREPARANDO,
        title: 'Preparando',
        description: 'Pedidos en proceso de preparación',
        color: CORPORATE_COLORS.SECONDARY_BLUE,
        icon: 'package',
        count: notes.filter((n) => n.status === DeliveryNoteStatus.PREPARANDO)
          .length,
      },
      {
        status: DeliveryNoteStatus.LISTO,
        title: 'Listo',
        description: 'Pedidos listos para entrega',
        color: CORPORATE_COLORS.TEAL,
        icon: 'check-circle',
        count: notes.filter((n) => n.status === DeliveryNoteStatus.LISTO)
          .length,
      },
      {
        status: DeliveryNoteStatus.FALTAN_PRODUCTOS,
        title: 'Faltan Productos',
        description: 'Pedidos con productos faltantes',
        color: CORPORATE_COLORS.PURPLE,
        icon: 'alert-triangle',
        count: notes.filter(
          (n) => n.status === DeliveryNoteStatus.FALTAN_PRODUCTOS
        ).length,
      },
    ];

    return statusConfigs;
  }

  /**
   * Inicializa datos de prueba
   */
  private initializeMockData(): void {
    const mockNotes: ProcessedDeliveryNote[] = [
      {
        id: '65199871',
        orderNumber: '65199871',
        status: DeliveryNoteStatus.POR_PREPARAR,
        items: [
          {
            quantity_asked: 1,
            quantity_scanned: 0,
            sku: '00436',
            barcode: 114800436,
            description: 'Amoxicilina + Ácido Clavulánico 600mg/42.9mg/5ml',
            image: 'https://via.placeholder.com/150x150?text=Amoxicilina',
            reporte: '',
          },
          {
            quantity_asked: 1,
            quantity_scanned: 0,
            sku: '00198',
            barcode: 114800198,
            description: 'Diclofenaco Potásico 9mg/5ml',
            image: 'https://via.placeholder.com/150x150?text=Diclofenaco',
            reporte: '',
          },
        ],
        totalItems: 2,
        scannedItems: 0,
        progressPercentage: 0,
        clientName: 'Juan Pérez',
        address: 'Av. Principal 123, Caracas',
        priority: 'high',
        createdAt: new Date('2024-09-10T15:30:00'),
        updatedAt: new Date('2024-09-10T15:30:00'),
        estimatedDeliveryTime: new Date('2024-09-10T18:00:00'),
      },
      {
        id: '65199872',
        orderNumber: '65199872',
        status: DeliveryNoteStatus.PREPARANDO,
        items: [
          {
            quantity_asked: 1,
            quantity_scanned: 1,
            sku: '00436',
            barcode: 114800436,
            description: 'Amoxicilina + Ácido Clavulánico 600mg/42.9mg/5ml',
            image: 'https://via.placeholder.com/150x150?text=Amoxicilina',
            reporte: '',
          },
          {
            quantity_asked: 1,
            quantity_scanned: 0,
            sku: '70494',
            barcode: 115770494,
            description: 'Dolcan Pediátrico Megalabs Suspensión Oral x 120 ml',
            image: 'https://via.placeholder.com/150x150?text=Dolcan',
            reporte: '',
          },
        ],
        totalItems: 2,
        scannedItems: 1,
        progressPercentage: 50,
        clientName: 'María González',
        address: 'Calle 2 #45-67, Valencia',
        priority: 'medium',
        createdAt: new Date('2024-09-10T14:15:00'),
        updatedAt: new Date('2024-09-10T16:00:00'),
        estimatedDeliveryTime: new Date('2024-09-10T17:30:00'),
      },
      {
        id: '65199873',
        orderNumber: '65199873',
        status: DeliveryNoteStatus.LISTO,
        items: [
          {
            quantity_asked: 1,
            quantity_scanned: 1,
            sku: '00436',
            barcode: 114800436,
            description: 'Amoxicilina + Ácido Clavulánico 600mg/42.9mg/5ml',
            image: 'https://via.placeholder.com/150x150?text=Amoxicilina',
            reporte: '',
          },
        ],
        totalItems: 1,
        scannedItems: 1,
        progressPercentage: 100,
        clientName: 'Carlos Rodríguez',
        address: 'Urbanización Los Pinos, Casa 15',
        priority: 'low',
        createdAt: new Date('2024-09-10T13:45:00'),
        updatedAt: new Date('2024-09-10T16:30:00'),
        estimatedDeliveryTime: new Date('2024-09-10T17:00:00'),
      },
      {
        id: '65199874',
        orderNumber: '65199874',
        status: DeliveryNoteStatus.FALTAN_PRODUCTOS,
        items: [
          {
            quantity_asked: 1,
            quantity_scanned: 0,
            sku: '00436',
            barcode: 114800436,
            description: 'Amoxicilina + Ácido Clavulánico 600mg/42.9mg/5ml',
            image: 'https://via.placeholder.com/150x150?text=Amoxicilina',
            reporte: '',
          },
          {
            quantity_asked: 1,
            quantity_scanned: 0,
            sku: '70494',
            barcode: 115770494,
            description: 'Dolcan Pediátrico Megalabs Suspensión Oral x 120 ml',
            image: 'https://via.placeholder.com/150x150?text=Dolcan',
            reporte: 'missing: Producto no disponible en inventario',
          },
        ],
        totalItems: 2,
        scannedItems: 0,
        progressPercentage: 0,
        clientName: 'Ana Martínez',
        address: 'Centro Comercial Plaza, Local 8',
        priority: 'high',
        createdAt: new Date('2024-09-10T12:30:00'),
        updatedAt: new Date('2024-09-10T15:45:00'),
        estimatedDeliveryTime: new Date('2024-09-10T19:00:00'),
      },
    ];

    this.deliveryNotesSubject.next(mockNotes);
  }
}
