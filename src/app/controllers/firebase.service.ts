import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, setDoc, doc, Firestore } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { environment } from '../../environments/environment';
import { ScannedItem } from '../models/scanned-item.interface';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private app: FirebaseApp;
  private firestore: Firestore;
  private storage;

  constructor() {
    this.app = initializeApp(environment.firebaseConfig);
    this.firestore = getFirestore(this.app);
    this.storage = getStorage(this.app);
  }

  async uploadRemitoImage(file: File): Promise<string> {
    const storageRef = ref(
      this.storage,
      `remitos/${new Date().getTime()}_${file.name}`
    );
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
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
        totalQuantity: items.reduce(
          (total, item) => total + item.quantity_asked,
          0
        ),
        createdAt: timestamp,
        updatedAt: timestamp,
        processed: false,
        hasImage: !!imageUrl,
        imageUrl,
      };

      // Use idnota as the document ID
      await setDoc(doc(this.firestore, 'Remitos', idnota), remitoData);
      console.log('Remito saved with ID:', idnota);
      return idnota;
    } catch (error) {
      console.error('Error writing document: ', error);
      throw error;
    }
  }
}

