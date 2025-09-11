import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveryNoteDetailScannerComponent } from './delivery-note-detail-scanner.component';

describe('DeliveryNoteDetailScannerComponent', () => {
  let component: DeliveryNoteDetailScannerComponent;
  let fixture: ComponentFixture<DeliveryNoteDetailScannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeliveryNoteDetailScannerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DeliveryNoteDetailScannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
