import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, collection, setDoc, doc, Firestore } from 'firebase/firestore';
import { environment } from '../../environments/environment';
import { ScannedItem } from '../models/scanned-item.interface';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app: FirebaseApp;
  private firestore: Firestore;

  constructor() {
    this.app = initializeApp(environment.firebaseConfig);
    this.firestore = getFirestore(this.app);
  }


  async saveScannedData(imageUrl: string, items: ScannedItem[]): Promise<string> {
    try {
      const timestamp = new Date();
      const idnota = `REM_${timestamp.getTime()}`;
      
      const remitoData = {
        idnota,
        state: 0, // 0 = Uploaded/Initial state
        items,
        totalItems: items.length,
        totalQuantity: items.reduce((total, item) => total + item.quantity_asked, 0),
        createdAt: timestamp,
        updatedAt: timestamp,
        processed: false,
        hasImage: false // No image stored
      };

      // Use setDoc with the idnota as the document ID
      await setDoc(doc(this.firestore, 'Remitos', idnota), remitoData);
      console.log('Remito saved with ID:', idnota);
      return idnota;
    } catch (error) {
      console.error("Error writing document: ", error);
      throw error;
    }
  }
}
