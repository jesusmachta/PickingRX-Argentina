import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { ScannedItem } from '../../models/scanned-item.interface';
import { FirebaseService } from '../../controllers/firebase.service';
import { OcrService } from '../../controllers/ocr.service';
import { GeminiService } from '../../controllers/gemini.service';

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
    private geminiService: GeminiService,
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
    this.ocrStatus = 'Inicializando...';

    try {
      const text = await this.ocrService.recognizeText(
        this.selectedImage as string,
        (status: string, progress: number) => {
          this.ocrStatus = status;
          this.ocrProgress = progress;
        }
      );
      
      this.ocrResult = text;
      this.ocrStatus = 'Analizando con IA...';
      
      // Use Gemini API to parse the OCR text
      this.ocrProgress = 90; // OCR completed, starting AI parsing
      this.geminiService.parseOcrText(text).subscribe({
        next: (parsedItems) => {
          this.parsedItems = parsedItems;
          this.ocrStatus = 'Análisis completado';
          this.ocrProgress = 100;
          
          // Complete the loading after a brief delay to show 100%
          setTimeout(() => {
            this.ocrInProgress = false;
          }, 500);
        },
        error: (error) => {
          console.error('Gemini parsing error:', error);
          this.ocrStatus = 'Error en IA, usando método alternativo';
          this.ocrProgress = 95;
          
          // Fallback to regex parsing if Gemini fails
          this.parsedItems = this.parseOcrResult(text);
          this.ocrProgress = 100;
          
          setTimeout(() => {
            this.ocrInProgress = false;
          }, 500);
        }
      });
    } catch (error) {
      console.error('OCR Error:', error);
      this.ocrResult = `Error during OCR processing: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.ocrInProgress = false;
    }
  }

  async onConfirmAndSave(): Promise<void> {
    if (!this.parsedItems) {
      return;
    }

    this.uploadInProgress = true;
    try {
      // Save remito data to Firestore without image
      const documentId = await this.firebaseService.saveScannedData('no_image', this.parsedItems);
      
      this.uploadSuccess = true;
      console.log('Remito guardado exitosamente con ID:', documentId);
      
      // Redirect back to homepage after successful save
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 1500); // Show success message for 1.5 seconds before redirecting
      
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Error al guardar el remito. Por favor, intenta nuevamente.');
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

  updateItemQuantity(index: number, event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value, 10);
    if (this.parsedItems && !isNaN(value) && value >= 0) {
      this.parsedItems[index].quantity_asked = value;
    }
  }

  updateItemSku(index: number, event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.parsedItems) {
      this.parsedItems[index].sku = target.value;
      this.parsedItems[index].barcode = parseInt(target.value, 10) || null;
    }
  }

  updateItemDescription(index: number, event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.parsedItems) {
      this.parsedItems[index].description = target.value;
    }
  }

  removeItem(index: number): void {
    if (this.parsedItems) {
      this.parsedItems.splice(index, 1);
    }
  }

  addNewItem(): void {
    if (this.parsedItems) {
      this.parsedItems.push({
        quantity_asked: 1,
        quantity_scanned: 0,
        sku: '',
        barcode: null,
        description: '',
        image: '',
        reporte: '',
      });
    }
  }

  getTotalQuantity(): number {
    if (!this.parsedItems) return 0;
    return this.parsedItems.reduce((total, item) => total + item.quantity_asked, 0);
  }

  private parseOcrResult(text: string): ScannedItem[] {
    // 1. Pre-process entire text
    const cleanedText = this.preprocessOcrText(text);
    
    // 2. Find product section boundaries
    const productSection = this.extractProductSection(cleanedText);
    
    // 3. Clean and normalize each line
    const cleanLines = this.normalizeProductLines(productSection);
    
    // 4. Parse with flexible regex
    const items = this.parseProductLines(cleanLines);
    
    // 5. Post-process and validate items
    return this.validateAndCleanItems(items);
  }

  private preprocessOcrText(text: string): string {
    return text
      // Fix common OCR character mistakes
      .replace(/[|¡!1Il]/g, '|') // Normalize pipe characters
      .replace(/[oO0]/g, '0') // Normalize zeros in numbers
      .replace(/[Il1]/g, '1') // Normalize ones
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\|\s*\|\s*/g, '| ') // Fix double pipes
      .replace(/\|\s*$/, '') // Remove trailing pipes
      .trim();
  }

  private extractProductSection(text: string): string[] {
    const lines = text.split('\n');
    let startIndex = -1;
    let endIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase().trim();
      
      // Look for product table start markers - updated patterns
      if ((line.includes('cantidad') && line.includes('producto')) ||
          (line.includes('cantidad') && line.includes('pr0duct0')) || // OCR might read 'o' as '0'
          line.includes('| cantidad |') ||
          (line.includes('cant') && line.includes('prod'))) {
        startIndex = i + 1;
      }
      
      // Look for end markers
      if (line.includes('cantidad de unidades') || 
          line.includes('cant|dad de un|dades') || // OCR version
          line.includes('total') ||
          line.includes('firma') ||
          line.includes('aclaracion') ||
          line.includes('acraci0n') || // OCR version
          line.includes('original blanco')) {
        endIndex = i;
        break;
      }
    }

    if (startIndex === -1) {
      // Fallback: look for lines that start with numbers and contain pipe characters
      const productLines = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // Look for lines that match product pattern: number | long_number | text
        if (this.looksLikeProductLine(line)) {
          productLines.push(line);
        }
      }
      
      return productLines;
    }
    
    return endIndex > -1 ? 
      lines.slice(startIndex, endIndex) : 
      lines.slice(startIndex);
  }

  private looksLikeProductLine(line: string): boolean {
    // Check if line looks like: number | long_code | description
    const patterns = [
      /^\s*\|\s*\d+\s*\|\s*\d{8,}\s*\|/, // | qty | code |
      /^\s*\d+\s*\|\s*\d{8,}\s*\|/, // qty | code |
      /^\s*\d+\s*\|\s*[47]\d{7,}\s*\|/, // qty | barcode starting with 4 or 7 |
    ];
    
    return patterns.some(pattern => pattern.test(line));
  }

  private normalizeProductLines(lines: string[]): string[] {
    return lines
      .map(line => line.trim())
      .filter(line => {
        // Filter out empty lines and non-product lines
        if (!line || line.length < 5) return false;
        
        // Skip lines that are clearly not products
        const lowerLine = line.toLowerCase();
        if (lowerLine.includes('subtotal') ||
            lowerLine.includes('total') ||
            lowerLine.includes('descuento') ||
            lowerLine.includes('impuesto') ||
            lowerLine.includes('---') ||
            lowerLine.includes('===')) {
          return false;
        }
        
        return true;
      })
      .map(line => {
        // Clean up each line
        return line
          .replace(/^\|+\s*/, '') // Remove leading pipes
          .replace(/\s*\|+$/, '') // Remove trailing pipes
          .replace(/\|\s*\|\s*/g, '| ') // Fix multiple consecutive pipes
          .replace(/\s+/g, ' ') // Normalize spaces
          .trim();
      });
  }

  private parseProductLines(lines: string[]): any[] {
    const items: any[] = [];

    for (const line of lines) {
      const parsed = this.parseProductLine(line);
      if (parsed) {
        items.push(parsed);
      }
    }

    return items;
  }

  private parseProductLine(line: string): any | null {
    // Multiple regex patterns to handle different OCR formats
    const patterns = [
      // Pattern 1: | qty | sku | description
      /^\|?\s*(\d+)\s*\|\s*([0-9]{8,})\s*\|\s*(.*?)$/,
      
      // Pattern 2: qty | sku | description (no leading pipe)
      /^(\d+)\s*\|\s*([0-9]{8,})\s*\|\s*(.*?)$/,
      
      // Pattern 3: | | qty | sku | description (double pipe start)
      /^\|\s*\|\s*(\d+)\s*\|\s*([0-9]{8,})\s*\|\s*(.*?)$/,
      
      // Pattern 4: qty sku description (space separated)
      /^(\d+)\s+([0-9]{8,})\s+(.*?)$/,
      
      // Pattern 5: | qty sku description (mixed format)
      /^\|?\s*(\d+)\s+([0-9]{8,})\s+(.*?)$/,
      
      // Pattern 6: | sku | description (quantity might be missing or at end)
      /^\|?\s*([0-9]{8,})\s*\|\s*(.*?)$/,
      
      // Pattern 7: Handle lines where quantity is 1 and might be missing
      /^\|?\s*([47][0-9]{7,})\s*\|\s*(.*?)$/
    ];

    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      const match = line.match(pattern);
      if (match) {
        let quantity, sku, description;
        
        if (match.length === 4) {
          // Standard 3-group match: qty, sku, description
          [, quantity, sku, description] = match;
        } else if (match.length === 3) {
          // 2-group match: sku, description (assume quantity = 1)
          [, sku, description] = match;
          quantity = '1';
        }
        
        // Validate extracted data
        if (!quantity || !sku || !description) {
          continue;
        }
        
        const qty = parseInt(quantity, 10);
        if (isNaN(qty) || qty <= 0 || qty > 999) {
          continue;
        }
        if (sku.length < 8 || sku.length > 15) {
          continue;
        }
        if (description.trim().length < 3) {
          continue;
        }

        return {
          quantity: qty,
          sku: sku.trim(),
          description: description.trim()
        };
      }
    }

    return null;
  }

  private validateAndCleanItems(items: any[]): ScannedItem[] {
    return items
      .filter(item => item && item.quantity && item.sku && item.description)
      .map(item => {
        // Clean up description
        let cleanDescription = this.cleanDescription(item.description);
        
        return {
          quantity_asked: item.quantity,
          quantity_scanned: 0,
          sku: item.sku,
          barcode: parseInt(item.sku, 10) || null,
          description: cleanDescription,
          image: '',
          reporte: '',
        };
      })
      .filter(item => item.description.length > 0); // Final filter for valid descriptions
  }

  private cleanDescription(description: string): string {
    return description
      // Remove trailing product codes and dates
      .replace(/\s+L[.\s]\s*[A-Z0-9]+.*$/i, '')
      .replace(/\s*L\s*[A-Z0-9:-]+.*$/i, '')
      .replace(/\s*-\s*Vt[o0][\s.:]*\d+\/\d+.*$/i, '')
      .replace(/\s*Vt[o0][\s.:]*\d+\/\d+.*$/i, '')
      
      // Remove trailing symbols and artifacts
      .replace(/\s*[|]+\s*$/, '')
      .replace(/\s*[a»d]+\s*$/, '')
      .replace(/\s*[.,:;-]+\s*$/, '')
      
      // Clean up common OCR mistakes in descriptions
      .replace(/\s+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between camelCase
      
      // Fix common word breaks
      .replace(/\bNU\s+ENDURECED\b/gi, 'NU ENDURECED')
      .replace(/\bEXTRA\s+BRILLO\b/gi, 'EXTRA BRILLO')
      .replace(/\bLIP\s+LIFTER\b/gi, 'LIP LIFTER')
      
      .trim();
  }
}
