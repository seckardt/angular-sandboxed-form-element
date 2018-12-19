import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  forwardRef,
  Input,
  NgZone,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
  Validators
} from '@angular/forms';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import sandbox from 'component-sandbox';

import * as sandboxedHtml from '!raw-loader!../../assets/html/sandboxed.html';

enum Actions {
  ATTR = 'attr',
  PROP = 'prop',
  VALIDITY = 'validity',
  VALUE = 'value'
}

interface Action {
  type: string;
  payload: any;
}

interface State {
  value: any;
  isRequired: boolean;
  isDisabled: boolean;
  isValid: boolean;
  isValidInternal: boolean;
  placeholder?: string;
  emit?: (action: Action) => void;
  listen?: (type: string, callback: (payload: any) => void) => void;
}

function validateInternal(state: State): ValidationErrors | null {
  return state.isValidInternal ? null : { required: false };
}

@Component({
  selector: 'app-sandbox',
  templateUrl: './sandboxed-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SandboxedInputComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => SandboxedInputComponent), multi: true }
  ],
  exportAs: 'sandboxedInput'
})
export class SandboxedInputComponent implements OnInit, ControlValueAccessor, Validator {
  private _handleInputChange: (value: any) => void | undefined;

  private _handleInputTouched: () => void | undefined;

  private _handleValidatorChange: () => void | undefined;

  private state: State = {
    value: null,
    isRequired: false,
    isDisabled: false,
    isValid: true,
    isValidInternal: true
  };

  @ViewChild('iframeElRef', { read: ElementRef })
  private iframeElRef: ElementRef;

  @Input('placeholder')
  set placeholder(value: string | undefined) {
    this.state.placeholder = value;
    this.emit(Actions.ATTR, 'placeholder');
  }

  @Input('required')
  set isRequired(value: boolean) {
    this.state.isRequired = coerceBooleanProperty(value);
    this._handleValidatorChange && this._handleValidatorChange();
    this.emit(Actions.PROP, 'isRequired', 'required');
  }

  constructor(private cdRef: ChangeDetectorRef, private ngZone: NgZone) {}

  ngOnInit(): void {
    this.ngZone.runOutsideAngular(async () => {
      const { emit, listen } = await sandbox.init(this.iframeElRef.nativeElement, sandboxedHtml);

      this.ngZone.run(() => {
        this.state.emit = emit;
        this.state.listen = listen;

        // Immediately emit current state information to the sandboxed input control
        this.emit(Actions.VALUE, 'value');
        this.emit(Actions.ATTR, 'placeholder');
        this.emit(Actions.PROP, 'isRequired', 'required');
        this.emit(Actions.PROP, 'isDisabled', 'disabled');
        this.emit(Actions.VALIDITY, 'isValid');

        // Listen to events sent from the sandboxed input control
        this.listen('input', (value: any) => this.handleInput(value));
        this.listen('blur', () => this.handleBlur());
        this.listen('valid', (value: boolean) => this.handleValid(coerceBooleanProperty(value)));
      });
    });
  }

  registerOnChange(fn: (value: any) => void): void {
    this._handleInputChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._handleInputTouched = fn;
  }

  registerOnValidatorChange(fn: () => void): void {
    this._handleValidatorChange = fn;
  }

  setDisabledState(value: boolean): void {
    this.state.isDisabled = value;
    this.emit(Actions.PROP, 'isDisabled', 'disabled');
    this.cdRef.markForCheck();
  }

  writeValue(value: any): void {
    this.state.value = value;
    this.emit(Actions.VALUE, 'value');
    this.cdRef.markForCheck();
  }

  validate(c: AbstractControl): ValidationErrors | null {
    const result = this.state.isRequired ? Validators.required(c) : null;
    this.emit(Actions.VALIDITY, 'isValid');
    return result || validateInternal(this.state);
  }

  private emit<K extends keyof State>(type: string, entry: K, name?: string): void {
    if (this.state.emit) {
      this.ngZone.runOutsideAngular(() => {
        let payload;
        if (type === 'attr' || type === 'prop') {
          const key = name || entry;
          const keyName = type === 'prop' ? 'property' : 'attribute';
          payload = { [keyName]: key, value: this.state[entry] };
        } else {
          payload = this.state[entry];
        }

        this.state.emit({ type: type, payload: payload });
      });
    }
  }

  private listen(type: string, callback: (value?: any) => void): void {
    this.ngZone.runOutsideAngular(() => {
      this.state.listen(type, (value?: any) => {
        this.ngZone.run(() => callback(value));
      });
    });
  }

  private handleInput(value: string | undefined): void {
    this._handleInputChange && this._handleInputChange(value);
  }

  private handleBlur(): void {
    this._handleInputTouched && this._handleInputTouched();
  }

  private handleValid(value: boolean): void {
    this.state.isValidInternal = value;
    this._handleValidatorChange && this._handleValidatorChange();
  }
}
