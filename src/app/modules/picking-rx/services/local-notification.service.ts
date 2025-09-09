import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalNotificationService {
  private hasPermission = false;
  private isInitialized = false;

  constructor() {
    this.initializeNotifications();
  }

  private async initializeNotifications(): Promise<void> {
    if (this.isInitialized) return;

    // Simple initialization - no complex permission handling
    this.hasPermission = true; // Assume permission for local use
    this.isInitialized = true;
  }

  // Show notification for new orders
  showNewOrderNotification(orderCount: number): void {
    console.log(`📦 New order notification: ${orderCount} pending order${orderCount > 1 ? 's' : ''}`);

    // Simple console notification instead of browser notification
    // You can extend this to show toast notifications, snackbars, etc.
    this.showConsoleNotification(orderCount);
  }

  private showConsoleNotification(orderCount: number): void {
    const message = `🔔 ALERTA: Tienes ${orderCount} pedido${orderCount > 1 ? 's' : ''} pendiente${orderCount > 1 ? 's' : ''} por preparar`;

    console.log(message);

    // Optional: Add visual feedback like vibration if supported
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  }

  // Enable notifications (simplified)
  async enableNotifications(): Promise<boolean> {
    console.log('🔔 Notificaciones habilitadas localmente');
    this.hasPermission = true;
    return true;
  }

  // Check if notifications are enabled
  areNotificationsEnabled(): boolean {
    return this.hasPermission;
  }

  // Get status message
  getStatusMessage(): string {
    return this.hasPermission ? 'Notificaciones activadas' : 'Notificaciones deshabilitadas';
  }

  // Show success notification
  showSuccessNotification(message: string): void {
    console.log(`✅ ${message}`);
  }

  // Show error notification
  showErrorNotification(message: string): void {
    console.error(`❌ ${message}`);
  }

  // Show info notification
  showInfoNotification(message: string): void {
    console.log(`ℹ️ ${message}`);
  }
}
