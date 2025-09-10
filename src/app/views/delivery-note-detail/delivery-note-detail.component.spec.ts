import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { DeliveryNoteDetailComponent } from './delivery-note-detail.component';
import { DeliveryNoteDetailService } from '../../controllers/delivery-note-detail.service';
import { DeliveryNoteStatus } from '../../models/picking-rx.interface';

describe('DeliveryNoteDetailComponent', () => {
  let component: DeliveryNoteDetailComponent;
  let fixture: ComponentFixture<DeliveryNoteDetailComponent>;
  let mockDetailService: jasmine.SpyObj<DeliveryNoteDetailService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    const detailServiceSpy = jasmine.createSpyObj('DeliveryNoteDetailService', [
      'getDeliveryNoteDetailConfig',
      'scanBarcode',
      'reportProductIssue',
      'updateNoteStatus',
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    mockActivatedRoute = {
      params: of({ id: 'test-note-id' }),
    };

    await TestBed.configureTestingModule({
      imports: [DeliveryNoteDetailComponent],
      providers: [
        { provide: DeliveryNoteDetailService, useValue: detailServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DeliveryNoteDetailComponent);
    component = fixture.componentInstance;
    mockDetailService = TestBed.inject(
      DeliveryNoteDetailService
    ) as jasmine.SpyObj<DeliveryNoteDetailService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Setup default mock returns
    mockDetailService.getDeliveryNoteDetailConfig.and.returnValue(
      of({
        note: {
          id: 'test-note-id',
          orderNumber: 'test-note-id',
          status: DeliveryNoteStatus.PREPARANDO,
          items: [],
          totalItems: 0,
          scannedItems: 0,
          progressPercentage: 0,
        },
        canScan: true,
        canUpdateStatus: true,
        canReport: true,
      })
    );

    mockDetailService.scanBarcode.and.returnValue(
      of({
        success: true,
        scannedCode: 'test-code',
        message: 'Test success',
      })
    );

    mockDetailService.reportProductIssue.and.returnValue(of(true));
    mockDetailService.updateNoteStatus.and.returnValue(of(true));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load delivery note detail on init', () => {
    component.ngOnInit();
    expect(mockDetailService.getDeliveryNoteDetailConfig).toHaveBeenCalledWith(
      'test-note-id'
    );
  });

  it('should navigate back to list', () => {
    component.onBackToList();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/picking-rx']);
  });

  it('should get correct item status class', () => {
    const reportedItem = {
      quantity_asked: 1,
      quantity_scanned: 0,
      sku: 'test',
      barcode: 123,
      description: 'test',
      image: 'test',
      reporte: 'Some issue',
    };

    expect(component.getItemStatusClass(reportedItem)).toBe('item-reported');

    const completedItem = { ...reportedItem, reporte: '', quantity_scanned: 1 };
    expect(component.getItemStatusClass(completedItem)).toBe('item-completed');

    const partialItem = {
      ...reportedItem,
      reporte: '',
      quantity_scanned: 0,
      quantity_asked: 2,
    };
    partialItem.quantity_scanned = 1;
    expect(component.getItemStatusClass(partialItem)).toBe('item-partial');

    const pendingItem = { ...reportedItem, reporte: '', quantity_scanned: 0 };
    expect(component.getItemStatusClass(pendingItem)).toBe('item-pending');
  });

  it('should handle scan barcode', () => {
    component.config = {
      note: {
        id: 'test-note-id',
        orderNumber: 'test-note-id',
        status: DeliveryNoteStatus.PREPARANDO,
        items: [],
        totalItems: 0,
        scannedItems: 0,
        progressPercentage: 0,
      },
      canScan: true,
      canUpdateStatus: true,
      canReport: true,
    };

    component.scanInputValue = 'test-barcode';
    component.onScanBarcode();

    expect(mockDetailService.scanBarcode).toHaveBeenCalledWith(
      'test-note-id',
      'test-barcode'
    );
  });
});
