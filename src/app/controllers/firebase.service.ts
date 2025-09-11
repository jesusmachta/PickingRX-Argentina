import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  setDoc,
  doc,
  Firestore,
  getDoc,
  updateDoc,
  DocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { environment } from '../../environments/environment';
import { ScannedItem } from '../models/scanned-item.interface';
import {
  FirebaseDeliveryNote,
  DeliveryItem,
} from '../models/picking-rx.interface';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private app: FirebaseApp;
  private firestore: Firestore;

  constructor() {
    try {
      this.app = initializeApp(environment.firebaseConfig);
      this.firestore = getFirestore(this.app);

      console.log('🔥 Firebase inicializado correctamente');
      console.log('📋 Proyecto:', environment.firebaseConfig.projectId);
    } catch (error) {
      console.error('🔥 Error inicializando Firebase:', error);
      throw error;
    }
  }


  async saveScannedData(
    items: ScannedItem[]
  ): Promise<string> {
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

  /**
   * Obtiene un documento específico de Remito por su ID
   */
  async getRemitoById(remitoId: string): Promise<FirebaseDeliveryNote | null> {
    try {
      console.log(`🔍 Intentando obtener remito: ${remitoId}`);
      const docRef = doc(this.firestore, 'Remitos', remitoId);
      const docSnap: DocumentSnapshot<DocumentData> = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        // Convertir los datos al formato FirebaseDeliveryNote
        const firebaseNote: FirebaseDeliveryNote = {
          idnota: data['idnota'] || remitoId,
          state: data['state'] || 0,
          items: this.processItemsFromFirebase(data['items'] || []),
        };

        console.log('✅ Remito obtenido desde Firebase:', firebaseNote);
        return firebaseNote;
      } else {
        console.log('❌ No se encontró el documento con ID:', remitoId);
        return null;
      }
    } catch (error: any) {
      console.error('🔥 Error obteniendo documento de Firebase:', error);

      // Verificar si es un error de conectividad
      if (
        error?.code === 'unavailable' ||
        error?.code === 'failed-precondition'
      ) {
        console.warn('🌐 Firebase está offline. Usando modo offline.');
        throw new Error('FIREBASE_OFFLINE');
      }

      throw error;
    }
  }

  /**
   * Actualiza la cantidad escaneada de un item específico
   */
  async updateItemScannedQuantity(
    remitoId: string,
    sku: string,
    newQuantity: number
  ): Promise<boolean> {
    try {
      const docRef = doc(this.firestore, 'Remitos', remitoId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const items = data['items'] || [];

        // Buscar y actualizar el item
        const updatedItems = items.map((item: any) => {
          if (item.sku === sku) {
            return { ...item, quantity_scanned: newQuantity };
          }
          return item;
        });

        // Actualizar el documento en Firebase
        await updateDoc(docRef, {
          items: updatedItems,
          updatedAt: new Date(),
        });

        console.log(
          `Cantidad escaneada actualizada para SKU ${sku}: ${newQuantity}`
        );
        return true;
      } else {
        console.error('Documento no encontrado para actualizar:', remitoId);
        return false;
      }
    } catch (error) {
      console.error('Error actualizando cantidad escaneada:', error);
      return false;
    }
  }

  /**
   * Actualiza el reporte de un item específico
   */
  async updateItemReport(
    remitoId: string,
    sku: string,
    report: string
  ): Promise<boolean> {
    try {
      const docRef = doc(this.firestore, 'Remitos', remitoId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const items = data['items'] || [];

        // Buscar y actualizar el item
        const updatedItems = items.map((item: any) => {
          if (item.sku === sku) {
            return { ...item, reporte: report };
          }
          return item;
        });

        // Actualizar el documento en Firebase
        await updateDoc(docRef, {
          items: updatedItems,
          updatedAt: new Date(),
        });

        console.log(`Reporte actualizado para SKU ${sku}: ${report}`);
        return true;
      } else {
        console.error('Documento no encontrado para actualizar:', remitoId);
        return false;
      }
    } catch (error) {
      console.error('Error actualizando reporte:', error);
      return false;
    }
  }

  /**
   * Actualiza el estado de un remito
   */
  async updateRemitoState(
    remitoId: string,
    newState: number
  ): Promise<boolean> {
    try {
      const docRef = doc(this.firestore, 'Remitos', remitoId);

      await updateDoc(docRef, {
        state: newState,
        updatedAt: new Date(),
      });

      console.log(`Estado del remito ${remitoId} actualizado a: ${newState}`);
      return true;
    } catch (error) {
      console.error('Error actualizando estado del remito:', error);
      return false;
    }
  }

  /**
   * Procesa los items desde Firebase al formato esperado
   */
  private processItemsFromFirebase(firebaseItems: any[]): DeliveryItem[] {
    if (!Array.isArray(firebaseItems)) {
      console.warn('Items no es un array, convirtiendo:', firebaseItems);
      // Si items es un objeto, convertir a array
      if (firebaseItems && typeof firebaseItems === 'object') {
        firebaseItems = Object.values(firebaseItems);
      } else {
        return [];
      }
    }

    return firebaseItems.map((item: any) => ({
      quantity_asked: item.quantity_asked || 0,
      quantity_scanned: item.quantity_scanned || 0,
      sku: item.sku || '',
      barcode: item.barcode || 0,
      description: item.description || '',
      image: item.image || '',
      reporte: item.reporte || '',
    }));
  }
}
