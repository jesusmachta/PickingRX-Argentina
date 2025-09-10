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
  deliveryNotesByStatus: { [key: number]: ProcessedDeliveryNote[] } = {};
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
   * Carga la configuración de Picking RX y todas las notas por estado
   */
  private loadPickingRxConfig(): void {
    this.pickingRxService
      .getPickingRxConfig()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (config) => {
          this.pickingRxConfig = config;
          this.loadAllDeliveryNotes();
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
   * Carga todas las notas de entrega organizadas por estado
   */
  private loadAllDeliveryNotes(): void {
    // Solo mostrar Por Preparar y Preparando
    const statusesToShow = [
      DeliveryNoteStatus.POR_PREPARAR,
      DeliveryNoteStatus.PREPARANDO,
    ];

    // Inicializar con arrays vacíos
    statusesToShow.forEach((status) => {
      this.deliveryNotesByStatus[status] = [];
    });

    // Cargar por separado cada estado
    this.loadNotesForStatus(DeliveryNoteStatus.POR_PREPARAR);
    this.loadNotesForStatus(DeliveryNoteStatus.PREPARANDO);

    // Quitar loading después de un breve delay para asegurar que se cargue todo
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  private loadNotesForStatus(status: DeliveryNoteStatus): void {
    this.pickingRxService
      .getDeliveryNotesByStatus(status)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notes) => {
          this.deliveryNotesByStatus[status] = notes;
        },
        error: (error) => {
          console.error(`Error al cargar notas del estado ${status}:`, error);
          this.deliveryNotesByStatus[status] = [];
        },
      });
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
   * Obtiene las notas de entrega por estado
   */
  getDeliveryNotesByStatus(
    status: DeliveryNoteStatus
  ): ProcessedDeliveryNote[] {
    return this.deliveryNotesByStatus[status] || [];
  }

  /**
   * Obtiene la configuración de estado filtrada (solo Por Preparar y Preparando)
   */
  getVisibleStatusConfigs(): StatusConfig[] {
    if (!this.pickingRxConfig) return [];

    return this.pickingRxConfig.statusList.filter(
      (config) =>
        config.status === DeliveryNoteStatus.POR_PREPARAR ||
        config.status === DeliveryNoteStatus.PREPARANDO
    );
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
