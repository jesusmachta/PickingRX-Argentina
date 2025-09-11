import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
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
  selector: 'app-delivery-note-detail-scanner',
  standalone: true,
  imports: [CommonModule, FormsModule, ZXingScannerModule],
  templateUrl: './delivery-note-detail-scanner.component.html',
  styleUrls: ['./delivery-note-detail-scanner.component.css'],
})
export class DeliveryNoteDetailScannerComponent implements OnInit, OnDestroy, AfterViewInit {
  config: DeliveryNoteDetailConfig | null = null;
  isLoading = true;
  isScanning = false;
  lastScanResult: ScanResult | null = null;

  // Camera scanner properties
  availableDevices: MediaDeviceInfo[] = [];
  currentDevice: MediaDeviceInfo | null = null;
  hasDevices = false;
  hasPermission = false;
  qrResultString = '';

  // Barcode formats to scan
  allowedFormats = [
    BarcodeFormat.QR_CODE,
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.CODABAR,
    BarcodeFormat.DATA_MATRIX,
  ];

  // Product sorting
  sortedItems: DeliveryItem[] = [];
  lastScannedSku: string | null = null;

  // Quantity control states
  showQuantityControls: { [sku: string]: boolean } = {};
  quantityControlTimers: { [sku: string]: any } = {};

  // Modal states
  showReportModal = false;
  selectedItemForReport: DeliveryItem | null = null;
  reportType: 'missing' | 'damaged' | 'expired' | 'other' = 'missing';
  reportDescription = '';

  // UI State
  isItemListExpanded = false;
  itemListHeight = 33; // Default to 33% (bottom third)

  private destroy$ = new Subject<void>();
  private noteId = '';

  // ViewChild for resizer
  @ViewChild('resizer', { static: false }) resizerRef!: ElementRef<HTMLDivElement>;

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
    // Initialize resizer functionality
    this.initializeResizer();
  }

  ngOnDestroy(): void {
    // Clear all quantity control timers
    Object.values(this.quantityControlTimers).forEach((timer) => {
      if (timer) {
        clearTimeout(timer);
      }
    });

    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load delivery note detail configuration
   */
  private loadDeliveryNoteDetail(): void {
    this.deliveryNoteDetailService
      .getDeliveryNoteDetailConfig(this.noteId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (config) => {
          this.config = config;
          this.isLoading = false;
          this.updateSortedItems();
        },
        error: (error) => {
          console.error('Error loading delivery note detail:', error);
          this.isLoading = false;
        },
      });
  }

  /**
   * Navigate back to picking list
   */
  onBackToList(): void {
    this.router.navigate(['/picking-rx']);
  }

  /**
   * Handle camera devices found
   */
  onCamerasFound(devices: MediaDeviceInfo[]): void {
    this.availableDevices = devices;
    this.hasDevices = Boolean(devices && devices.length);
    
    // Select the first back camera if available, otherwise first camera
    const backCamera = devices.find(device => 
      device.label.toLowerCase().includes('back') || 
      device.label.toLowerCase().includes('rear')
    );
    this.currentDevice = backCamera || devices[0] || null;
  }

  /**
   * Handle camera not found
   */
  onCamerasNotFound(): void {
    this.hasDevices = false;
  }

  /**
   * Handle permission response
   */
  onHasPermission(has: boolean): void {
    this.hasPermission = has;
  }

  /**
   * Handle successful barcode scan
   */
  onCodeResult(resultString: string): void {
    if (!this.config || this.isScanning || !resultString.trim()) {
      return;
    }

    this.qrResultString = resultString;
    this.processScanResult(resultString.trim());
  }

  /**
   * Process the scanned barcode result
   */
  private processScanResult(barcode: string): void {
    if (!this.config) return;

    this.isScanning = true;
    this.deliveryNoteDetailService
      .scanBarcode(this.config.note.id, barcode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.lastScanResult = result;
          this.isScanning = false;

          if (result.success && result.item) {
            // Save last scanned SKU for sorting
            this.lastScannedSku = result.item.sku;

            // Show quantity controls for this product
            this.showQuantityControlsForItem(result.item.sku);

            // Reload configuration to get updated data
            this.loadDeliveryNoteDetail();
          }

          // Clear result after 3 seconds
          setTimeout(() => {
            this.lastScanResult = null;
          }, 3000);
        },
        error: (error) => {
          console.error('Error scanning barcode:', error);
          this.isScanning = false;
        },
      });
  }

  /**
   * Sort products based on scan status
   */
  private sortProducts(items: DeliveryItem[]): DeliveryItem[] {
    return items.sort((a, b) => {
      // 1. Recently scanned product goes first
      if (this.lastScannedSku) {
        if (a.sku === this.lastScannedSku) return -1;
        if (b.sku === this.lastScannedSku) return 1;
      }

      // 2. Scan status
      const getStatus = (item: DeliveryItem) => {
        if (item.quantity_scanned === 0) return 'not_scanned';
        if (item.quantity_scanned < item.quantity_asked) return 'partial';
        return 'completed';
      };

      const statusA = getStatus(a);
      const statusB = getStatus(b);

      // Priority order: partial > not_scanned > completed
      const priorityOrder = { partial: 0, not_scanned: 1, completed: 2 };

      const priorityDiff = priorityOrder[statusA] - priorityOrder[statusB];
      if (priorityDiff !== 0) return priorityDiff;

      // 3. If same status, sort alphabetically by SKU
      return a.sku.localeCompare(b.sku);
    });
  }

  /**
   * Update sorted items list
   */
  private updateSortedItems(): void {
    if (this.config?.note?.items) {
      this.sortedItems = this.sortProducts([...this.config.note.items]);
    }
  }

  /**
   * Initialize resizer functionality for item list
   */
  private initializeResizer(): void {
    if (!this.resizerRef?.nativeElement) return;

    const resizer = this.resizerRef.nativeElement;
    let isResizing = false;
    let startY = 0;
    let startHeight = 0;

    const onMouseDown = (e: MouseEvent) => {
      isResizing = true;
      startY = e.clientY;
      startHeight = this.itemListHeight;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      e.preventDefault();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const deltaY = startY - e.clientY;
      const viewportHeight = window.innerHeight;
      const newHeight = Math.max(20, Math.min(80, startHeight + (deltaY / viewportHeight) * 100));
      this.itemListHeight = newHeight;
    };

    const onMouseUp = () => {
      isResizing = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    resizer.addEventListener('mousedown', onMouseDown);

    // Touch events for mobile
    const onTouchStart = (e: TouchEvent) => {
      isResizing = true;
      startY = e.touches[0].clientY;
      startHeight = this.itemListHeight;
      document.addEventListener('touchmove', onTouchMove, { passive: false });
      document.addEventListener('touchend', onTouchEnd);
      e.preventDefault();
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isResizing) return;
      
      const deltaY = startY - e.touches[0].clientY;
      const viewportHeight = window.innerHeight;
      const newHeight = Math.max(20, Math.min(80, startHeight + (deltaY / viewportHeight) * 100));
      this.itemListHeight = newHeight;
      e.preventDefault();
    };

    const onTouchEnd = () => {
      isResizing = false;
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };

    resizer.addEventListener('touchstart', onTouchStart);
  }

  /**
   * Toggle item list expansion
   */
  toggleItemList(): void {
    this.isItemListExpanded = !this.isItemListExpanded;
    this.itemListHeight = this.isItemListExpanded ? 70 : 33;
  }

  /**
   * Show quantity controls for an item for 5 seconds
   */
  showQuantityControlsForItem(sku: string): void {
    // Clear previous timer if exists
    if (this.quantityControlTimers[sku]) {
      clearTimeout(this.quantityControlTimers[sku]);
    }

    // Show controls
    this.showQuantityControls[sku] = true;

    // Hide after 5 seconds
    this.quantityControlTimers[sku] = setTimeout(() => {
      this.showQuantityControls[sku] = false;
      delete this.quantityControlTimers[sku];
    }, 5000);
  }

  /**
   * Increase item quantity
   */
  onIncreaseQuantity(item: DeliveryItem): void {
    if (!this.config) return;

    if (item.quantity_scanned >= item.quantity_asked) {
      console.warn(`Cannot exceed requested quantity (${item.quantity_asked})`);
      return;
    }

    const newQuantity = item.quantity_scanned + 1;
    this.updateItemQuantity(item.sku, newQuantity);
  }

  /**
   * Decrease item quantity
   */
  onDecreaseQuantity(item: DeliveryItem): void {
    if (!this.config) return;

    if (item.quantity_scanned <= 1) {
      console.warn('Cannot go below 1 if at least one product was scanned');
      return;
    }

    const newQuantity = item.quantity_scanned - 1;
    this.updateItemQuantity(item.sku, newQuantity);
  }

  /**
   * Update item quantity in Firebase and UI
   */
  private updateItemQuantity(sku: string, newQuantity: number): void {
    if (!this.config) return;

    this.lastScannedSku = sku;

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
            this.loadDeliveryNoteDetail();
          }
        },
        error: (error) => {
          console.error('Error updating quantity:', error);
        },
      });
  }

  /**
   * Open report modal for an item
   */
  onReportItem(item: DeliveryItem): void {
    this.selectedItemForReport = item;
    this.reportType = 'missing';
    this.reportDescription = '';
    this.showReportModal = true;
  }

  /**
   * Close report modal
   */
  onCloseReportModal(): void {
    this.showReportModal = false;
    this.selectedItemForReport = null;
    this.reportDescription = '';
  }

  /**
   * Submit product report
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
          console.error('Error reporting issue:', error);
        },
      });
  }

  /**
   * Update delivery note status
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
          console.error('Error updating status:', error);
        },
      });
  }

  /**
   * Get CSS class for item status
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
   * Get item status text
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
   * Get CSS class for delivery note status
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
   * Check if can mark as ready
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
   * Check if has reported items
   */
  hasReportedItems(): boolean {
    return this.config?.note.items.some((item) => item.reporte) || false;
  }

  /**
   * Format time
   */
  formatTime(date: Date | undefined): string {
    if (!date) return '';
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }

  /**
   * Get item image URL with fallback
   */
  getItemImageUrl(item: DeliveryItem): string {
    if (!item.image || item.image.trim() === '') {
      return 'assets/icons/icon-192x192.png';
    }

    try {
      const url = new URL(item.image);
      return item.image;
    } catch {
      return 'assets/icons/icon-192x192.png';
    }
  }

  /**
   * Handle image load success
   */
  onImageLoad(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.classList.add('loaded');
  }

  /**
   * Handle image load error
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    console.warn('Error loading image:', img.src);

    if (!img.src.includes('assets/icons/icon-192x192.png')) {
      img.src = 'assets/icons/icon-192x192.png';
    }

    img.classList.add('error');
  }

  /**
   * Check if can show quantity controls
   */
  canShowQuantityControls(sku: string): boolean {
    return this.showQuantityControls[sku] || false;
  }

  /**
   * Check if can increase quantity
   */
  canIncreaseQuantity(item: DeliveryItem): boolean {
    return item.quantity_scanned < item.quantity_asked;
  }

  /**
   * Check if can decrease quantity
   */
  canDecreaseQuantity(item: DeliveryItem): boolean {
    return item.quantity_scanned > 1;
  }
}
