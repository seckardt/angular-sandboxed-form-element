import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
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
import { DialogService } from '../services/dialog.service';
import { Emit, JQueryRef, Listen, PopoverData } from './sandbox.types';
import sandbox from 'component-sandbox';

import * as sandboxedHtml from '!raw-loader!../../assets/html/sandboxed-input.html';
import * as sandboxedSelectHtml from '!raw-loader!../../assets/html/sandboxed-select.html';
import * as sandboxedDateHtml from '!raw-loader!../../assets/html/sandboxed-date.html';
import * as sandboxedDatePopoverHtml from '!raw-loader!../../assets/html/sandboxed-date-popover.html';

enum Actions {
  ATTR = 'attr',
  PROP = 'prop',
  VALID = 'valid',
  VALUE = 'value'
}

enum Events {
  BLUR = 'blur',
  INPUT = 'input',
  VALID = 'valid',
  POPOVER_OPEN = 'popover-open',
  POPOVER_CLOSE = 'popover-close'
}

enum Types {
  DATE = 'date',
  DATE_POPOVER = 'date-popover',
  SELECT = 'select',
  TEXT = 'text'
}

interface State {
  type: Types;
  value: any;
  isRequired: boolean;
  isDisabled: boolean;
  isValid: boolean;
  isValidInternal: boolean;
  placeholder?: string;
  emit?: Emit;
  listen?: Listen;
  onDestroy?: () => void;
}

function validateInternal(state: State): ValidationErrors | null {
  return state.isValidInternal ? null : { required: false };
}

function obtainMarkup(type: Types): string {
  switch (type) {
    case Types.DATE_POPOVER:
      return sandboxedDatePopoverHtml;
    case Types.DATE:
      return sandboxedDateHtml;
    case Types.SELECT:
      return sandboxedSelectHtml;
    default:
      return sandboxedHtml;
  }
}

@Component({
  selector: 'app-sandbox',
  templateUrl: './sandboxed-input.component.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SandboxedInputComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => SandboxedInputComponent), multi: true }
  ],
  exportAs: 'sandboxedInput'
})
export class SandboxedInputComponent implements OnInit, OnDestroy, ControlValueAccessor, Validator {
  private listenerDeregFns: (() => void)[] = [];

  private popoverRef: JQueryRef | null = null;

  private _handleInputChange: (value: any) => void | undefined;

  private _handleInputTouched: () => void | undefined;

  private _handleValidatorChange: () => void | undefined;

  private state: State = {
    type: Types.TEXT,
    value: null,
    isRequired: false,
    isDisabled: false,
    isValid: true,
    isValidInternal: true
  };

  @ViewChild('iframeElRef', { read: ElementRef })
  private iframeElRef: ElementRef;

  @Input('type')
  set type(value: string) {
    if (value === Types.SELECT) {
      this.state.type = Types.SELECT;
    } else if (value === Types.DATE) {
      this.state.type = Types.DATE;
    } else if (value === Types.DATE_POPOVER) {
      this.state.type = Types.DATE_POPOVER;
    } else {
      this.state.type = Types.TEXT;
    }
  }

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

  @Output()
  sandboxInit = new EventEmitter<{ emit: Emit; listen: Listen, onDestroy: () => void }>();

  constructor(private cdRef: ChangeDetectorRef, private ngZone: NgZone, private elementRef: ElementRef, private dialogSvc: DialogService) {}

  ngOnInit(): void {
    this.ngZone.runOutsideAngular(async () => {
      const html = obtainMarkup(this.state.type);
      const { emit, listen, onDestroy } = await sandbox.init(this.iframeElRef.nativeElement, html);
      this.sandboxInit.emit({ emit, listen, onDestroy });

      this.ngZone.run(() => {
        this.state.emit = emit;
        this.state.listen = listen;
        this.state.onDestroy = onDestroy;

        // Immediately emit current state information to the sandboxed input control
        this.emit(Actions.VALUE, 'value');
        this.emit(Actions.ATTR, 'placeholder');
        this.emit(Actions.PROP, 'isRequired', 'required');
        this.emit(Actions.PROP, 'isDisabled', 'disabled');
        this.emit(Actions.VALID, 'isValid');

        // Listen to events sent from the sandboxed input control
        this.listen('SBX:FOCUS', ({ isDocumentElement }) => {
          if (isDocumentElement) {
            // Delegate `focus` intent
            this.state.emit({ type: 'focus' });
          }
        });
        this.listen(Events.INPUT, (value: any) => this.handleInput(value));
        this.listen(Events.BLUR, () => this.handleBlur());
        this.listen(Events.VALID, (value: boolean) => this.handleValid(coerceBooleanProperty(value)));
        this.listen(Events.POPOVER_OPEN, (payload: PopoverData) => this.handlePopoverOpen(payload));
        this.listen(Events.POPOVER_CLOSE, () => this.destroyPopover());
      });
    });
  }

  ngOnDestroy(): void {
    this.state.emit({ type: 'destroy' });
    setTimeout(() => {
      this.state.onDestroy();
    });

    this.listenerDeregFns.forEach(deregFn => deregFn());
    this.listenerDeregFns = [];
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
    this.emit(Actions.VALID, 'isValid');
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
      const deregFn = this.state.listen(type, (value?: any) => {
        this.ngZone.run(() => callback(value));
      });
      this.listenerDeregFns.push(deregFn);
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

  private handlePopoverOpen(payload: PopoverData): void {
    this.destroyPopover();
    this.popoverRef = this.dialogSvc.popover(this.elementRef, {
      data: payload,
      options: {
        title: 'Select Date' // Would in reality be configurable based on `type`
      },
      closeCallback: () => {
        this.destroyPopover();
        this.state.emit({ type: 'focus' });
      },
      saveCallback: (value: any) => {
        this.writeValue(value);
        this.handleInput(value);
        this.destroyPopover();
        this.state.emit({ type: 'focus' });
      }
    });
    this.popoverRef.popover('show');
  }

  private destroyPopover(): void {
    if (this.popoverRef) {
      const ref = this.popoverRef;
      this.popoverRef = null;
      ref.popover('hide');
      ref.popover('dispose');
      this.state.emit({ type: Events.POPOVER_CLOSE });
    }
  }
}
