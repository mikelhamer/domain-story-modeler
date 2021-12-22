import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  DESCRIPTION_TAG,
  DOMAIN_CONFIG_KEY,
  INITIAL_DESCRIPTION,
  INITIAL_DOMAIN_NAME,
  INITIAL_TITLE, TITLE_TAG,
  VERSION,
} from '../../Domain/Common/constants';
import { CustomDomainConfiguration } from '../../Domain/Common/domainConfiguration';

@Injectable({
  providedIn: 'root',
})
export class TitleService {
  private title = INITIAL_TITLE;
  private description = INITIAL_DESCRIPTION;

  private titleSubject = new BehaviorSubject<string>(this.title);
  private descriptionSubject = new BehaviorSubject<string>(this.description);
  private domainNameSubject = new BehaviorSubject<string>(INITIAL_DOMAIN_NAME);
  private showDescription = new BehaviorSubject<boolean>(true);
  private commandStack: any;

  constructor() {
    const title = localStorage.getItem(TITLE_TAG);
    if (title) {
      this.title = title;
      this.titleSubject.next(this.title);
    }
    const description = localStorage.getItem(DESCRIPTION_TAG);
    if (description) {
      this.description = description;
      this.descriptionSubject.next(this.description);
    }
    const domainConfigString = localStorage.getItem(DOMAIN_CONFIG_KEY);
    if (domainConfigString) {
      const domainConfig = JSON.parse(domainConfigString) as CustomDomainConfiguration;
      this.domainNameSubject.next(domainConfig.name);
    }
  }

  public setCommandStack(commandStack: any): void {
    this.commandStack = commandStack;
  }

  public updateTitleAndDescription(
    title: string | null,
    description: string | null,
    allowUndo: boolean
  ): void {
    if (allowUndo) {
      this.fireTitleAndDescriptionUpdate(title, description);
    } else {
      if (!title) {
        title = this.title;
      }
      if (!description) {
        description = this.description;
      }

      this.updateTitle(title);
      this.updateDescription(description);
    }
  }

  private updateTitle(title: string): void {
    this.titleSubject.next(title);
    this.title = title;
    localStorage.setItem(TITLE_TAG, title);
    document.title = title + ' - egon.io';
  }

  private updateDescription(description: string): void {
    this.descriptionSubject.next(description);
    this.description = description;
    localStorage.setItem(DESCRIPTION_TAG, description);
  }

  public getTitleObservable(): Observable<string> {
    return this.titleSubject as Observable<string>;
  }

  public setShowDescription(show: boolean): void {
    this.showDescription.next(show);
  }

  public setDomainName(name: string): void {
    this.domainNameSubject.next(name);
  }

  public getShowDescriptionObservable(): Observable<boolean> {
    return this.showDescription.asObservable();
  }

  public getTitle(): string {
    return this.title;
  }

  public getDescriptionObservable(): Observable<string> {
    return this.descriptionSubject as Observable<string>;
  }

  public getDescription(): string {
    return this.description;
  }

  public getVersion(): string {
    return VERSION;
  }

  private fireTitleAndDescriptionUpdate(
    newTitle: string | null,
    newDescription: string | null
  ): void {
    const context = {
      newTitle,
      newDescription,
    };
    this.commandStack.execute('story.updateHeadlineAndDescription', context);
  }

  getDomainNameAsObservable(): Observable<string> {
    return this.domainNameSubject.asObservable();
  }

  getDomainName(): string {
    return this.domainNameSubject.value;
  }
}
