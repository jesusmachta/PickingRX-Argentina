import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { ScannedItem } from '../../models/scanned-item.interface';
import { FirebaseService } from '../../controllers/firebase.service';
import { OcrService } from '../../controllers/ocr.service';

@Component({
  selector: 'app-document-scanner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './document-scanner.component.html',
  styleUrl: './document-scanner.component.css',
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
    private router: Router,
    private ocrService: OcrService,
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
      const text = await this.ocrService.recognizeText(
        this.selectedImage as string,
        (status: string, progress: number) => {
          this.ocrStatus = status;
          this.ocrProgress = progress;
        }
      );
      
      this.ocrResult = text;
      this.parsedItems = this.parseOcrResult(text);
      this.ocrStatus = 'Processing completed';
    } catch (error) {
      console.error('OCR Error:', error);
      this.ocrResult = `Error during OCR processing: ${error instanceof Error ? error.message : 'Unknown error'}`;
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
      const imageUrl = await this.firebaseService.uploadRemitoImage(
        this.selectedFile
      );
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

  onBackToHomepage(): void {
    this.router.navigate(['/']);
  }

  private parseOcrResult(text: string): ScannedItem[] {
    const items: ScannedItem[] = [];
    const lines = text.split('\n');

    // Find the start and end of the product table
    let startIndex = -1;
    let endIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Look for "Cantidad Producto" header or similar
      if (line.toLowerCase().includes('cantidad') && line.toLowerCase().includes('producto')) {
        startIndex = i + 1;
      }
      
      // Look for end markers
      if (line.toLowerCase().includes('cantidad de unidades') || 
          line.toLowerCase().includes('firma') ||
          line.toLowerCase().includes('aclaracion')) {
        endIndex = i;
        break;
      }
    }

    // If we found the product section, parse it
    if (startIndex > -1) {
      const productLines = endIndex > -1 ? 
        lines.slice(startIndex, endIndex) : 
        lines.slice(startIndex);

      for (const line of productLines) {
        const cleanLine = line.trim();
        if (!cleanLine || cleanLine.length < 10) continue;

        // Enhanced regex to capture product lines with various formats
        // Matches: | quantity | code | description |
        const itemRegex = /^\|?\s*(\d+)\s*\|\s*([0-9]{8,})\s*\|\s*(.*?)\s*(?:\|\s*L[.\s]|$)/;
        
        // Alternative regex for lines without pipes
        const altRegex = /^\s*(\d+)\s+([0-9]{8,})\s+(.*?)(?:\s+L[.\s]|\s*$)/;

        let match = cleanLine.match(itemRegex) || cleanLine.match(altRegex);
        
        if (match) {
          const [, quantity, sku, description] = match;
          
          // Clean up the description by removing trailing codes and extra characters
          let cleanDescription = description
            .replace(/\s+L[.\s]\s*\w+.*$/, '') // Remove trailing L. codes
            .replace(/\s*\|\s*$/, '') // Remove trailing pipes
            .replace(/\s*a»\s*$/, '') // Remove trailing symbols
            .replace(/\s*d\s*$/, '') // Remove trailing letters
            .trim();

          if (cleanDescription && sku.length >= 8) {
            items.push({
              quantity_asked: parseInt(quantity, 10),
              quantity_scanned: 0,
              sku: sku,
              barcode: parseInt(sku, 10) || null,
              description: cleanDescription,
              image: '',
              reporte: '',
            });
          }
        }
      }
    }

    return items;
  }
}
