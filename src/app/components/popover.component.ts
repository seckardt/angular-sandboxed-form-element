import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { PopoverConfig, PopoverData } from './sandbox.types';

const typeSuffix = '-popover';
const defaultType = `text${typeSuffix}`;

function obtainType(data: PopoverData): string {
  if (!data || !data.type) {
    return defaultType;
  }
  return `${data.type}${typeSuffix}`;
}

@Component({
  selector: 'app-popover',
  templateUrl: './popover.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'appPopover'
})
export class PopoverComponent {
  private formControl = new FormControl();

  private _config: PopoverConfig | undefined;

  private _data: PopoverData | undefined;

  private _type = defaultType;

  form = new FormGroup({
    control: this.formControl
  });

  constructor(private cdRef: ChangeDetectorRef) {}

  set config(value: PopoverConfig) {
    this._config = value;
    const data = this._data = value ? value.data : {};
    this.formControl.setValue(data ? data.value : null);
    this._type = obtainType(data);
    this.cdRef.markForCheck();
  }

  get data(): PopoverData {
    return this._data;
  }

  get type(): string | null {
    return this._type;
  }

  handleSandboxInit({ emit, listen }): void {
    emit({ type: 'focus' });

    listen('popover-close', () => {
      this._config.closeCallback();
    });

    listen('popover-save', value => {
      this._config.saveCallback(value);
    });
  }
}
