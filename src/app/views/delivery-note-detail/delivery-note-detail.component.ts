import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { DeliveryNoteDetailService } from '../../controllers/delivery-note-detail.service';
import {
  ProcessedDeliveryNote,
  DeliveryNoteDetailConfig,
  DeliveryItem,
  ScanResult,
  ProductReport,
  DeliveryNoteStatus,
  DeliveryNoteStatusText,
} from '../../models/picking-rx.interface';

@Component({
  selector: 'app-delivery-note-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './delivery-note-detail.component.html',
  styleUrl: './delivery-note-detail.component.css',
})
export class DeliveryNoteDetailComponent implements OnInit, OnDestroy {
  config: DeliveryNoteDetailConfig | null = null;
  isLoading = true;
  scanInputValue = '';
  isScanning = false;
  lastScanResult: ScanResult | null = null;

  // Modal states
  showReportModal = false;
  selectedItemForReport: DeliveryItem | null = null;
  reportType: 'missing' | 'damaged' | 'expired' | 'other' = 'missing';
  reportDescription = '';

  private destroy$ = new Subject<void>();
  private noteId = '';

  // Enum references for template
  DeliveryNoteStatus = DeliveryNoteStatus;
  DeliveryNoteStatusText = DeliveryNoteStatusText;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private deliveryNoteDetailService: DeliveryNoteDetailService
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.noteId = params['id'];
      if (this.noteId) {
        this.loadDeliveryNoteDetail();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga el detalle de la nota de entrega
   */
  private loadDeliveryNoteDetail(): void {
    this.deliveryNoteDetailService
      .getDeliveryNoteDetailConfig(this.noteId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (config) => {
          this.config = config;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al cargar el detalle de la nota:', error);
          this.isLoading = false;
        },
      });
  }

  /**
   * Navega de vuelta a la lista de picking
   */
  onBackToList(): void {
    this.router.navigate(['/picking-rx']);
  }

  /**
   * Maneja el escaneo de códigos de barras
   */
  onScanBarcode(): void {
    if (!this.scanInputValue.trim() || !this.config || this.isScanning) {
      return;
    }

    this.isScanning = true;
    this.deliveryNoteDetailService
      .scanBarcode(this.config.note.id, this.scanInputValue.trim())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.lastScanResult = result;
          this.scanInputValue = '';
          this.isScanning = false;

          if (result.success) {
            // Recargar la configuración para obtener datos actualizados
            this.loadDeliveryNoteDetail();
          }

          // Limpiar el resultado después de 3 segundos
          setTimeout(() => {
            this.lastScanResult = null;
          }, 3000);
        },
        error: (error) => {
          console.error('Error al escanear código:', error);
          this.isScanning = false;
        },
      });
  }

  /**
   * Maneja el evento Enter en el input de escaneo
   */
  onScanInputKeyup(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onScanBarcode();
    }
  }

  /**
   * Abre el modal para reportar un problema
   */
  onReportItem(item: DeliveryItem): void {
    this.selectedItemForReport = item;
    this.reportType = 'missing';
    this.reportDescription = '';
    this.showReportModal = true;
  }

  /**
   * Cierra el modal de reporte
   */
  onCloseReportModal(): void {
    this.showReportModal = false;
    this.selectedItemForReport = null;
    this.reportDescription = '';
  }

  /**
   * Envía el reporte de problema
   */
  onSubmitReport(): void {
    if (!this.selectedItemForReport || !this.config) {
      return;
    }

    const report: ProductReport = {
      noteId: this.config.note.id,
      sku: this.selectedItemForReport.sku,
      reportType: this.reportType,
      description: this.reportDescription,
    };

    this.deliveryNoteDetailService
      .reportProductIssue(report)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (success) => {
          if (success) {
            this.onCloseReportModal();
            this.loadDeliveryNoteDetail();
          }
        },
        error: (error) => {
          console.error('Error al reportar problema:', error);
        },
      });
  }

  /**
   * Actualiza el estado de la nota de entrega
   */
  onUpdateStatus(newStatus: DeliveryNoteStatus): void {
    if (!this.config) return;

    this.deliveryNoteDetailService
      .updateNoteStatus(this.config.note.id, newStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (success) => {
          if (success) {
            this.loadDeliveryNoteDetail();
          }
        },
        error: (error) => {
          console.error('Error al actualizar estado:', error);
        },
      });
  }

  /**
   * Obtiene la clase CSS para el estado del item
   */
  getItemStatusClass(item: DeliveryItem): string {
    if (item.reporte) {
      return 'item-reported';
    }
    if (item.quantity_scanned >= item.quantity_asked) {
      return 'item-completed';
    }
    if (item.quantity_scanned > 0) {
      return 'item-partial';
    }
    return 'item-pending';
  }

  /**
   * Obtiene el texto del estado del item
   */
  getItemStatusText(item: DeliveryItem): string {
    if (item.reporte) {
      return 'Reportado';
    }
    if (item.quantity_scanned >= item.quantity_asked) {
      return 'Completo';
    }
    if (item.quantity_scanned > 0) {
      return 'Parcial';
    }
    return 'Pendiente';
  }

  /**
   * Obtiene la clase CSS para el estado de la nota
   */
  getStatusClass(status: DeliveryNoteStatus): string {
    switch (status) {
      case DeliveryNoteStatus.POR_PREPARAR:
        return 'status-pending';
      case DeliveryNoteStatus.PREPARANDO:
        return 'status-preparing';
      case DeliveryNoteStatus.LISTO:
        return 'status-ready';
      case DeliveryNoteStatus.FALTAN_PRODUCTOS:
        return 'status-missing';
      default:
        return 'status-unknown';
    }
  }

  /**
   * Verifica si se puede cambiar al estado "Listo"
   */
  canMarkAsReady(): boolean {
    if (!this.config) return false;

    const allItemsCompleted = this.config.note.items.every(
      (item) => item.quantity_scanned >= item.quantity_asked || item.reporte
    );

    return (
      allItemsCompleted && this.config.note.status !== DeliveryNoteStatus.LISTO
    );
  }

  /**
   * Verifica si algún item tiene problemas
   */
  hasReportedItems(): boolean {
    return this.config?.note.items.some((item) => item.reporte) || false;
  }

  /**
   * Formatea la fecha
   */
  formatTime(date: Date | undefined): string {
    if (!date) return '';
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }
}
