import { Injectable } from '@angular/core';
import { assign } from 'min-dash';
import DomainStoryModeler from 'src/app/Modeler';
import { DomainConfiguration } from 'src/app/Domain/Common/domainConfiguration';
import { InitializerService } from './initializer.service';
import { ElementRegistryService } from '../ElementRegistry/element-registry.service';
import { IconDictionaryService } from '../DomainConfiguration/icon-dictionary.service';
import { DomainConfigurationService } from '../DomainConfiguration/domain-configuration.service';
import { BusinessObject } from '../../Domain/Common/businessObject';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ModelerService {
  constructor(
    private initializerService: InitializerService,
    private elementRegistryService: ElementRegistryService,
    private iconDictionaryService: IconDictionaryService,
    private domainConfigurationService: DomainConfigurationService
  ) {
  }

  private modeler: any;
  private canvas: any;
  private elementRegistry: any;
  private commandStack: any;
  private selection: any;
  private eventBus: any;

  private encoded: string | undefined;

  private modelChange$ = new Subject();

  public modelChanges(): Observable<any> {
    return this.modelChange$.asObservable();
  }

  public postInit(): void {
    this.initializerService.initializeDomainStoryModelerClasses();
    this.modeler = new DomainStoryModeler({
      container: '#canvas',
      keyboard: {
        bindTo: document,
      },

      // Disable BPMN-SearchModule and re-enable browser Search
      additionalModules: [
        {
          bpmnSearch: ['value', 'foo'],
        },
      ],
    });

    this.canvas = this.modeler.get('canvas');
    this.elementRegistry = this.modeler.get('elementRegistry');
    this.eventBus = this.modeler.get('eventBus');
    this.commandStack = this.modeler.get('commandStack');
    this.selection = this.modeler.get('selection');

    this.initializerService.initializeDomainStoryModelerEventHandlers(
      this.commandStack,
      this.eventBus
    );
    this.initializerService.propagateDomainStoryModelerClassesToServices(
      this.commandStack,
      this.elementRegistry,
      this.canvas,
      this.selection,
      this.modeler
    );

    const exportArtifacts = this.debounce(this.saveSVG, 500);
    this.modeler.on('commandStack.changed', exportArtifacts);

    this.initializerService.initiateEventBusListeners(
      this.eventBus,
      this.commandStack
    );

    this.modeler.createDiagram();
    // expose bpmnjs to window for debugging purposes
    assign(window, {bpmnjs: this.modeler});

    this.startDebounce();
  }

  public restart(
    domainConfiguration?: DomainConfiguration,
    domainStory?: BusinessObject[]
  ): void {
    const currentStory =
      domainStory != undefined
        ? domainStory
        : this.elementRegistryService
          .createObjectListForDSTDownload()
          .map((e) => e.businessObject);
    if (domainConfiguration) {
      this.iconDictionaryService.setCustomConfiguration(domainConfiguration);
      this.domainConfigurationService.loadConfiguration(domainConfiguration);
    }

    this.elementRegistryService.clear();
    this.modeler.destroy();
    this.postInit();
    if (currentStory) {
      this.getModeler().importCustomElements(currentStory);
    }
  }

  /** Interactions with the Modeler **/
  public getModeler(): any {
    return this.modeler;
  }

  public commandStackChanged(): void {
    // to update the title of the svg, we need to tell the command stack, that a value has changed
    this.eventBus.fire(
      'commandStack.changed',
      this.debounce(this.saveSVG, 500)
    );
  }

  public startDebounce(): void {
    this.debounce(this.saveSVG, 500);
  }

  public debounce(fn: any, timeout: number): any {
    return () => {
      let timer;
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        // tslint:disable-next-line:no-unused-expression
        fn(this.modeler).then((svg: string) => {
          this.encoded = svg;
          this.modelChange$.next();
        }) as Promise<any>;
      }, timeout);
    };
  }

  public getEncoded(): string {
    return this.encoded ? this.encoded : '';
  }

  async saveSVG(modeler: any): Promise<any> {
    try {
      const result = await modeler.saveSVG();
      return result.svg;
    } catch (err) {
      alert('There was an error saving the SVG.\n' + err);
    }
  }
}
