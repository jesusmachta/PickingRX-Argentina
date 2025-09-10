import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject, throwError } from 'rxjs';
import { map, tap } from 'rxjs/operators';
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
} from '../models/picking-rx.interface';

@Injectable({
  providedIn: 'root',
})
export class DeliveryNoteDetailService {
  // TODO: Reemplazar con el endpoint real de Firebase
  private readonly FIREBASE_ENDPOINT =
    'https://your-firebase-project.firebaseio.com/api';

  private currentNoteSubject =
    new BehaviorSubject<ProcessedDeliveryNote | null>(null);
  public currentNote$ = this.currentNoteSubject.asObservable();

  constructor() {
    this.initializeMockData();
  }

  /**
   * Obtiene una nota de entrega por ID desde Firebase
   * TODO: Implementar llamada real a Firebase
   */
  getDeliveryNoteById(noteId: string): Observable<ProcessedDeliveryNote> {
    // TODO: Reemplazar con HttpClient call a Firebase
    // return this.http.get<FirebaseDeliveryNote>(`${this.FIREBASE_ENDPOINT}/notes/${noteId}`)
    //   .pipe(map(firebaseNote => this.processFirebaseNote(firebaseNote)));

    // Simulación de datos por ahora
    return this.getMockNoteById(noteId);
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
        canScan: note.status === DeliveryNoteStatus.PREPARANDO,
        canUpdateStatus: true,
        canReport: true,
      }))
    );
  }

  /**
   * Actualiza la cantidad escaneada de un producto
   * TODO: Implementar llamada real a Firebase
   */
  updateScannedQuantity(update: UpdateScannedQuantity): Observable<boolean> {
    // TODO: Implementar llamada a Firebase
    // return this.http.put<boolean>(`${this.FIREBASE_ENDPOINT}/notes/${update.noteId}/items/${update.sku}`, {
    //   quantity_scanned: update.newScannedQuantity
    // });

    // Simulación por ahora
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
        return of(true);
      }
    }
    return of(false);
  }

  /**
   * Simula el escaneo de un código de barras
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

    return this.updateScannedQuantity({
      noteId,
      sku: item.sku,
      newScannedQuantity,
    }).pipe(
      map((success) => ({
        success,
        scannedCode,
        item,
        message: success
          ? `Producto escaneado: ${item.description}`
          : 'Error al actualizar cantidad escaneada',
      }))
    );
  }

  /**
   * Reporta un problema con un producto
   * TODO: Implementar llamada real a Firebase
   */
  reportProductIssue(report: ProductReport): Observable<boolean> {
    // TODO: Implementar llamada a Firebase
    // return this.http.post<boolean>(`${this.FIREBASE_ENDPOINT}/reports`, report);

    const currentNote = this.currentNoteSubject.value;
    if (currentNote) {
      const itemIndex = currentNote.items.findIndex(
        (item) => item.sku === report.sku
      );
      if (itemIndex !== -1) {
        const updatedNote = { ...currentNote };
        updatedNote.items[itemIndex] = {
          ...updatedNote.items[itemIndex],
          reporte: `${report.reportType}: ${report.description}`,
        };

        this.currentNoteSubject.next(updatedNote);
        return of(true);
      }
    }
    return of(false);
  }

  /**
   * Actualiza el estado de la nota de entrega
   * TODO: Implementar llamada real a Firebase
   */
  updateNoteStatus(
    noteId: string,
    newStatus: DeliveryNoteStatus
  ): Observable<boolean> {
    // TODO: Implementar llamada a Firebase
    // return this.http.put<boolean>(`${this.FIREBASE_ENDPOINT}/notes/${noteId}`, {
    //   state: newStatus
    // });

    const currentNote = this.currentNoteSubject.value;
    if (currentNote && currentNote.id === noteId) {
      const updatedNote = {
        ...currentNote,
        status: newStatus,
        updatedAt: new Date(),
      };

      this.currentNoteSubject.next(updatedNote);
      return of(true);
    }
    return of(false);
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
   * Datos de prueba - TODO: Eliminar cuando se implemente Firebase
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

    // Agregar información adicional que no viene de Firebase
    processedNote.clientName = 'Cliente de Ejemplo';
    processedNote.address = 'Caracas, Venezuela';
    processedNote.priority = 'high';
    processedNote.estimatedDeliveryTime = new Date(
      Date.now() + 2 * 60 * 60 * 1000
    ); // 2 horas

    this.currentNoteSubject.next(processedNote);
    return of(processedNote);
  }

  /**
   * Inicializa datos de prueba
   */
  private initializeMockData(): void {
    // Los datos se cargarán cuando se solicite una nota específica
  }
}
