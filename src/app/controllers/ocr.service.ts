import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class OcrService {
  private tesseractLoaded = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  async loadTesseract(): Promise<any> {
    if (!isPlatformBrowser(this.platformId)) {
      throw new Error('OCR is only available in browser environment');
    }

    if (this.tesseractLoaded) {
      return (window as any).Tesseract;
    }

    try {
      // Try multiple import strategies
      let TesseractModule;
      
      try {
        // Strategy 1: Dynamic import
        TesseractModule = await import('tesseract.js');
      } catch (error) {
        console.warn('Dynamic import failed, trying alternative approach:', error);
        
        // Strategy 2: Check if already loaded globally
        if ((window as any).Tesseract) {
          TesseractModule = (window as any).Tesseract;
        } else {
          throw new Error('Tesseract.js could not be loaded');
        }
      }

      // Handle different module export formats
      let Tesseract;
      if (TesseractModule.default && typeof TesseractModule.default.createWorker === 'function') {
        Tesseract = TesseractModule.default;
      } else if (typeof TesseractModule.createWorker === 'function') {
        Tesseract = TesseractModule;
      } else if (TesseractModule.default && TesseractModule.default.default && typeof TesseractModule.default.default.createWorker === 'function') {
        Tesseract = TesseractModule.default.default;
      } else {
        throw new Error('Tesseract.js createWorker function not found');
      }

      this.tesseractLoaded = true;
      (window as any).Tesseract = Tesseract; // Cache globally
      return Tesseract;
    } catch (error) {
      console.error('Failed to load Tesseract.js:', error);
      throw error;
    }
  }

  async recognizeText(
    imageData: string | ArrayBuffer,
    onProgress?: (status: string, progress: number) => void
  ): Promise<string> {
    const Tesseract = await this.loadTesseract();
    
    const worker = await Tesseract.createWorker('eng', 1, {
      logger: (m: any) => {
        if (onProgress) {
          const status = m.status || 'Processing...';
          const progress = m.status === 'recognizing text' && m.progress ? m.progress * 100 : 0;
          onProgress(status, progress);
        }
      },
    });

    try {
      const { data: { text } } = await worker.recognize(imageData);
      return text;
    } finally {
      await worker.terminate();
    }
  }
}
