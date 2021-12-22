import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ModelerComponent} from 'src/app/Presentation/Canvas/modeler.component';
import { MockProvider, MockProviders } from "ng-mocks";
import {ModelerService} from "../../Service/Modeler/modeler.service";
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('ModelerComponent', () => {
  let component: ModelerComponent;
  let fixture: ComponentFixture<ModelerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModelerComponent],
      providers: [
        MockProviders(ModelerService),
        MockProvider(MatDialog),
        MockProvider(MatSnackBar)
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModelerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
