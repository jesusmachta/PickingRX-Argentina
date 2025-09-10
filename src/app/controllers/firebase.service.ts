import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  Firestore,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { environment } from '../../environments/environment';
import { ScannedItem } from '../models/scanned-item.interface';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private app: FirebaseApp;
  private firestore: Firestore;
  private storage: any;

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

  async saveScannedData(imageUrl: string, items: ScannedItem[]): Promise<void> {
    try {
      // NOTE: Using a placeholder for idnota as its origin is not specified.
      const remitoData = {
        idnota: `ID_${new Date().getTime()}`,
        state: 1,
        items,
        imageUrl,
        createdAt: new Date(),
      };

      await addDoc(collection(this.firestore, 'remitos'), remitoData);
    } catch (error) {
      console.error('Error writing document: ', error);
    }
  }
}
