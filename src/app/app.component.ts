import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'picking-arg-argentina';

  ngOnInit(): void {
    this.requestCameraPermission();
  }

  /**
   * Request camera permission as soon as the app loads
   */
  private async requestCameraPermission(): Promise<void> {
    try {
      console.log('🎥 Solicitando permisos de cámara...');
      
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Prefer back camera for barcode scanning
        } 
      });
      
      console.log('✅ Permisos de cámara concedidos');
      
      // Stop the stream immediately since we just wanted to request permission
      stream.getTracks().forEach(track => track.stop());
      
    } catch (error: any) {
      console.warn('⚠️ No se pudieron obtener permisos de cámara:', error);
      
      // Handle different types of permission errors
      if (error.name === 'NotAllowedError') {
        console.warn('❌ El usuario denegó el acceso a la cámara');
      } else if (error.name === 'NotFoundError') {
        console.warn('📷 No se encontró ninguna cámara en el dispositivo');
      } else if (error.name === 'NotSupportedError') {
        console.warn('🚫 El navegador no soporta acceso a la cámara');
      } else {
        console.warn('🔧 Error desconocido al acceder a la cámara:', error.message);
      }
    }
  }
}
