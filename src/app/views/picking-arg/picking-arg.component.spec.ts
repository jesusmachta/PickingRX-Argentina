import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { PickingArgComponent } from './picking-arg.component';
import { PickingArgService } from '../../controllers/picking-arg.service';
import { DeliveryNoteStatus } from '../../models/picking-arg.interface';

describe('PickingArgComponent', () => {
  let component: PickingArgComponent;
  let fixture: ComponentFixture<PickingArgComponent>;
  let mockPickingArgService: jasmine.SpyObj<PickingArgService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const pickingArgServiceSpy = jasmine.createSpyObj('PickingArgService', [
      'getPickingArgConfig',
      'getDeliveryNotesByStatus',
      'updateDeliveryNoteStatus',
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [PickingArgComponent],
      providers: [
        { provide: PickingArgService, useValue: pickingArgServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PickingArgComponent);
    component = fixture.componentInstance;
    mockPickingArgService = TestBed.inject(
      PickingArgService
    ) as jasmine.SpyObj<PickingArgService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Setup default mock returns
    mockPickingArgService.getPickingArgConfig.and.returnValue(
      of({
        title: 'Picking ARG',
        subtitle: 'Test subtitle',
        statusList: [],
        totalOrders: 0,
      })
    );
    mockPickingArgService.getDeliveryNotesByStatus.and.returnValue(of([]));
    mockPickingArgService.updateDeliveryNoteStatus.and.returnValue(of(true));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load picking arg config on init', () => {
    component.ngOnInit();
    expect(mockPickingArgService.getPickingArgConfig).toHaveBeenCalled();
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
