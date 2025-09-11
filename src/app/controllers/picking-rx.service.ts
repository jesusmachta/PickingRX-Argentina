import { Injectable, inject } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  updateDoc,
  query,
  orderBy,
} from '@angular/fire/firestore';
import {
  ProcessedDeliveryNote,
  FirebaseDeliveryNote,
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
  private firestore = inject(Firestore);
  private remitosCollection = collection(this.firestore, 'Remitos');

  private deliveryNotesSubject = new BehaviorSubject<ProcessedDeliveryNote[]>(
    []
  );
  public deliveryNotes$ = this.deliveryNotesSubject.asObservable();

  constructor() {
    this.loadDeliveryNotesFromFirebase();
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
   * Actualiza el estado de una nota de entrega en Firebase
   */
  updateDeliveryNoteStatus(
    noteId: string,
    newStatus: DeliveryNoteStatus
  ): Observable<boolean> {
    const noteDocRef = doc(this.firestore, 'Remitos', noteId);

    return new Observable((observer) => {
      updateDoc(noteDocRef, {
        state: newStatus,
      })
        .then(() => {
          // Actualizar el estado local también
          const currentNotes = this.deliveryNotesSubject.value;
          const noteIndex = currentNotes.findIndex(
            (note) => note.id === noteId
          );

          if (noteIndex !== -1) {
            const updatedNotes = [...currentNotes];
            updatedNotes[noteIndex] = {
              ...updatedNotes[noteIndex],
              status: newStatus,
            };
            this.deliveryNotesSubject.next(updatedNotes);
          }

          observer.next(true);
          observer.complete();
        })
        .catch((error) => {
          console.error('Error updating delivery note status:', error);
          observer.next(false);
          observer.complete();
        });
    });
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
   * Carga las notas de entrega desde Firebase
   */
  private loadDeliveryNotesFromFirebase(): void {
    // Obtener todos los documentos sin ordenamiento específico
    // ya que los campos de fecha fueron removidos

    // Obtener datos en tiempo real
    collectionData(this.remitosCollection, { idField: 'id' })
      .pipe(
        map((firebaseNotes: any[]) => {
          console.log('Datos crudos de Firebase:', firebaseNotes);
          return firebaseNotes.map((note) =>
            this.convertFirebaseToProcessed(note)
          );
        }),
        catchError((error) => {
          console.error('Error al obtener datos de Firebase:', error);
          // En caso de error, usar datos vacíos
          return of([]);
        })
      )
      .subscribe({
        next: (processedNotes) => {
          console.log('Notas procesadas:', processedNotes);
          this.deliveryNotesSubject.next(processedNotes);
        },
        error: (error) => {
          console.error('Error en la suscripción:', error);
          this.deliveryNotesSubject.next([]);
        },
      });
  }

  /**
   * Convierte un documento de Firebase al formato procesado para la UI
   */
  private convertFirebaseToProcessed(firebaseNote: any): ProcessedDeliveryNote {
    console.log('🔄 Documento original:', firebaseNote);
    console.log('🔄 Items raw:', firebaseNote.items);
    console.log('🔄 Tipo de items:', typeof firebaseNote.items);

    // Asegurar que items sea un array
    let items: DeliveryItem[] = [];

    if (Array.isArray(firebaseNote.items)) {
      items = firebaseNote.items;
    } else if (firebaseNote.items && typeof firebaseNote.items === 'object') {
      // Si items es un objeto, convertir a array
      items = Object.values(firebaseNote.items);
    }

    console.log('🔄 Items procesados:', items);

    const scannedItems = items.reduce(
      (count, item) => count + (item.quantity_scanned || 0),
      0
    );
    const totalItems = items.reduce(
      (count, item) => count + (item.quantity_asked || 0),
      0
    );
    const progressPercentage =
      totalItems > 0 ? Math.round((scannedItems / totalItems) * 100) : 0;

    console.log(
      '📊 Calculados - Scanned:',
      scannedItems,
      'Total:',
      totalItems,
      'Progress:',
      progressPercentage
    );

    return {
      id: firebaseNote.id || firebaseNote.idnota,
      orderNumber: firebaseNote.idnota || firebaseNote.id,
      status: this.mapFirebaseStateToStatus(firebaseNote.state),
      items: items,
      totalItems: totalItems,
      scannedItems: scannedItems,
      progressPercentage: progressPercentage,
      createdAt: firebaseNote.createdAt?.toDate
        ? firebaseNote.createdAt.toDate()
        : firebaseNote.createdAt || new Date(),
      estimatedDeliveryTime: firebaseNote.estimatedDeliveryTime?.toDate?.(),
    };
  }

  /**
   * Mapea el estado numérico de Firebase al enum DeliveryNoteStatus
   */
  private mapFirebaseStateToStatus(state: number): DeliveryNoteStatus {
    switch (state) {
      case 0:
        return DeliveryNoteStatus.POR_PREPARAR;
      case 1:
        return DeliveryNoteStatus.PREPARANDO;
      case 2:
        return DeliveryNoteStatus.LISTO;
      case 3:
        return DeliveryNoteStatus.FALTAN_PRODUCTOS;
      default:
        return DeliveryNoteStatus.POR_PREPARAR;
    }
  }
}
