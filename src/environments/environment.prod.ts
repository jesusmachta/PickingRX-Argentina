import { firebaseConfig } from './firebase.config';

export const environment = {
  production: true,
  development: false,
  firebase: firebaseConfig,
  // Configuraciones para production
  apiUrl: 'https://api.picking-cds-ar.web.app',
  enableDebugMode: false,
};
