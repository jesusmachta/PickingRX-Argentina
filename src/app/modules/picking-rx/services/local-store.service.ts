import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Store {
  storeid: number;
  store: string;
  city?: string;
  region?: string;
  country?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LocalStoreService {
  private storesSubject = new BehaviorSubject<Store[]>([]);
  public stores$ = this.storesSubject.asObservable();

  private mockStores: Store[] = [
    {
      storeid: 1,
      store: 'Farmacia Central Bogotá',
      city: 'Bogotá',
      region: 'Cundinamarca',
      country: 'Colombia'
    },
    {
      storeid: 2,
      store: 'Farmacia Norte Medellín',
      city: 'Medellín',
      region: 'Antioquia',
      country: 'Colombia'
    },
    {
      storeid: 3,
      store: 'Farmacia Sur Cali',
      city: 'Cali',
      region: 'Valle del Cauca',
      country: 'Colombia'
    },
    {
      storeid: 4,
      store: 'Farmacia Centro Barranquilla',
      city: 'Barranquilla',
      region: 'Atlántico',
      country: 'Colombia'
    },
    {
      storeid: 5,
      store: 'Farmacia Este Cartagena',
      city: 'Cartagena',
      region: 'Bolívar',
      country: 'Colombia'
    }
  ];

  constructor() {
    // Initialize with mock data
    this.storesSubject.next([...this.mockStores]);
  }

  // Get all stores
  getAllStores(): Observable<Store[]> {
    return this.stores$;
  }

  // Get store by ID
  getStoreById(storeId: number): Observable<Store | null> {
    return this.stores$.pipe(
      map(stores => stores.find(store => store.storeid === storeId) || null)
    );
  }

  // Get current stores synchronously
  getCurrentStores(): Store[] {
    return [...this.storesSubject.value];
  }

  // Set custom stores (for testing)
  setStores(stores: Store[]): void {
    this.storesSubject.next([...stores]);
  }

  // Add new store
  addStore(store: Store): void {
    const currentStores = this.storesSubject.value;
    this.storesSubject.next([...currentStores, store]);
  }

  // Update store
  updateStore(storeId: number, updates: Partial<Store>): void {
    const currentStores = this.storesSubject.value;
    const storeIndex = currentStores.findIndex(store => store.storeid === storeId);

    if (storeIndex !== -1) {
      currentStores[storeIndex] = {
        ...currentStores[storeIndex],
        ...updates
      };
      this.storesSubject.next([...currentStores]);
    }
  }

  // Delete store
  deleteStore(storeId: number): void {
    const currentStores = this.storesSubject.value;
    const filteredStores = currentStores.filter(store => store.storeid !== storeId);
    this.storesSubject.next(filteredStores);
  }

  // Get store name by ID (synchronous)
  getStoreNameById(storeId: number): string {
    const store = this.storesSubject.value.find(s => s.storeid === storeId);
    return store ? store.store : `Tienda ${storeId}`;
  }

  // Clear all stores
  clearStores(): void {
    this.storesSubject.next([]);
  }
}
