import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
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
} from '../../models/picking-arg.interface';

@Component({
  selector: 'app-delivery-note-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './delivery-note-detail.component.html',
  styleUrl: './delivery-note-detail.component.css',
})
export class DeliveryNoteDetailComponent implements OnInit, OnDestroy, AfterViewInit {
  config: DeliveryNoteDetailConfig | null = null;
  isLoading = true;
  scanInputValue = '';
  isScanning = false;
  lastScanResult: ScanResult | null = null;

  // Product sorting
  sortedItems: DeliveryItem[] = [];
  lastScannedSku: string | null = null;

  // Quantity control states
  showQuantityControls: { [sku: string]: boolean } = {};
  quantityControlTimers: { [sku: string]: any } = {};

  // Hand-held scanner optimization
  private scannerBuffer = '';
  private scannerTimeout: any;
  private inputTimeout: any;
  private readonly SCANNER_TIMEOUT = 100; // ms between characters
  private readonly AUTO_SCAN_DELAY = 20; // ms delay before auto-processing
  private readonly INPUT_DELAY = 150; // ms delay for input completion

  // Modal states
  showReportModal = false;
  selectedItemForReport: DeliveryItem | null = null;
  reportType: 'missing' | 'damaged' | 'expired' | 'other' = 'missing';
  reportDescription = '';

  private destroy$ = new Subject<void>();
  private noteId = '';

  // ViewChild for scanner input
  @ViewChild('scanInput', { static: false }) scanInputRef!: ElementRef<HTMLInputElement>;

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

  ngAfterViewInit(): void {
    // Focus the scanner input after view initialization
    this.focusScannerInput();
  }

  ngOnDestroy(): void {
    // Limpiar todos los timers de controles de cantidad
    Object.values(this.quantityControlTimers).forEach((timer) => {
      if (timer) {
        clearTimeout(timer);
      }
    });

    // Limpiar timeouts del scanner
    if (this.scannerTimeout) {
      clearTimeout(this.scannerTimeout);
    }
    if (this.inputTimeout) {
      clearTimeout(this.inputTimeout);
    }

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
          this.updateSortedItems(); // Ordenar productos inicialmente
          // Focus scanner input after loading is complete
          setTimeout(() => this.focusScannerInput(), 100);
        },
        error: (error) => {
          console.error('Error al cargar el detalle de la nota:', error);
          this.isLoading = false;
        },
      });
  }

  /**
   * Enfoca el campo de entrada del scanner
   */
  private focusScannerInput(): void {
    if (this.scanInputRef?.nativeElement && this.config?.canScan) {
      try {
        const input = this.scanInputRef.nativeElement;
        input.focus();
        
        // Position cursor at the end of any existing text
        if (typeof input.setSelectionRange === 'function') {
          input.setSelectionRange(input.value.length, input.value.length);
        }
      } catch (error) {
        console.warn('Could not focus scanner input:', error);
      }
    }
  }

  /**
   * Navega de vuelta a la lista de picking
   */
  onBackToList(): void {
    this.router.navigate(['/picking-arg']);
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

          if (result.success && result.item) {
            // Guardar el último SKU escaneado para ordenamiento
            this.lastScannedSku = result.item.sku;

            // Mostrar controles de cantidad para este producto
            this.showQuantityControlsForItem(result.item.sku);

            // Recargar la configuración para obtener datos actualizados
            this.loadDeliveryNoteDetail();
          }

          // Refocus the scanner input for continuous scanning
          setTimeout(() => this.focusScannerInput(), 50);

          // Limpiar el resultado después de 3 segundos
          setTimeout(() => {
            this.lastScanResult = null;
          }, 3000);
        },
        error: (error) => {
          console.error('Error al escanear código:', error);
          this.isScanning = false;
          // Refocus even on error for continuous scanning
          setTimeout(() => this.focusScannerInput(), 50);
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
   * Maneja cambios en el input - Optimizado para hand-held scanners
   */
  onScanInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();

    // Clear timeout anterior
    if (this.scannerTimeout) {
      clearTimeout(this.scannerTimeout);
    }

    // Si hay valor y no estamos escaneando, procesar automáticamente
    if (value.length >= 4 && !this.isScanning) {
      console.log('🔍 Detectado código hand-held:', value);

      // Muy poco delay para permitir que el scanner termine de escribir
      this.scannerTimeout = setTimeout(() => {
        if (this.scanInputValue.trim().length >= 4 && !this.isScanning) {
          console.log('⚡ Auto-procesando código:', this.scanInputValue.trim());
          this.onScanBarcode();
        }
      }, 20); // Reducido a 20ms para ser más responsive
    }
  }

  /**
   * Maneja paste - para códigos copiados/pegados
   */
  onScanInputPaste(event: ClipboardEvent): void {
    // Permitir que el paste suceda primero
    setTimeout(() => {
      if (this.scanInputValue.trim().length > 3 && !this.isScanning) {
        console.log('📋 Auto-escaneando código pegado:', this.scanInputValue);
        this.onScanBarcode();
      }
    }, 10);
  }

  /**
   * Maneja el evento blur del input para mantener el foco
   */
  onScanInputBlur(event: FocusEvent): void {
    // Refocus after a short delay to maintain continuous scanning capability
    // Only if we're not currently scanning and the component can scan
    if (!this.isScanning && this.config?.canScan) {
      setTimeout(() => this.focusScannerInput(), 100);
    }
  }

  /**
   * Ordena los productos según el estado de escaneo
   * Prioridad: 1. Recién escaneado, 2. Parcialmente escaneados, 3. No escaneados, 4. Completamente escaneados
   */
  private sortProducts(items: DeliveryItem[]): DeliveryItem[] {
    return items.sort((a, b) => {
      // 1. El producto recién escaneado va primero
      if (this.lastScannedSku) {
        if (a.sku === this.lastScannedSku) return -1;
        if (b.sku === this.lastScannedSku) return 1;
      }

      // 2. Estados de escaneo
      const getStatus = (item: DeliveryItem) => {
        if (item.quantity_scanned === 0) return 'not_scanned';
        if (item.quantity_scanned < item.quantity_asked) return 'partial';
        return 'completed';
      };

      const statusA = getStatus(a);
      const statusB = getStatus(b);

      // Orden de prioridad: partial > not_scanned > completed
      const priorityOrder = { partial: 0, not_scanned: 1, completed: 2 };

      const priorityDiff = priorityOrder[statusA] - priorityOrder[statusB];
      if (priorityDiff !== 0) return priorityDiff;

      // 3. Si mismo estado, ordenar por SKU alfabéticamente
      return a.sku.localeCompare(b.sku);
    });
  }

  /**
   * Actualiza la lista ordenada de productos
   */
  private updateSortedItems(): void {
    if (this.config?.note?.items) {
      this.sortedItems = this.sortProducts([...this.config.note.items]);
      console.log('🔄 Productos reordenados:', {
        lastScanned: this.lastScannedSku,
        total: this.sortedItems.length,
        firstItem: this.sortedItems[0]?.sku,
      });
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

  /**
   * Obtiene la URL de la imagen del producto con fallback
   */
  getItemImageUrl(item: DeliveryItem): string {
    // Si no hay imagen o está vacía, usar imagen por defecto
    if (!item.image || item.image.trim() === '') {
      return 'assets/icons/icon-192x192.png';
    }

    // Verificar si es una URL válida
    try {
      const url = new URL(item.image);
      return item.image;
    } catch {
      // Si no es una URL válida, usar imagen por defecto
      return 'assets/icons/icon-192x192.png';
    }
  }

  /**
   * Maneja la carga exitosa de la imagen
   */
  onImageLoad(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.classList.add('loaded');
  }

  /**
   * Maneja el error de carga de la imagen
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    console.warn('Error cargando imagen:', img.src);

    // Fallback a imagen por defecto si no es ya la imagen por defecto
    if (!img.src.includes('assets/icons/icon-192x192.png')) {
      img.src = 'assets/icons/icon-192x192.png';
    }

    img.classList.add('error');
  }

  /**
   * Muestra los controles de cantidad para un producto por 5 segundos
   */
  showQuantityControlsForItem(sku: string): void {
    // Limpiar timer anterior si existe
    if (this.quantityControlTimers[sku]) {
      clearTimeout(this.quantityControlTimers[sku]);
    }

    // Mostrar controles
    this.showQuantityControls[sku] = true;

    // Ocultar después de 5 segundos
    this.quantityControlTimers[sku] = setTimeout(() => {
      this.showQuantityControls[sku] = false;
      delete this.quantityControlTimers[sku];
    }, 5000);
  }

  /**
   * Incrementar cantidad de un producto
   */
  onIncreaseQuantity(item: DeliveryItem): void {
    if (!this.config) return;

    // Validación: no superar quantity_asked
    if (item.quantity_scanned >= item.quantity_asked) {
      console.warn(
        `No se puede superar la cantidad solicitada (${item.quantity_asked})`
      );
      return;
    }

    const newQuantity = item.quantity_scanned + 1;
    this.updateItemQuantity(item.sku, newQuantity);
  }

  /**
   * Decrementar cantidad de un producto
   */
  onDecreaseQuantity(item: DeliveryItem): void {
    if (!this.config) return;

    // Validación: no bajar de 1 si ya se escaneó al menos uno
    if (item.quantity_scanned <= 1) {
      console.warn(
        'No se puede bajar de 1 si ya se escaneó al menos un producto'
      );
      return;
    }

    const newQuantity = item.quantity_scanned - 1;
    this.updateItemQuantity(item.sku, newQuantity);
  }

  /**
   * Actualizar cantidad en Firebase y UI
   */
  private updateItemQuantity(sku: string, newQuantity: number): void {
    if (!this.config) return;

    this.lastScannedSku = sku; // Marcar como último modificado

    this.deliveryNoteDetailService
      .updateScannedQuantity({
        noteId: this.config.note.id,
        sku: sku,
        newScannedQuantity: newQuantity,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (success) => {
          if (success) {
            // Recargar datos para mostrar cambios
            this.loadDeliveryNoteDetail();
          }
        },
        error: (error) => {
          console.error('Error actualizando cantidad:', error);
        },
      });
  }

  /**
   * Verificar si se pueden mostrar los controles para un producto
   */
  canShowQuantityControls(sku: string): boolean {
    return this.showQuantityControls[sku] || false;
  }

  /**
   * Verificar si se puede incrementar la cantidad
   */
  canIncreaseQuantity(item: DeliveryItem): boolean {
    return item.quantity_scanned < item.quantity_asked;
  }

  /**
   * Verificar si se puede decrementar la cantidad
   */
  canDecreaseQuantity(item: DeliveryItem): boolean {
    return item.quantity_scanned > 1;
  }
}
