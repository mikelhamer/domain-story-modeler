import { Injectable } from '@angular/core';
import { RendererService } from '../Renderer/renderer.service';
import { DomainConfigurationService } from '../DomainConfiguration/domain-configuration.service';
import { ExportService } from '../Export/export.service';
import { Save } from '../../Domain/Save/save';
import { Saves } from '../../Domain/Save/saves';
import { IconDictionaryService } from '../DomainConfiguration/icon-dictionary.service';
import { elementTypes } from '../../Domain/Common/elementTypes';
import { SAVE_TAG, } from '../../Domain/Common/constants';

@Injectable({
  providedIn: 'root',
})
export class SaveService {

  constructor(
    private rendererService: RendererService,
    private domainConfigurationService: DomainConfigurationService,
    private exportService: ExportService,
    private iconDictionaryService: IconDictionaryService
  ) {
  }

  public loadSave(save: Save): void {
    const config = JSON.parse(save.configAndDST.domain);
    const story = JSON.parse(save.configAndDST.dst);

    const actorIcons = this.iconDictionaryService.getElementsOfType(
      story,
      elementTypes.ACTOR
    );
    const workObjectIcons = this.iconDictionaryService.getElementsOfType(
      story,
      elementTypes.WORKOBJECT
    );
    this.iconDictionaryService.updateIconRegistries(
      actorIcons,
      workObjectIcons,
      config
    );
    this.rendererService.importStory(story, true, config, false);
  }

  public createSave(): Save {
    const dst = JSON.stringify(this.rendererService.getStory());
    const configAndDST = this.exportService.createConfigAndDST(dst);

    const date = new Date().toString().slice(0, 25);

    const save = {configAndDST, date};

    localStorage.setItem(
      SAVE_TAG,
      JSON.stringify(save)
    );

    return save;

  }

  public loadCurrentSaves(): Save[] {
    const savesString = localStorage.getItem(SAVE_TAG);
    if (savesString) {
      const saves = (JSON.parse(savesString) as Saves).saves;
      if (saves && saves.length > 0) {
        this.sortSaves(saves);
        return saves;
      }
    }
    return [];
  }

  private sortSaves(saves: Save[]): void {
    saves.sort((a: Save, b: Save) => {
      const aDate = Date.parse(a.date);
      const bDate = Date.parse(b.date);

      if (aDate > bDate) {
        return 0;
      }
      return 1;
    });
  }

}
