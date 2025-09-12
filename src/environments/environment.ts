// Development environment configuration
// Note: API keys are visible in development builds - this is normal for client-side apps
export const environment = {
  production: false,
  firebaseConfig: {
    apiKey: "AIzaSyDPbRTf7CJL5bi641DVdB713tu-3wpC3SI",
    authDomain: "picking-cds-ar.firebaseapp.com",
    projectId: "picking-cds-ar",
    storageBucket: "picking-cds-ar.firebasestorage.app",
    messagingSenderId: "406735201461",
    appId: "1:406735201461:web:1fa7ac749c7e95b86ccafc"
  },
  geminiConfig: {
    // Gemini API key for AI-powered OCR text parsing
    // For production: Consider using Firebase Functions as a proxy to hide the API key
    apiKey: "AIzaSyBbEi0aXb7Qo82wITE5B9Ny3EI8eQ01yPw",
    apiUrl: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
  }
};
