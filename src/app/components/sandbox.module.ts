import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { DialogService } from '../services/dialog.service';
import { PopoverComponent } from './popover.component';
import { SandboxedInputComponent } from './sandboxed-input.component';

@NgModule({
  imports: [ReactiveFormsModule],
  declarations: [SandboxedInputComponent, PopoverComponent],
  exports: [SandboxedInputComponent, PopoverComponent, ReactiveFormsModule],
  entryComponents: [PopoverComponent],
  providers: [DialogService]
})
export class SandboxModule {}
