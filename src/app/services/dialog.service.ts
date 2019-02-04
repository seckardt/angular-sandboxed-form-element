import { ApplicationRef, ComponentFactory, ComponentFactoryResolver, ComponentRef, ElementRef, Injectable, Injector } from '@angular/core';
import { JQueryRef, PopoverConfig, PopoverOptions } from '../components/sandbox.types';
import { PopoverComponent } from '../components/popover.component';

const DEFAULT_POPOVER_OPTIONS: PopoverOptions = {
  container: document.querySelector('app-root'),
  html: true,
  trigger: 'manual'
};

@Injectable()
export class DialogService {
  private popoverCmpFactory: ComponentFactory<PopoverComponent>;

  private popoverCmpRef: ComponentRef<PopoverComponent> | null = null;

  constructor(private injector: Injector, private applicationRef: ApplicationRef, cfResolver: ComponentFactoryResolver) {
    this.popoverCmpFactory = cfResolver.resolveComponentFactory(PopoverComponent);
  }

  popover(elementRef: ElementRef, config: PopoverConfig): JQueryRef {
    this.destroyPopover();

    const jQuery: any = window['$'];
    const jqRef: JQueryRef = jQuery(elementRef.nativeElement);
    jqRef.popover({ ...DEFAULT_POPOVER_OPTIONS, ...config.options });
    jqRef.on('inserted.bs.popover', () => {
      const popoverBodyEl = document.querySelector('app-root > .popover > .popover-body');
      this.popoverCmpRef = this.popoverCmpFactory.create(this.injector, [], popoverBodyEl);
      this.applicationRef.attachView(this.popoverCmpRef.hostView);

      this.popoverCmpRef.instance.config = config;
    });
    jqRef.on('hide.bs.popover', () => {
      this.destroyPopover();
    });
    return jqRef;
  }

  private destroyPopover(): void {
    if (this.popoverCmpRef) {
      const ref = this.popoverCmpRef;
      this.popoverCmpRef = null;

      ref.destroy();
      this.applicationRef.detachView(ref.hostView);
    }
  }
}
