// Local models for Picking RX component - Firebase independent

export interface ItemRX {
  barcode: string;
  name: string;
  quantity: string;
  sku: string;
  image: string;
  opportunityReason: string;
  opportunity: boolean;
}

export interface ItemRXWithStatus extends ItemRX {
  isScanned: boolean;
  scannedAt?: Date;
  opportunity: boolean;
  opportunityReason: string;
}

export interface PickingRX {
  id?: string; // Local ID (can be string or number)
  city?: string;
  country?: string;
  date: Date; // JavaScript Date object
  idOrden: string;
  itemRxString: string;
  itemRX: ItemRX[];
  state: number; // 0: Pendiente, 1: Preparado, 2: Facturada, 3: Cancelada
  storeId?: number;
  preparedDate?: Date;
  deliveryDate?: Date;
  preparedWithOpportunity?: boolean;
}

export enum PickingRXState {
  PENDIENTE = 0,
  PREPARADO = 1,
  FACTURADA = 2,
  CANCELADA = 3
}

// Additional utility types for local management
export interface PickingRXFilters {
  state?: PickingRXState;
  storeId?: number;
  dateFrom?: Date;
  dateTo?: Date;
  city?: string;
}

export interface PickingRXStats {
  totalOrders: number;
  pendingOrders: number;
  preparedOrders: number;
  invoicedOrders: number;
  cancelledOrders: number;
}
