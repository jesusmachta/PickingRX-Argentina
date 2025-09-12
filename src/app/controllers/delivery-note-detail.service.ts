import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject, from } from 'rxjs';
import { map, tap, catchError, switchMap } from 'rxjs/operators';
import {
  FirebaseDeliveryNote,
  ProcessedDeliveryNote,
  DeliveryNoteDetailConfig,
  DeliveryItem,
  ScanResult,
  UpdateScannedQuantity,
  ProductReport,
  DeliveryNoteStatus,
  DeliveryNoteStatusText,
} from '../models/picking-arg.interface';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root',
})
export class DeliveryNoteDetailService {
  private currentNoteSubject =
    new BehaviorSubject<ProcessedDeliveryNote | null>(null);
  public currentNote$ = this.currentNoteSubject.asObservable();

  constructor(private firebaseService: FirebaseService) {}

  /**
   * Obtiene una nota de entrega por ID desde Firebase
   */
  getDeliveryNoteById(noteId: string): Observable<ProcessedDeliveryNote> {
    return from(this.firebaseService.getRemitoById(noteId)).pipe(
      map((firebaseNote) => {
        if (!firebaseNote) {
          throw new Error(`No se encontró el remito con ID: ${noteId}`);
        }
        return this.processFirebaseNote(firebaseNote);
      }),
      tap((processedNote) => {
        this.currentNoteSubject.next(processedNote);
      }),
      catchError((error) => {
        console.error('Error obteniendo nota de entrega:', error);

        // Verificar si es un error de conectividad
        if (error?.message === 'FIREBASE_OFFLINE') {
          console.warn('🌐 Firebase está offline, usando datos mock.');
        } else {
          console.error('🔥 Error desconocido en Firebase:', error);
        }

        console.log('📋 Usando datos mock como fallback...');
        return this.getMockNoteById(noteId);
      })
    );
  }

  /**
   * Obtiene la configuración del detalle de la nota
   */
  getDeliveryNoteDetailConfig(
    noteId: string
  ): Observable<DeliveryNoteDetailConfig> {
    return this.getDeliveryNoteById(noteId).pipe(
      map((note) => ({
        note,
        canScan:
          note.status === DeliveryNoteStatus.POR_PREPARAR ||
          note.status === DeliveryNoteStatus.PREPARANDO,
        canUpdateStatus: true,
        canReport: true,
      }))
    );
  }

  /**
   * Actualiza la cantidad escaneada de un producto
   */
  updateScannedQuantity(update: UpdateScannedQuantity): Observable<boolean> {
    return from(
      this.firebaseService.updateItemScannedQuantity(
        update.noteId,
        update.sku,
        update.newScannedQuantity
      )
    ).pipe(
      tap((success) => {
        if (success) {
          // Actualizar el estado local
          const currentNote = this.currentNoteSubject.value;
          if (currentNote) {
            const itemIndex = currentNote.items.findIndex(
              (item) => item.sku === update.sku
            );
            if (itemIndex !== -1) {
              const updatedNote = { ...currentNote };
              updatedNote.items[itemIndex] = {
                ...updatedNote.items[itemIndex],
                quantity_scanned: update.newScannedQuantity,
              };
              updatedNote.scannedItems = this.calculateScannedItems(
                updatedNote.items
              );
              updatedNote.progressPercentage = this.calculateProgress(
                updatedNote.items
              );

              this.currentNoteSubject.next(updatedNote);
            }
          }
        }
      }),
      catchError((error) => {
        console.error('Error actualizando cantidad escaneada:', error);
        return of(false);
      })
    );
  }

  /**
   * Escanea un código de barras y actualiza las cantidades
   */
  scanBarcode(noteId: string, scannedCode: string): Observable<ScanResult> {
    const currentNote = this.currentNoteSubject.value;

    if (!currentNote || currentNote.id !== noteId) {
      return of({
        success: false,
        scannedCode,
        message: 'Nota de entrega no encontrada',
      });
    }

    const item = currentNote.items.find(
      (item) =>
        item.barcode.toString() === scannedCode || item.sku === scannedCode
    );

    if (!item) {
      return of({
        success: false,
        scannedCode,
        message: 'Producto no encontrado en esta nota de entrega',
      });
    }

    if (item.quantity_scanned >= item.quantity_asked) {
      return of({
        success: false,
        scannedCode,
        item,
        message: 'Ya se escaneó la cantidad requerida de este producto',
      });
    }

    // Incrementar cantidad escaneada
    const newScannedQuantity = Math.min(
      item.quantity_scanned + 1,
      item.quantity_asked
    );

    // Verificar si es el primer escaneo y cambiar estado si es necesario
    const isFirstScan = currentNote.status === DeliveryNoteStatus.POR_PREPARAR;

    return this.updateScannedQuantity({
      noteId,
      sku: item.sku,
      newScannedQuantity,
    }).pipe(
      switchMap((success) => {
        if (success && isFirstScan) {
          // Cambiar estado a "Preparando" en el primer escaneo
          return this.updateNoteStatus(
            noteId,
            DeliveryNoteStatus.PREPARANDO
          ).pipe(
            map((statusUpdated) => ({
              success: statusUpdated,
              scannedCode,
              item,
              message: statusUpdated
                ? `Producto escaneado: ${item.description}. Estado cambiado a "Preparando".`
                : `Producto escaneado: ${item.description}. Error al actualizar estado.`,
            }))
          );
        } else {
          return of({
            success,
            scannedCode,
            item,
            message: success
              ? `Producto escaneado: ${item.description}`
              : 'Error al actualizar cantidad escaneada',
          });
        }
      }),
      catchError((error) => {
        console.error('Error en el proceso de escaneo:', error);
        return of({
          success: false,
          scannedCode,
          item,
          message: 'Error al procesar el escaneo',
        });
      })
    );
  }

  /**
   * Reporta un problema con un producto
   */
  reportProductIssue(report: ProductReport): Observable<boolean> {
    const reportString = `${report.reportType}: ${report.description}`;

    return from(
      this.firebaseService.updateItemReport(
        report.noteId,
        report.sku,
        reportString
      )
    ).pipe(
      tap((success) => {
        if (success) {
          // Actualizar el estado local
          const currentNote = this.currentNoteSubject.value;
          if (currentNote) {
            const itemIndex = currentNote.items.findIndex(
              (item) => item.sku === report.sku
            );
            if (itemIndex !== -1) {
              const updatedNote = { ...currentNote };
              updatedNote.items[itemIndex] = {
                ...updatedNote.items[itemIndex],
                reporte: reportString,
              };

              this.currentNoteSubject.next(updatedNote);
            }
          }
        }
      }),
      catchError((error) => {
        console.error('Error reportando problema:', error);
        return of(false);
      })
    );
  }

  /**
   * Actualiza el estado de la nota de entrega
   */
  updateNoteStatus(
    noteId: string,
    newStatus: DeliveryNoteStatus
  ): Observable<boolean> {
    return from(this.firebaseService.updateRemitoState(noteId, newStatus)).pipe(
      tap((success) => {
        if (success) {
          // Actualizar el estado local
          const currentNote = this.currentNoteSubject.value;
          if (currentNote && currentNote.id === noteId) {
            const updatedNote = {
              ...currentNote,
              status: newStatus,
              updatedAt: new Date(),
            };

            this.currentNoteSubject.next(updatedNote);
          }
        }
      }),
      catchError((error) => {
        console.error('Error actualizando estado:', error);
        return of(false);
      })
    );
  }

  /**
   * Convierte nota de Firebase al formato procesado para la UI
   */
  private processFirebaseNote(
    firebaseNote: FirebaseDeliveryNote
  ): ProcessedDeliveryNote {
    const scannedItems = this.calculateScannedItems(firebaseNote.items);
    const totalItems = firebaseNote.items.reduce(
      (sum, item) => sum + item.quantity_asked,
      0
    );
    const progressPercentage = this.calculateProgress(firebaseNote.items);

    return {
      id: firebaseNote.idnota,
      orderNumber: firebaseNote.idnota,
      status: firebaseNote.state as DeliveryNoteStatus,
      items: firebaseNote.items,
      totalItems,
      scannedItems,
      progressPercentage,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Información adicional por defecto
      clientName: 'Cliente',
      address: 'Dirección de entrega',
      priority: 'medium',
      estimatedDeliveryTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 horas
    };
  }

  /**
   * Calcula el número total de items escaneados
   */
  private calculateScannedItems(items: DeliveryItem[]): number {
    return items.reduce((sum, item) => sum + item.quantity_scanned, 0);
  }

  /**
   * Calcula el porcentaje de progreso
   */
  private calculateProgress(items: DeliveryItem[]): number {
    const totalAsked = items.reduce(
      (sum, item) => sum + item.quantity_asked,
      0
    );
    const totalScanned = this.calculateScannedItems(items);

    return totalAsked > 0 ? Math.round((totalScanned / totalAsked) * 100) : 0;
  }

  /**
   * Datos de prueba - fallback cuando Firebase no está disponible
   */
  private getMockNoteById(noteId: string): Observable<ProcessedDeliveryNote> {
    const mockFirebaseNote: FirebaseDeliveryNote = {
      idnota: noteId,
      state: 1, // Preparando
      items: [
        {
          quantity_asked: 1,
          quantity_scanned: 0,
          sku: '00436',
          barcode: 114800436,
          description:
            'Amoxicilina + Ácido Clavulánico 600mg/42.9mg/5ml Clavutan Zoriak Suspensión Pediátrica x 60 ml',
          image: 'https://via.placeholder.com/150x150?text=Producto1',
          reporte: '',
        },
        {
          quantity_asked: 1,
          quantity_scanned: 0,
          sku: '70494',
          barcode: 115770494,
          description:
            'Diclofenaco Potásico 9mg/5ml Dolcan Pediátrico Megalabs Suspensión oral x 120 ml',
          image: 'https://via.placeholder.com/150x150?text=Producto2',
          reporte: '',
        },
      ],
    };

    const processedNote = this.processFirebaseNote(mockFirebaseNote);

    this.currentNoteSubject.next(processedNote);
    return of(processedNote);
  }
}
