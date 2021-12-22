import { TestBed } from '@angular/core/testing';

import { MockService } from 'ng-mocks';
import { RendererService } from '../Renderer/renderer.service';
import { DomainConfigurationService } from '../DomainConfiguration/domain-configuration.service';
import { ExportService } from '../Export/export.service';
import { Save } from '../../Domain/Save/save';
import { testConfigAndDst } from '../../Domain/Export/configAndDst';
import { deepCopy } from '../../Utils/deepCopy';
import { Saves } from '../../Domain/Save/saves';
import { SaveService } from './save.service';

describe('SaveService', () => {
  let service: SaveService;

  let rendererServiceSpy: jasmine.SpyObj<RendererService>;

  let setItemSpy: jasmine.Spy;
  let getItemSpy: jasmine.Spy;

  beforeEach(() => {
    const renderServiceMock = jasmine.createSpyObj('RendererService', [
      'importStory',
    ]);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: RendererService,
          useValue: renderServiceMock,
        },
        {
          provide: DomainConfigurationService,
          useValue: MockService(DomainConfigurationService),
        },
        {
          provide: ExportService,
          useValue: MockService(ExportService),
        }
      ],
    });
    rendererServiceSpy = TestBed.inject(
      RendererService
    ) as jasmine.SpyObj<RendererService>;

    service = TestBed.inject(SaveService);

    getItemSpy = spyOn(localStorage, 'getItem').and.returnValue('false');
    setItemSpy = spyOn(localStorage, 'setItem').and.returnValue();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadCurrentSaves', () => {
    const saves: Saves = {saves: []};

    beforeEach(() => {
      saves.saves = [
        createEmptySave(
          Date.UTC(2000, 1, 1, 1, 1, 1).toString().slice(0, 25)
        ),
        createEmptySave(Date.now().toString().slice(0, 25)),
      ];
    });

    it('should getItem from local Storage', () => {
      getItemSpy.and.returnValue(JSON.stringify({autosaves: []}));
      const loadedSaves = service.loadCurrentSaves();

      expect(getItemSpy).toHaveBeenCalledWith('saveTag');
      expect(loadedSaves).toEqual([]);
    });

    it('should return sorted saves', () => {
      getItemSpy.and.returnValue(JSON.stringify(saves));

      const loadedSaves = service.loadCurrentSaves();

      expect(getItemSpy).toHaveBeenCalled();
      expect(loadedSaves).toEqual(saves.saves);
    });
  });

  function createEmptySave(date: string): Save {
    return {
      configAndDST: deepCopy(testConfigAndDst),
      date,
    };
  }

});
