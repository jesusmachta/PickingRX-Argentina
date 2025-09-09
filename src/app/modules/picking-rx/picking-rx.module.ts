import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Angular Material Modules
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

// Components
import { PickingRxComponent } from '../../../features/deliveries/components/picking-rx/picking-rx.component';
import { LocalPickingRxComponent } from './components/local-picking-rx/local-picking-rx.component';

// Pipes
import { FormatFsDatePipe } from '../../pipes/format-fs-date';

@NgModule({
  declarations: [
    PickingRxComponent,
    LocalPickingRxComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    FormatFsDatePipe
  ],
  exports: [
    PickingRxComponent,
    LocalPickingRxComponent
  ]
})
export class PickingRxModule { }
