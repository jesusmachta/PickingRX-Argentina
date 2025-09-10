import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ScannedItem } from '../../models/scanned-item.interface';
import { FirebaseService } from '../../controllers/firebase.service';

@Component({
  selector: 'app-document-scanner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './document-scanner.component.html',
  styleUrl: './document-scanner.component.css'
})
export class DocumentScannerComponent {
  selectedImage: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;
  ocrResult: string | null = null;
  parsedItems: ScannedItem[] | null = null;
  ocrInProgress = false;
  ocrProgress = 0;
  ocrStatus = '';
  uploadInProgress = false;
  uploadSuccess = false;

  constructor(
    private firebaseService: FirebaseService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.selectedImage = e.target?.result || null;
        // Automatically run OCR after image is loaded
        if (this.selectedImage) {
          setTimeout(() => this.recognizeImage(), 500);
        }
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  async recognizeImage(): Promise<void> {
    if (!this.selectedImage || !isPlatformBrowser(this.platformId)) {
      return;
    }

    this.ocrInProgress = true;
    this.ocrResult = null;
    this.parsedItems = null;
    this.uploadSuccess = false;
    this.ocrProgress = 0;
    this.ocrStatus = 'Initializing...';

    try {
      // Dynamically import Tesseract.js only on the client side
      const Tesseract = await import('tesseract.js');
      
      const worker = await Tesseract.createWorker('eng', 1, {
        logger: (m: any) => {
          this.ocrStatus = m.status;
          if (m.status === 'recognizing text') {
            this.ocrProgress = m.progress * 100;
          }
        },
      });

      const {
        data: { text },
      } = await worker.recognize(this.selectedImage as string);
      this.ocrResult = text;
      this.parsedItems = this.parseOcrResult(text);
      
      await worker.terminate();
    } catch (error) {
      console.error('OCR Error:', error);
      this.ocrResult = 'Error during OCR processing.';
    } finally {
      this.ocrInProgress = false;
    }
  }

  async onConfirmAndSave(): Promise<void> {
    if (!this.selectedFile || !this.parsedItems) {
      return;
    }

    this.uploadInProgress = true;
    try {
      const imageUrl = await this.firebaseService.uploadRemitoImage(this.selectedFile);
      await this.firebaseService.saveScannedData(imageUrl, this.parsedItems);
      this.uploadSuccess = true;
    } catch (error) {
      console.error('Error saving data:', error);
    } finally {
      this.uploadInProgress = false;
    }
  }

  resetScanner(): void {
    this.selectedImage = null;
    this.selectedFile = null;
    this.ocrResult = null;
    this.parsedItems = null;
    this.ocrInProgress = false;
    this.ocrProgress = 0;
    this.ocrStatus = '';
    this.uploadInProgress = false;
    this.uploadSuccess = false;
  }

  private parseOcrResult(text: string): ScannedItem[] {
    const items: ScannedItem[] = [];
    const lines = text.split('\n');

    const itemRegex = /^\s*\+?(\d+)\s+(\d{10,})\s+(.*?)(?:\s+L\.\s\w{2,}|-|\s*$)/;

    for (const line of lines) {
      const match = line.match(itemRegex);
      if (match) {
        const [, quantity, sku, description] = match;
        items.push({
          quantity_asked: parseInt(quantity, 10),
          quantity_scanned: 0,
          sku,
          barcode: parseInt(sku, 10) || null,
          description: description.trim(),
          image: '',
          reporte: ''
        });
      }
    }

    return items;
  }
}
