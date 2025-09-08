import { firebaseConfig } from './firebase.config.dev';

export const environment = {
  production: false,
  firebase: firebaseConfig,
  apiUrl: 'https://picking-cds-ar-dev.web.app/api', // Development API URL
  appUrl: 'https://picking-cds-ar.web.app',
};
