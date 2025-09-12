/**
 * Enumeración de los estados de las notas de entrega (números según Firebase)
 */
export enum DeliveryNoteStatus {
  POR_PREPARAR = 0,
  PREPARANDO = 1,
  LISTO = 2,
  FALTAN_PRODUCTOS = 3,
}

/**
 * Helper para convertir estado numérico a texto
 */
export const DeliveryNoteStatusText = {
  [DeliveryNoteStatus.POR_PREPARAR]: 'Por Preparar',
  [DeliveryNoteStatus.PREPARANDO]: 'Preparando',
  [DeliveryNoteStatus.LISTO]: 'Listo',
  [DeliveryNoteStatus.FALTAN_PRODUCTOS]: 'Faltan Productos',
};

/**
 * Interface para los elementos de una nota de entrega (formato Firebase)
 */
export interface DeliveryItem {
  quantity_asked: number;
  quantity_scanned: number;
  sku: string;
  barcode: number;
  description: string;
  image: string;
  reporte: string;
}

/**
 * Interface para la respuesta de Firebase de una nota de entrega
 */
export interface FirebaseDeliveryNote {
  idnota: string;
  state: number;
  items: DeliveryItem[];
}

/**
 * Interface para nota de entrega procesada para la UI
 */
export interface ProcessedDeliveryNote {
  id: string;
  orderNumber: string;
  status: DeliveryNoteStatus;
  items: DeliveryItem[];
  totalItems: number;
  scannedItems: number;
  progressPercentage: number;
  createdAt?: Date;
  updatedAt?: Date;
  estimatedDeliveryTime?: Date;
  priority?: 'low' | 'medium' | 'high';
  clientName?: string;
  address?: string;
}

/**
 * Interface para la configuración de un estado
 */
export interface StatusConfig {
  status: DeliveryNoteStatus;
  title: string;
  description: string;
  color: string;
  icon: string;
  count: number;
}

/**
 * Interface para la configuración de la vista de Picking ARG
 */
export interface PickingArgConfig {
  title: string;
  subtitle: string;
  statusList: StatusConfig[];
  totalOrders: number;
}

/**
 * Interface para filtros de búsqueda
 */
export interface DeliveryNoteFilters {
  status?: DeliveryNoteStatus;
  searchTerm?: string;
  priority?: 'low' | 'medium' | 'high';
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Interface para la configuración del detalle de nota de entrega
 */
export interface DeliveryNoteDetailConfig {
  note: ProcessedDeliveryNote;
  canScan: boolean;
  canUpdateStatus: boolean;
  canReport: boolean;
}

/**
 * Interface para el resultado de escaneo
 */
export interface ScanResult {
  success: boolean;
  scannedCode: string;
  item?: DeliveryItem;
  message: string;
}

/**
 * Interface para actualizar cantidad escaneada
 */
export interface UpdateScannedQuantity {
  noteId: string;
  sku: string;
  newScannedQuantity: number;
}

/**
 * Interface para reportar problema con producto
 */
export interface ProductReport {
  noteId: string;
  sku: string;
  reportType: 'missing' | 'damaged' | 'expired' | 'other';
  description: string;
}
