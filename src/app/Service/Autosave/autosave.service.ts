import { Injectable } from '@angular/core';
import { RendererService } from '../Renderer/renderer.service';
import { DomainConfigurationService } from '../DomainConfiguration/domain-configuration.service';
import { ExportService } from '../Export/export.service';
import { AutosaveStateService } from './autosave-state.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { IconDictionaryService } from '../DomainConfiguration/icon-dictionary.service';
import { AUTOSAVE_AMOUNT_TAG, AUTOSAVE_INTERVAL_TAG, MAX_AUTOSAVES, SAVE_TAG, } from '../../Domain/Common/constants';
import { SaveService } from '../Save/save.service';

@Injectable({
  providedIn: 'root',
})
export class AutosaveService {
  private readonly autosaveEnabled: Observable<boolean>;
  private autosaveTimer: any;
  private autosaveInterval = new BehaviorSubject(5); // in min
  private maxAutosaves = Number(
    localStorage.getItem(AUTOSAVE_AMOUNT_TAG) || MAX_AUTOSAVES
  );

  constructor(
    private rendererService: RendererService,
    private domainConfigurationService: DomainConfigurationService,
    private exportService: ExportService,
    private autosaveStateService: AutosaveStateService,
    private iconDistionaryService: IconDictionaryService,
    private saveService: SaveService
  ) {
    this.autosaveEnabled =
      this.autosaveStateService.getAutosaveStateAsObservable();
    this.loadAutosaveInterval();
    if (this.autosaveStateService.getAutosaveState()) {
      this.startTimer();
    }
  }

  public changeAutosaveInterval(interval: number): void {
    this.autosaveInterval.next(interval);
    this.saveAutosaveInterval();
    if (this.autosaveEnabled) {
      this.stopTimer();
      this.startTimer();
    }
  }

  public startAutosaving(): void {
    this.autosaveStateService.setAutosaveState(true);
    this.startTimer();
  }

  public stopAutosaving(): void {
    this.autosaveStateService.setAutosaveState(false);
    this.stopTimer();
  }

  public getAutosaveInterval(): number {
    return this.autosaveInterval.value;
  }

  public getAutosaveEnabledAsObservable(): Observable<boolean> {
    return this.autosaveEnabled;
  }

  public setMaxAutosaves(amount: number) {
    this.maxAutosaves = amount;
    localStorage.setItem(AUTOSAVE_AMOUNT_TAG, '' + amount);
  }

  public getMaxAutosaves(): number {
    return this.maxAutosaves;
  }

  private stopTimer(): void {
    clearInterval(this.autosaveTimer);
  }

  private startTimer(): void {
    // @ts-ignore
    this.autosaveTimer = new setInterval(() => {
      const currentSaves = this.saveService.loadCurrentSaves();
      if (currentSaves.length > this.maxAutosaves) {
        currentSaves.pop();
      }
      currentSaves.unshift(this.saveService.createSave());
      localStorage.setItem(
        SAVE_TAG,
        JSON.stringify({saves: currentSaves})
      );
    }, this.autosaveInterval.getValue() * 60000);
  }

  private loadAutosaveInterval(): void {
    const autosaveIntervalString = localStorage.getItem(AUTOSAVE_INTERVAL_TAG);
    if (autosaveIntervalString) {
      this.autosaveInterval.next(JSON.parse(autosaveIntervalString));
    }
  }

  private saveAutosaveInterval(): void {
    localStorage.setItem(
      AUTOSAVE_INTERVAL_TAG,
      '' + this.autosaveInterval.getValue()
    );
  }
}
