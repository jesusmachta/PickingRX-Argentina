export interface ScannedItem {
  quantity_asked: number;
  quantity_scanned: number;
  sku: string;
  barcode: number | null;
  description: string;
  image: string;
  reporte: string;
}
