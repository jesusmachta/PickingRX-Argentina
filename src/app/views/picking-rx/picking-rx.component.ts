import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PickingRxService } from '../../controllers/picking-rx.service';
import {
  PickingRxConfig,
  StatusConfig,
  ProcessedDeliveryNote,
  DeliveryNoteStatus,
  DeliveryNoteStatusText,
} from '../../models/picking-rx.interface';

@Component({
  selector: 'app-picking-rx',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './picking-rx.component.html',
  styleUrl: './picking-rx.component.css',
})
export class PickingRxComponent implements OnInit, OnDestroy {
  pickingRxConfig: PickingRxConfig | null = null;
  selectedStatus: DeliveryNoteStatus | null = null;
  deliveryNotes: ProcessedDeliveryNote[] = [];
  isLoading = true;

  private destroy$ = new Subject<void>();

  constructor(
    private pickingRxService: PickingRxService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPickingRxConfig();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga la configuración de Picking RX
   */
  private loadPickingRxConfig(): void {
    this.pickingRxService
      .getPickingRxConfig()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (config) => {
          this.pickingRxConfig = config;
          this.isLoading = false;
        },
        error: (error) => {
          console.error(
            'Error al cargar la configuración de Picking RX:',
            error
          );
          this.isLoading = false;
        },
      });
  }

  /**
   * Maneja el clic en una tarjeta de estado
   */
  onStatusCardClick(statusConfig: StatusConfig): void {
    this.selectedStatus = statusConfig.status;
    this.loadDeliveryNotesByStatus(statusConfig.status);
  }

  /**
   * Carga las notas de entrega por estado
   */
  private loadDeliveryNotesByStatus(status: DeliveryNoteStatus): void {
    this.pickingRxService
      .getDeliveryNotesByStatus(status)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notes) => {
          this.deliveryNotes = notes;
        },
        error: (error) => {
          console.error('Error al cargar las notas de entrega:', error);
        },
      });
  }

  /**
   * Vuelve a la vista principal
   */
  onBackToMain(): void {
    this.selectedStatus = null;
    this.deliveryNotes = [];
  }

  /**
   * Navega de vuelta al homepage
   */
  onBackToHomepage(): void {
    this.router.navigate(['/']);
  }

  /**
   * Maneja el clic en una nota de entrega
   */
  onDeliveryNoteClick(note: ProcessedDeliveryNote): void {
    this.router.navigate(['/picking-rx/detail', note.id]);
  }

  /**
   * Actualiza el estado de una nota de entrega
   */
  onUpdateNoteStatus(noteId: string, newStatus: DeliveryNoteStatus): void {
    this.pickingRxService
      .updateDeliveryNoteStatus(noteId, newStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (success) => {
          if (success) {
            // Recargar la configuración para actualizar contadores
            this.loadPickingRxConfig();
            // Si estamos viendo una lista específica, recargarla
            if (this.selectedStatus) {
              this.loadDeliveryNotesByStatus(this.selectedStatus);
            }
          }
        },
        error: (error) => {
          console.error('Error al actualizar el estado de la nota:', error);
        },
      });
  }

  /**
   * Obtiene el texto del estado en español
   */
  getStatusText(status: DeliveryNoteStatus): string {
    return DeliveryNoteStatusText[status] || status.toString();
  }

  /**
   * Obtiene la clase CSS para la prioridad
   */
  getPriorityClass(priority: string): string {
    return `priority-${priority}`;
  }

  /**
   * Formatea la fecha
   */
  formatDate(date: Date | undefined): string {
    if (!date) return '';
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }

  /**
   * Formatea la hora
   */
  formatTime(date: Date | undefined): string {
    if (!date) return '';
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }
}
