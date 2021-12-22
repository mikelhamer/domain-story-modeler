import { Component, OnDestroy, OnInit } from '@angular/core';
import {ModelerService} from '../../Service/Modeler/modeler.service';
import { Subscription } from 'rxjs';
import { SaveService } from '../../Service/Save/save.service';

@Component({
  selector: 'app-modeler',
  templateUrl: './modeler.component.html',
  styleUrls: ['./modeler.component.scss'],
})
export class ModelerComponent implements OnInit, OnDestroy {

  modelSubscription: Subscription;

  constructor(private modelerService: ModelerService, private saveService: SaveService) {
    this.modelSubscription = modelerService.modelChanges().subscribe(() => {
      this.saveService.createSave();
    })
  }

  ngOnInit(): void {
    this.modelerService.postInit();
    this.saveService.loadCurrentSave();
  }

  ngOnDestroy(): void {
    this.modelSubscription.unsubscribe();
  }

}
