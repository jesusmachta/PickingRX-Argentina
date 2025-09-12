import { Routes } from '@angular/router';
import { HomepageComponent } from './views/homepage/homepage.component';
import { PickingArgComponent } from './views/picking-arg/picking-arg.component';
import { DeliveryNoteDetailComponent } from './views/delivery-note-detail/delivery-note-detail.component';
import { DeliveryNoteDetailScannerComponent } from './views/delivery-note-detail-scanner/delivery-note-detail-scanner.component';
import { DocumentScannerComponent } from './views/document-scanner/document-scanner.component';

export const routes: Routes = [
  { path: '', component: HomepageComponent },
  { path: 'homepage', component: HomepageComponent },
  { path: 'picking-arg', component: PickingArgComponent },
  { path: 'picking-arg/detail/:id', component: DeliveryNoteDetailComponent },
  { path: 'picking-arg/scanner/:id', component: DeliveryNoteDetailScannerComponent },
  { path: 'document-scanner', component: DocumentScannerComponent },
  { path: '**', redirectTo: '' },
];
