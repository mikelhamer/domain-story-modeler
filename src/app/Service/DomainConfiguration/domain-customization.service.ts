import { Injectable } from '@angular/core';
import {
  CustomDomainConfiguration,
  DomainConfiguration,
} from '../../Domain/Common/domainConfiguration';
import { BehaviorSubject, Observable } from 'rxjs';
import { DomainConfigurationService } from './domain-configuration.service';
import { IconDictionaryService } from './icon-dictionary.service';
import { getNameFromType } from '../../Utils/naming';
import { elementTypes } from '../../Domain/Common/elementTypes';
import { IconListItem } from '../../Domain/Domain-Configuration/iconListItem';
import { Dictionary, Entry } from '../../Domain/Common/dictionary/dictionary';
import { ImportDomainStoryService } from '../Import/import-domain-story.service';
import { deepCopy } from '../../Utils/deepCopy';
import { TitleService } from '../Title/title.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  DOMAIN_CONFIG_KEY,
  SNACKBAR_DURATION,
  SNACKBAR_INFO,
  SNACKBAR_SUCCESS,
} from '../../Domain/Common/constants';

@Injectable({
  providedIn: 'root',
})
export class DomainCustomizationService {
  private readonly domainConfigurationTypes: BehaviorSubject<CustomDomainConfiguration>;

  private allIconListItems = new Dictionary();

  domainName = new Observable<string>();

  private configurationHasChanged = false;

  selectedActors = new BehaviorSubject<string[]>([]);
  selectedWorkobjects = new BehaviorSubject<string[]>([]);
  private savedDomainConfiguration: DomainConfiguration | undefined;

  constructor(
    private configurationService: DomainConfigurationService,
    private iconDictionaryService: IconDictionaryService,
    private importService: ImportDomainStoryService,
    private titleService: TitleService,
    public snackBar: MatSnackBar
  ) {
    this.domainName = this.titleService.getDomainNameAsObservable();
    this.domainConfigurationTypes = new BehaviorSubject(
      this.configurationService.getCurrentConfigurationNamesWithoutPrefix()
    );

    this.selectedWorkobjects.next(
      this.domainConfigurationTypes.value.workObjects
    );
    this.selectedActors.next(this.domainConfigurationTypes.value.actors);

    iconDictionaryService
      .getAllIconDictionary()
      .keysArray()
      .forEach((iconName) => {
        this.addIconToAllIconList(iconName);
      });

    importService.importedConfigurationEvent.subscribe((config) => {
      this.importConfiguration(config);
    });
    const importedConfiguration = this.importService.getImportedConfiguration();
    if (importedConfiguration) {
      this.importConfiguration(importedConfiguration, false);
    }

    const domainConfigString = localStorage.getItem(DOMAIN_CONFIG_KEY);
    if (domainConfigString) {
      this.savedDomainConfiguration = JSON.parse(domainConfigString) as DomainConfiguration;

    }
    console.log(this.savedDomainConfiguration);
  }

  public getDomainConfiguration(): BehaviorSubject<CustomDomainConfiguration> {
    return this.domainConfigurationTypes;
  }

  public getIconForName(iconName: string): BehaviorSubject<IconListItem> {
    return this.allIconListItems.get(iconName);
  }

  public getSelectedActors(): BehaviorSubject<string[]> {
    return this.selectedActors;
  }

  public getSelectedWorkobjects(): BehaviorSubject<string[]> {
    return this.selectedWorkobjects;
  }

  public isIconActor(iconName: string): boolean {
    return (
      this.domainConfigurationTypes.value.actors.filter((actor: string) =>
        actor.includes(iconName)
      ).length > 0
    );
  }

  public isIconWorkObject(iconName: string): boolean {
    return (
      this.domainConfigurationTypes.value.workObjects.filter(
        (workObject: string) => workObject.includes(iconName)
      ).length > 0
    );
  }

  public getDomainName(): Observable<string> {
    return this.domainName;
  }

  public changeName(domainName: string): void {
    const value = this.domainConfigurationTypes.value;
    value.name = domainName;
    this.domainConfigurationTypes.next(value);
    this.titleService.setDomainName(domainName);
    this.configurationHasChanged = true;
  }

  public importConfiguration(
    customConfig: DomainConfiguration,
    saveDomain = true
  ): void {
    const actorDict = new Dictionary();
    const workObjectDict = new Dictionary();

    actorDict.addEach(customConfig.actors);
    workObjectDict.addEach(customConfig.workObjects);

    const actorKeys = actorDict.keysArray();
    const workObjectKeys = workObjectDict.keysArray();

    actorKeys.forEach((iconName) => {
      if (!this.allIconListItems.has(iconName)) {
        this.addIconToAllIconList(iconName);
      }
      const selectedActorNames = this.selectedActors.value;
      if (!selectedActorNames.includes(iconName)) {
        selectedActorNames.push(iconName);
        this.selectedActors.next(selectedActorNames);
      }
      this.setAsActor(true, iconName);
    });
    workObjectKeys.forEach((iconName) => {
      if (!this.allIconListItems.has(iconName)) {
        this.addIconToAllIconList(iconName);
      }
      const selectedWorkobjectNames = this.selectedWorkobjects.value;
      if (!selectedWorkobjectNames.includes(iconName)) {
        selectedWorkobjectNames.push(iconName);
        this.selectedWorkobjects.next(selectedWorkobjectNames);
      }
      this.setAsWorkobject(true, iconName);
    });
    if (saveDomain) {
      this.saveDomain();
    }
  }

  /** Seleted Icons **/
  public setAsUnassigned(iconName: string, isActor: boolean): void {
    if (isActor) {
      this.deselectActor(iconName);
    } else {
      this.deselectWorkobject(iconName);
    }
    this.updateIcon(false, false, iconName);
  }

  public setAsActor(isActor: boolean, actor: string): void {
    if (isActor) {
      this.updateIcon(true, false, actor);
      this.selectActor(actor);
      this.deselectWorkobject(actor);
    } else {
      this.deselectActor(actor);
      this.updateIcon(false, false, actor);
    }
  }

  public setAsWorkobject(isWorkobject: boolean, workobject: string): void {
    if (isWorkobject) {
      this.updateIcon(false, true, workobject);
      this.selectWorkObject(workobject);
      this.deselectActor(workobject);
    } else {
      this.deselectWorkobject(workobject);
      this.updateIcon(false, false, workobject);
    }
  }

  public selectActor(actor: string): void {
    const value = this.domainConfigurationTypes.value;
    if (!value.actors.includes(actor)) {
      value.actors.push(actor);
      this.domainConfigurationTypes.next(value);
      this.updateActorSubject();
    }
  }

  public selectWorkObject(workObject: string): void {
    const value = this.domainConfigurationTypes.value;
    if (!value.workObjects.includes(workObject)) {
      value.workObjects.push(workObject);
      this.domainConfigurationTypes.next(value);
      this.updateWorkObjectSubject();
    }
  }

  public deselectActor(actor: string): void {
    if (this.domainConfigurationTypes) {
      this.domainConfigurationTypes.next({
        name: this.domainConfigurationTypes.value.name,
        actors: this.domainConfigurationTypes.value.actors.filter(
          (a: string) => !a.includes(actor)
        ),
        workObjects: this.domainConfigurationTypes.value.workObjects,
      });
    }
    this.updateActorSubject();
  }

  public deselectWorkobject(workobject: string): void {
    if (this.domainConfigurationTypes) {
      this.domainConfigurationTypes.next({
        name: this.domainConfigurationTypes.value.name,
        actors: this.domainConfigurationTypes.value.actors,
        workObjects: this.domainConfigurationTypes.value.workObjects.filter(
          (w: string) => !w.includes(workobject)
        ),
      });
    }
    this.updateWorkObjectSubject();
  }

  public setSelectedWorkObject(sortedList: string[]): void {
    const value = this.domainConfigurationTypes.value;
    value.workObjects = sortedList;
    this.domainConfigurationTypes.next(value);
    this.updateWorkObjectSubject();
  }

  public setSelectedActors(sortedList: string[]): void {
    const value = this.domainConfigurationTypes.value;
    value.actors = sortedList;
    this.domainConfigurationTypes.next(value);
    this.updateActorSubject();
  }

  private updateActorSubject(): void {
    this.selectedActors.next(this.domainConfigurationTypes.value.actors);
    this.configurationHasChanged = true;
  }

  private updateWorkObjectSubject(): void {
    this.selectedWorkobjects.next(
      this.domainConfigurationTypes.value.workObjects
    );
    this.configurationHasChanged = true;
  }

  /** Revert Domain **/
  public resetDomain(): void {
    const defaultConfig =
      this.configurationService.createMinimalConfigurationWithDefaultIcons();

    this.domainConfigurationTypes.next({
      name: defaultConfig.name,
      actors: defaultConfig.actors.entries.map((entry: Entry) => entry.key),
      workObjects: defaultConfig.workObjects.entries.map(
        (entry: Entry) => entry.key
      ),
    } as CustomDomainConfiguration);
    this.updateAllIconBehaviourSubjects();
  }

  public cancel(): void {
    this.domainConfigurationTypes.next(
      this.configurationService.getCurrentConfigurationNamesWithoutPrefix()
    );
    this.updateAllIconBehaviourSubjects();
    this.resetToInitialConfiguration();
  }

  private resetToInitialConfiguration(): void {
    this.updateActorSubject();
    this.updateWorkObjectSubject();
  }

  /** Persist Domain **/
  public saveDomain(): void {
    if (this.configurationHasChanged) {
      this.savedDomainConfiguration = this.createDomainConfiguration();
      localStorage.setItem(DOMAIN_CONFIG_KEY, JSON.stringify(this.savedDomainConfiguration));

      this.snackBar.open('Configuration saved successfully', undefined, {
        duration: SNACKBAR_DURATION,
        panelClass: SNACKBAR_SUCCESS,
      });
    } else {
      this.snackBar.open('Nothing to be saved', undefined, {
        duration: SNACKBAR_DURATION,
        panelClass: SNACKBAR_INFO,
      });
    }
  }

  public exportDomain(): void {
    this.saveDomain();
    this.configurationService.exportConfiguration();
  }

  public getSavedConfiguration(): DomainConfiguration | undefined {
    const config = deepCopy(this.savedDomainConfiguration);
    this.savedDomainConfiguration = undefined;
    return config;
  }

  private createDomainConfiguration(): DomainConfiguration {
    const actors: { [key: string]: any } = {};
    const workObjects: { [key: string]: any } = {};

    this.domainConfigurationTypes.value.actors.forEach((type: string) => {
      actors[type] = this.iconDictionaryService.getIconSource(type);
    });
    this.domainConfigurationTypes.value.workObjects.forEach((type: string) => {
      workObjects[type] = this.iconDictionaryService.getIconSource(type);
    });

    return {
      name: this.domainConfigurationTypes.value.name || '',
      actors,
      workObjects,
    };
  }

  /** Update Icons **/

  public addNewIcon(iconName: string): void {
    this.iconDictionaryService.addIconsToCss([
      { name: iconName, src: this.getSrcForIcon(iconName) },
    ]);
    this.addIconToAllIconList(iconName);
  }

  private addIconToAllIconList(iconName: string): void {
    this.allIconListItems.add(
      new BehaviorSubject({
        name: iconName,
        svg: this.getSrcForIcon(iconName),
        isActor: this.isIconActor(iconName),
        isWorkObject: this.isIconWorkObject(iconName),
      }),
      iconName
    );
  }

  private updateIcon(
    isActor: boolean,
    isWorkobject: boolean,
    iconName: string
  ) {
    const iconBehaviourSubject = this.getIconForName(iconName);
    const icon = iconBehaviourSubject.value;
    icon.isActor = isActor;
    icon.isWorkObject = isWorkobject;

    iconBehaviourSubject.next(icon);
  }

  private updateAllIconBehaviourSubjects(): void {
    const customDomainCofiguration = this.domainConfigurationTypes.value;
    this.allIconListItems.keysArray().forEach((iconName) => {
      if (customDomainCofiguration.actors.includes(iconName)) {
        this.updateIcon(true, false, iconName);
      } else if (customDomainCofiguration.workObjects.includes(iconName)) {
        this.updateIcon(false, true, iconName);
      } else {
        this.updateIcon(false, false, iconName);
      }
    });
  }

  private getSrcForIcon(name: string): string {
    let iconName = '';
    if (name.includes(elementTypes.DOMAINSTORY)) {
      iconName = getNameFromType(name);
    } else {
      iconName = name;
    }
    const rawSrc = this.iconDictionaryService.getIconSource(iconName);

    if (!rawSrc) {
      return '';
    }

    if (rawSrc.startsWith('data')) {
      return rawSrc;
    } else {
      return 'data:image/svg+xml,' + rawSrc;
    }
  }
}
