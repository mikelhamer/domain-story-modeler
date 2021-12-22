import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutosaveSettingsComponent } from './autosave-settings.component';
import { MockProvider, MockService } from 'ng-mocks';
import { AutosaveService } from '../../Service/Autosave/autosave.service';
import { AutosaveStateService } from '../../Service/Autosave/autosave-state.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('AutosaveSettingsComponent', () => {
  let component: AutosaveSettingsComponent;
  let fixture: ComponentFixture<AutosaveSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AutosaveSettingsComponent],
      providers: [
        {
          provide: AutosaveService,
          useValue: MockService(AutosaveService),
        },
        {
          provide: AutosaveStateService,
        },
        MockProvider(MatDialog),
        MockProvider(MatSnackBar)

      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AutosaveSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
