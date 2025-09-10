/**
 * Colores corporativos de PickingRX Argentina
 */
export const CORPORATE_COLORS = {
  // Color principal - Azul oscuro
  PRIMARY: '#002858',

  // Colores secundarios
  SECONDARY_BLUE: '#0084DD',
  TEAL: '#00A19A',
  YELLOW: '#A1A100',
  PURPLE: '#4A106E',

  // Colores neutros
  WHITE: '#FFFFFF',
  LIGHT_GRAY: '#F5F5F5',
  GRAY: '#CCCCCC',
  DARK_GRAY: '#333333',
  BLACK: '#000000',
} as const;

export type CorporateColor =
  (typeof CORPORATE_COLORS)[keyof typeof CORPORATE_COLORS];
