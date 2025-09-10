import { Routes } from '@angular/router';
import { HomepageComponent } from './views/homepage/homepage.component';
import { PickingRxComponent } from './views/picking-rx/picking-rx.component';
import { DeliveryNoteDetailComponent } from './views/delivery-note-detail/delivery-note-detail.component';

export const routes: Routes = [
  { path: '', component: HomepageComponent },
  { path: 'homepage', component: HomepageComponent },
  { path: 'picking-rx', component: PickingRxComponent },
  { path: 'picking-rx/detail/:id', component: DeliveryNoteDetailComponent },
  { path: '**', redirectTo: '' },
];
