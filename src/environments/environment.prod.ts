import { firebaseConfig } from './firebase.config.prod';

export const environment = {
  production: true,
  firebase: firebaseConfig,
  apiUrl: 'https://picking-cds-ar.firebaseapp.com/api', // Production API URL
  appUrl: 'https://picking-cds-ar.firebaseapp.com',
};
