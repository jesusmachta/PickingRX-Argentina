import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  id: string;
  name: string;
  email: string;
  storeId?: number;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class LocalAuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private mockUser: User = {
    id: 'user-001',
    name: 'Juan Pérez',
    email: 'juan.perez@company.com',
    storeId: 1, // Assigned store ID
    role: 'picker'
  };

  constructor() {
    // Initialize with mock user
    this.currentUserSubject.next(this.mockUser);
  }

  // Get current user
  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Get user store ID
  get userStoreId(): number | null {
    return this.currentUser?.storeId || null;
  }

  // Set user (for testing different scenarios)
  setUser(user: User | null): void {
    this.currentUserSubject.next(user);
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  // Get user role
  getUserRole(): string | null {
    return this.currentUser?.role || null;
  }

  // Simulate login with different user types
  loginAsUserWithStore(storeId: number): void {
    const userWithStore: User = {
      id: `user-${storeId}`,
      name: 'Usuario con Tienda',
      email: `user${storeId}@company.com`,
      storeId: storeId,
      role: 'picker'
    };
    this.currentUserSubject.next(userWithStore);
  }

  // Simulate login without store assignment
  loginAsUserWithoutStore(): void {
    const userWithoutStore: User = {
      id: 'user-no-store',
      name: 'Usuario sin Tienda',
      email: 'user@company.com',
      role: 'picker'
      // No storeId - user without assigned store
    };
    this.currentUserSubject.next(userWithoutStore);
  }

  // Logout
  logout(): void {
    this.currentUserSubject.next(null);
  }

  // Get current user as observable
  getCurrentUser(): Observable<User | null> {
    return this.currentUser$;
  }
}
