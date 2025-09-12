// Production environment configuration
// SECURITY NOTE: API keys in client-side apps are always visible to users
// For better security, consider using Firebase Functions as a proxy for the Gemini API
export const environment = {
  production: true,
  firebaseConfig: {
    apiKey: "AIzaSyDPbRTf7CJL5bi641DVdB713tu-3wpC3SI",
    authDomain: "picking-cds-ar.firebaseapp.com",
    projectId: "picking-cds-ar",
    storageBucket: "picking-cds-ar.firebasestorage.app",
    messagingSenderId: "406735201461",
    appId: "1:406735201461:web:1fa7ac749c7e95b86ccafc"
  },
  geminiConfig: {
    // Production Gemini API key for AI-powered OCR text parsing
    // TODO: Replace with your production Gemini API key
    // RECOMMENDED: Use Firebase Functions to proxy API calls and hide the key
    apiKey: "AIzaSyBbEi0aXb7Qo82wITE5B9Ny3EI8eQ01yPw",
    apiUrl: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
  }
};
