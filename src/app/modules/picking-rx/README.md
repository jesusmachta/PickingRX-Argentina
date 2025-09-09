# Local Picking RX Component - Copy to New Project

This is a **Firebase-independent** version of the Picking RX component that can be easily copied to any new Angular project.

## 🚀 Quick Start

### Step 1: Copy Files to New Project

Copy the following directory structure to your new project:

```
your-new-project/
├── src/
│   └── app/
│       ├── shared/
│       │   └── modules/
│       │       └── picking-rx/
│       │           ├── components/
│       │           │   ├── local-picking-rx/
│       │           │   │   ├── local-picking-rx.component.ts
│       │           │   │   └── local-picking-rx.component.html
│       │           │   └── demo/
│       │           │       └── demo.component.ts
│       │           ├── models/
│       │           │   └── picking-rx.interface.ts
│       │           ├── services/
│       │           │   ├── local-picking-rx.service.ts
│       │           │   ├── local-notification.service.ts
│       │           │   ├── local-auth.service.ts
│       │           │   └── local-store.service.ts
│       │           ├── picking-rx.module.ts
│       │           ├── index.ts
│       │           └── README.md
```

### Step 2: Install Dependencies

Make sure your new project has these dependencies:

```bash
npm install @angular/core @angular/common @angular/forms @angular/router
npm install @angular/material @angular/material-moment-adapter
npm install rxjs
```

### Step 3: Import Module

In your `app.module.ts`:

```typescript
import { PickingRxModule } from './shared/modules/picking-rx';

@NgModule({
  imports: [
    // ... other imports
    PickingRxModule
  ],
  // ...
})
export class AppModule { }
```

### Step 4: Use the Component

In any component template:

```html
<!-- Basic usage -->
<app-local-picking-rx></app-local-picking-rx>

<!-- With custom configuration -->
<app-local-picking-rx
  [showHeader]="true"
  [showNotifications]="true"
  [customTitle]="'Mi Sistema de Picking'"
  [allowOrderNavigation]="false">
</app-local-picking-rx>

<!-- Demo component with controls -->
<app-picking-rx-demo></app-picking-rx-demo>
```

## 📋 Component Features

### ✅ What's Included
- ✅ **No Firebase Dependencies** - Pure local data management
- ✅ **Store Selection Removed** - Global order list
- ✅ **Local Data Storage** - RxJS BehaviorSubject for state management
- ✅ **Mock Data** - Sample orders for testing
- ✅ **Notifications** - Local notification system
- ✅ **Responsive Design** - Mobile and desktop friendly
- ✅ **Order Management** - Mark as prepared, view details
- ✅ **TypeScript Support** - Full type safety

### 🎛️ Component Inputs

```typescript
@Input() showHeader = true;           // Show/hide header section
@Input() showNotifications = true;    // Enable/disable notifications
@Input() allowOrderNavigation = true; // Allow navigation to order details
@Input() customTitle = 'Picking RX';  // Custom title for the component
```

### 🔧 Public Methods

```typescript
// Refresh orders from service
refreshOrders(): void

// Add new order
addNewOrder(order: PickingRX): void

// Set custom order list
setOrders(orders: PickingRX[]): void

// Get current orders
getCurrentOrders(): PickingRX[]

// Clear all orders
clearAllOrders(): void
```

## 🏗️ Architecture

### Services

#### LocalPickingRxService
- Manages order data using RxJS BehaviorSubject
- Provides CRUD operations for orders
- Observable-based data flow

#### LocalNotificationService
- Simple notification system (console-based)
- No browser permission requirements
- Easy to extend with toast notifications

#### LocalAuthService
- Mock authentication service
- Simulates different user scenarios
- Easy to replace with real auth

#### LocalStoreService
- Mock store data management
- Provides store information
- Observable-based store data

### Models

#### PickingRX Interface
```typescript
interface PickingRX {
  id?: string;
  city?: string;
  country?: string;
  date: Date;
  idOrden: string;
  itemRxString: string;
  itemRX: ItemRX[];
  state: number; // 0: Pendiente, 1: Preparado, 2: Facturada, 3: Cancelada
  storeId?: number;
  preparedDate?: Date;
  deliveryDate?: Date;
  preparedWithOpportunity?: boolean;
}
```

## 🎮 Demo Component

Use `<app-picking-rx-demo>` for testing:

```html
<app-picking-rx-demo></app-picking-rx-demo>
```

**Demo Features:**
- Switch between user types
- Add sample orders
- Clear all orders
- Real-time testing

## 🛠️ Customization

### Customizing Mock Data

Edit `local-picking-rx.service.ts`:

```typescript
private mockOrders: PickingRX[] = [
  // Your custom mock data here
];
```

### Customizing Notifications

Extend `local-notification.service.ts`:

```typescript
showSuccessNotification(message: string): void {
  // Add your notification library here
  // this.toastService.success(message);
}
```

### Customizing Auth

Modify `local-auth.service.ts`:

```typescript
private mockUser: User = {
  // Your custom user data
};
```

## 🔄 Data Flow

```
Component → Service → BehaviorSubject → Observable → Component
    ↑                                                        ↓
    └─────────────────── Subscriptions ──────────────────────┘
```

## 📱 Responsive Design

- **Mobile**: Single column layout
- **Tablet**: Optimized spacing
- **Desktop**: Multi-column layout with expanded features

## 🎨 Styling

Uses Tailwind CSS classes:
- Responsive grid system
- Color-coded order states
- Hover effects and transitions
- Material Design integration

## 🚦 State Management

Orders have 4 states:
- `0` - **PENDIENTE** (Pending) - Red theme
- `1` - **PREPARADO** (Prepared) - Yellow theme
- `2` - **FACTURADA** (Invoiced) - Green theme
- `3` - **CANCELADA** (Cancelled) - Gray theme

## 🔧 Integration Examples

### With Real API

Replace the service methods:

```typescript
// In your service
markAsPrepared(orderId: string): Promise<void> {
  return this.http.post(`/api/orders/${orderId}/prepare`, {}).toPromise();
}
```

### With Real Authentication

```typescript
// In auth service
get userStoreId(): number | null {
  return this.auth.currentUser?.storeId || null;
}
```

### With Real Notifications

```typescript
// In notification service
showNewOrderNotification(count: number): void {
  this.snackBar.open(`New orders: ${count}`, 'Close', {
    duration: 3000
  });
}
```

## 📋 Checklist for New Project

- [ ] Copy all files from `picking-rx` directory
- [ ] Install Angular Material dependencies
- [ ] Add module to app.module.ts
- [ ] Configure routing if needed
- [ ] Test component functionality
- [ ] Customize mock data
- [ ] Integrate with your data sources

## 🐛 Troubleshooting

### Common Issues

1. **Module not found**: Make sure all imports are correct
2. **Styles not working**: Ensure Tailwind CSS is configured
3. **Material icons not showing**: Add Material Icons font to index.html

### Debug Mode

Enable console logging in services for debugging:

```typescript
// In any service
console.log('Debug:', data);
```

## 📄 License

This component is designed to be copied and modified freely for your projects.
