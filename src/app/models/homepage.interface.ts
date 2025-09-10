/**
 * Interface para los elementos de funcionalidad de la homepage
 */
export interface FunctionalityItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  isEnabled: boolean;
  color?: string;
}

/**
 * Interface para la configuración de la homepage
 */
export interface HomepageConfig {
  title: string;
  subtitle: string;
  functionalities: FunctionalityItem[];
}
