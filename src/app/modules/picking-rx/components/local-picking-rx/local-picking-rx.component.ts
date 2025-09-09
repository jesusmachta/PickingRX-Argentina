import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, combineLatest } from 'rxjs';
import { LocalPickingRxService } from '../../services/local-picking-rx.service';
import { LocalNotificationService } from '../../services/local-notification.service';
import { LocalAuthService } from '../../services/local-auth.service';
import { LocalStoreService, Store } from '../../services/local-store.service';
import { PickingRX, PickingRXState } from '../../models/picking-rx.interface';

@Component({
  selector: 'app-local-picking-rx',
  templateUrl: './local-picking-rx.component.html',
  standalone: false
})
export class LocalPickingRxComponent implements OnInit, OnDestroy {
  private subscription = new Subscription();

  // Input properties for customization
  @Input() showHeader = true;
  @Input() showNotifications = true;
  @Input() allowOrderNavigation = true;
  @Input() customTitle = 'Picking RX';

  pendingOrders: PickingRX[] = [];
  preparedOrders: PickingRX[] = [];
  isLoading = false;
  expandedOrders: Set<string> = new Set();
  private previousPendingCount = 0;

  // Computed properties
  get totalOrders(): number {
    return this.pendingOrders.length + this.preparedOrders.length;
  }

  get pendingCount(): number {
    return this.pendingOrders.length;
  }

  get preparedCount(): number {
    return this.preparedOrders.length;
  }

  constructor(
    private router: Router,
    private pickingRxService: LocalPickingRxService,
    private notificationService: LocalNotificationService,
    private authService: LocalAuthService,
    private storeService: LocalStoreService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private loadOrders(): void {
    this.isLoading = true;

    const ordersSubscription = combineLatest([
      this.pickingRxService.getPendingOrders(),
      this.pickingRxService.getPreparedOrders()
    ]).subscribe({
      next: ([pending, prepared]) => {
        const currentPendingCount = pending.length;

        // Show notification for new orders
        if (this.showNotifications && currentPendingCount > this.previousPendingCount) {
          this.notificationService.showNewOrderNotification(currentPendingCount);
        }

        this.previousPendingCount = currentPendingCount;
        this.pendingOrders = pending;
        this.preparedOrders = prepared;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.notificationService.showErrorNotification('Error al cargar pedidos');
        this.isLoading = false;
      }
    });

    this.subscription.add(ordersSubscription);
  }

  async markOrderAsPrepared(order: PickingRX, withOpportunity: boolean = false): Promise<void> {
    if (!order.id) return;

    try {
      await this.pickingRxService.markAsPrepared(order.id, withOpportunity);
      this.notificationService.showSuccessNotification('Pedido marcado como preparado');
    } catch (error) {
      console.error('Error marking order as prepared:', error);
      this.notificationService.showErrorNotification('Error al marcar pedido como preparado');
    }
  }

  formatDate(date: any): string {
    if (!date) return '';

    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).replace(',', '');
  }

  formatItemsCount(items: any[]): string {
    if (!items || items.length === 0) return '0 items';
    return `${items.length} item${items.length !== 1 ? 's' : ''}`;
  }

  hasOpportunityItems(items: any[]): boolean {
    return items && items.some(item => item.opportunity);
  }

  shouldTruncateText(text: string | undefined): boolean {
    return !!(text && text.length > 100);
  }

  getTruncatedText(text: string | undefined): string {
    if (!text) return '';
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
  }

  isOrderExpanded(orderId: string): boolean {
    return this.expandedOrders.has(orderId);
  }

  toggleOrderExpansion(orderId: string): void {
    if (this.expandedOrders.has(orderId)) {
      this.expandedOrders.delete(orderId);
    } else {
      this.expandedOrders.add(orderId);
    }
  }

  getDisplayText(order: PickingRX): string {
    if (!order.id || !order.itemRxString) return order.itemRxString || '';

    if (this.shouldTruncateText(order.itemRxString) && !this.isOrderExpanded(order.id)) {
      return this.getTruncatedText(order.itemRxString);
    }
    return order.itemRxString;
  }

  openOrderDetail(order: PickingRX): void {
    if (!this.allowOrderNavigation) return;

    if (order.idOrden) {
      // You can customize this navigation path
      console.log(`Navigate to order detail: ${order.idOrden}`);
      // this.router.navigate(['/orders', order.idOrden]);
    }
  }

  goBack(): void {
    // You can customize this navigation
    console.log('Go back action triggered');
    // this.router.navigate(['/dashboard']);
  }

  enableNotifications(): void {
    this.notificationService.enableNotifications();
  }

  // Public methods for external control
  refreshOrders(): void {
    this.loadOrders();
  }

  addNewOrder(order: PickingRX): void {
    this.pickingRxService.addOrder(order);
  }

  setOrders(orders: PickingRX[]): void {
    this.pickingRxService.setOrders(orders);
  }

  getCurrentOrders(): PickingRX[] {
    return this.pickingRxService.getCurrentOrders();
  }

  clearAllOrders(): void {
    this.pickingRxService.clearOrders();
  }
}
