import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ScannedItem } from '../models/scanned-item.interface';

export interface GeminiParseResponse {
  products: Array<{
    quantity: number;
    sku: string;
    description: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private readonly apiUrl = environment.geminiConfig.apiUrl;
  private readonly apiKey = environment.geminiConfig.apiKey;

  constructor(private http: HttpClient) {}

  parseOcrText(ocrText: string): Observable<ScannedItem[]> {
    const prompt = this.createParsingPrompt(ocrText);
    
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
        responseMimeType: "application/json"
      }
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const url = `${this.apiUrl}?key=${this.apiKey}`;

    return this.http.post<any>(url, requestBody, { headers }).pipe(
      map(response => this.processGeminiResponse(response)),
      catchError(error => {
        console.error('Gemini API Error:', error);
        return throwError(() => new Error('Failed to parse OCR text with Gemini API'));
      })
    );
  }

  parsePdfDocument(base64Pdf: string): Observable<ScannedItem[]> {
    const prompt = this.createPdfParsingPrompt();
    
    const requestBody = {
      contents: [{
        parts: [
          {
            text: prompt
          },
          {
            inline_data: {
              mime_type: "application/pdf",
              data: base64Pdf
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
        responseMimeType: "application/json"
      }
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const url = `${this.apiUrl}?key=${this.apiKey}`;

    return this.http.post<any>(url, requestBody, { headers }).pipe(
      map(response => this.processGeminiResponse(response)),
      catchError(error => {
        console.error('Gemini PDF API Error:', error);
        return throwError(() => new Error('Failed to parse PDF with Gemini API'));
      })
    );
  }

  private createParsingPrompt(ocrText: string): string {
    return `
Analyze the following OCR-extracted text from a delivery note (remito) and extract product information.

OCR Text:
${ocrText}

Please extract all products and return them in the following JSON format:
{
  "products": [
    {
      "quantity": number,
      "sku": "string (product code/barcode, usually 8-15 digits)",
      "description": "string (clean product name without codes or expiration dates)"
    }
  ]
}

Instructions:
1. Look for lines that contain product information (usually with quantity, product code, and description)
2. Extract the quantity (number at the beginning of product lines)
3. Extract the SKU/barcode (long numeric codes, typically 8-15 digits)
4. Extract and clean the product description (remove expiration dates, batch codes, and extra symbols)
5. If quantity is missing, assume it's 1
6. Only include actual products, skip headers, totals, and non-product lines
7. Clean up OCR artifacts (like | symbols, extra spaces, etc.)

Return only the JSON object, no additional text.
`;
  }

  private createPdfParsingPrompt(): string {
    return `
Analyze the provided PDF document which contains a delivery note (remito) and extract product information.

Please extract all products and return them in the following JSON format:
{
  "products": [
    {
      "quantity": number,
      "sku": "string (product code/barcode, usually 8-15 digits)",
      "description": "string (clean product name without codes or expiration dates)"
    }
  ]
}

Instructions:
1. Look for product tables or lists in the PDF document
2. Extract the quantity (number of units for each product)
3. Extract the SKU/barcode (long numeric codes, typically 8-15 digits)
4. Extract and clean the product description (remove expiration dates, batch codes, and extra symbols)
5. If quantity is missing, assume it's 1
6. Only include actual products, skip headers, totals, and non-product lines
7. Clean up any formatting artifacts from the PDF

Return only the JSON object, no additional text.
`;
  }

  private processGeminiResponse(response: any): ScannedItem[] {
    try {
      if (!response.candidates || !response.candidates[0] || !response.candidates[0].content) {
        throw new Error('Invalid response structure from Gemini API');
      }

      const content = response.candidates[0].content.parts[0].text;
      const parsedData: GeminiParseResponse = JSON.parse(content);
      
      if (!parsedData.products || !Array.isArray(parsedData.products)) {
        throw new Error('Invalid products array in Gemini response');
      }

      return parsedData.products.map(product => ({
        quantity_asked: product.quantity || 1,
        quantity_scanned: 0,
        sku: product.sku || '',
        barcode: this.extractNumericBarcode(product.sku),
        description: product.description || '',
        image: '',
        reporte: ''
      }));
      
    } catch (error) {
      console.error('Error processing Gemini response:', error);
      throw new Error('Failed to process Gemini API response');
    }
  }

  private extractNumericBarcode(sku: string): number | null {
    if (!sku) return null;
    const numericSku = sku.replace(/\D/g, '');
    const parsed = parseInt(numericSku, 10);
    return isNaN(parsed) ? null : parsed;
  }
}
