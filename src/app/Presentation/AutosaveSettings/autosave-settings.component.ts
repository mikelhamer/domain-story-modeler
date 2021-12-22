import { Component, OnInit } from '@angular/core';
import { AutosaveService } from '../../Service/Autosave/autosave.service';
import { Save } from '../../Domain/Save/save';
import { AutosaveStateService } from '../../Service/Autosave/autosave-state.service';
import { SaveService } from '../../Service/Save/save.service';

@Component({
  selector: 'app-autosave-settings',
  templateUrl: './autosave-settings.component.html',
  styleUrls: ['./autosave-settings.component.scss'],
})
export class AutosaveSettingsComponent implements OnInit {
  autosaves: Save[] = [];
  autosaveEnabled: boolean;
  autosaveInterval: number;

  autosaveAmount: number;

  constructor(
    private autosaveService: AutosaveService,
    private autosaveStateService: AutosaveStateService,
    private saveService: SaveService
  ) {
    this.autosaveAmount = this.autosaveService.getMaxAutosaves();
    this.autosaveInterval = this.autosaveService.getAutosaveInterval();
    this.autosaveEnabled = this.autosaveStateService.getAutosaveState();
  }

  ngOnInit(): void {
    this.autosaves = this.saveService.loadCurrentSaves();
  }

  public loadSave(save: Save): void {
    this.saveService.loadSave(save);
  }

  setInterval($event: any): void {
    this.autosaveInterval = $event.target.value;
  }

  setAutosaveEnabled(): void {
    this.autosaveEnabled = !this.autosaveEnabled;
  }

  setAutosaveAmount($event: any) {
    this.autosaveAmount = $event.target.value;
  }

  save() {
    this.autosaveService.changeAutosaveInterval(this.autosaveInterval);

    if (this.autosaveEnabled) {
      this.autosaveService.startAutosaving();
    } else {
      this.autosaveService.stopAutosaving();
    }
  }
}
