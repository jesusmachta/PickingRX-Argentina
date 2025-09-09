// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyDPbRTf7CJL5bi641DVdB713tu-3wpC3SI',
  authDomain: 'picking-cds-ar.firebaseapp.com',
  projectId: 'picking-cds-ar',
  storageBucket: 'picking-cds-ar.firebasestorage.app',
  messagingSenderId: '406735201461',
  appId: '1:406735201461:web:1fa7ac749c7e95b86ccafc',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export { app, firebaseConfig };
