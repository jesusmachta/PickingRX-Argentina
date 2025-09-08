import { firebaseConfig } from './firebase.config';

export const environment = {
  production: false,
  development: true,
  firebase: firebaseConfig,
  // Agregar configuraciones específicas para development si es necesario
  apiUrl: 'https://api-dev.picking-cds-ar.web.app',
  enableDebugMode: true,
};
