export interface Action {
  type: string;
  payload?: any;
}

export interface CallbackContext {
  source?: any;
  transfer?: Transferable[];
}

export type Emit = (action: Action) => void;

export type Listen = (type: string, callback: (payload: any, context?: CallbackContext) => void) => () => void;

/**
 * Popover options as defined by Twitter Bootstrap
 */
export interface PopoverOptions {
  animation?: boolean;
  container?: string | Element | false;
  content?: string | Element | Function;
  delay?: number | {};
  html?: boolean;
  placement?: 'auto' | 'top' | 'bottom' | 'right' | 'left' | Function;
  selector?: string | false;
  template?: string;
  title?: string | Element | Function;
  trigger?: 'click' | 'hover' | 'focus' | 'manual';
  offset?: number | string;
  fallbackPlacement?: string | string[];
  boundary?: string | Element;
}

export interface PopoverData {
  type?: string;
  value?: any;
  isRequired?: boolean;
  placeholder?: string;
}

export interface PopoverConfig {
  data: PopoverData;
  options: PopoverOptions;
  closeCallback: () => void;
  saveCallback: (value: any) => void;
}

export interface JQueryRef {
  popover(options: PopoverOptions | string): any;

  modal(options: {} | string): any;

  on(event: string, callback: (...args: any[]) => any): any;
}
