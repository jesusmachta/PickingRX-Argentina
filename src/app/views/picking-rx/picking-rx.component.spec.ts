import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { PickingRxComponent } from './picking-rx.component';
import { PickingRxService } from '../../controllers/picking-rx.service';
import { DeliveryNoteStatus } from '../../models/picking-rx.interface';

describe('PickingRxComponent', () => {
  let component: PickingRxComponent;
  let fixture: ComponentFixture<PickingRxComponent>;
  let mockPickingRxService: jasmine.SpyObj<PickingRxService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const pickingRxServiceSpy = jasmine.createSpyObj('PickingRxService', [
      'getPickingRxConfig',
      'getDeliveryNotesByStatus',
      'updateDeliveryNoteStatus',
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [PickingRxComponent],
      providers: [
        { provide: PickingRxService, useValue: pickingRxServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PickingRxComponent);
    component = fixture.componentInstance;
    mockPickingRxService = TestBed.inject(
      PickingRxService
    ) as jasmine.SpyObj<PickingRxService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Setup default mock returns
    mockPickingRxService.getPickingRxConfig.and.returnValue(
      of({
        title: 'Picking RX',
        subtitle: 'Test subtitle',
        statusList: [],
        totalOrders: 0,
      })
    );
    mockPickingRxService.getDeliveryNotesByStatus.and.returnValue(of([]));
    mockPickingRxService.updateDeliveryNoteStatus.and.returnValue(of(true));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load picking rx config on init', () => {
    component.ngOnInit();
    expect(mockPickingRxService.getPickingRxConfig).toHaveBeenCalled();
  });

  it('should navigate back to homepage', () => {
    component.onBackToHomepage();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should get status text in Spanish', () => {
    expect(component.getStatusText(DeliveryNoteStatus.POR_PREPARAR)).toBe(
      'Por Preparar'
    );
    expect(component.getStatusText(DeliveryNoteStatus.PREPARANDO)).toBe(
      'Preparando'
    );
    expect(component.getStatusText(DeliveryNoteStatus.LISTO)).toBe('Listo');
    expect(component.getStatusText(DeliveryNoteStatus.FALTAN_PRODUCTOS)).toBe(
      'Faltan Productos'
    );
  });

  it('should format date correctly', () => {
    const testDate = new Date('2024-09-10T15:30:00');
    const formattedDate = component.formatDate(testDate);
    expect(formattedDate).toContain('10/09/2024');
    expect(formattedDate).toContain('15:30');
  });

  it('should format time correctly', () => {
    const testDate = new Date('2024-09-10T15:30:00');
    const formattedTime = component.formatTime(testDate);
    expect(formattedTime).toBe('15:30');
  });
});
