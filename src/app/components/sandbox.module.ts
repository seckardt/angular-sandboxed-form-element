import { NgModule } from '@angular/core';
import { SandboxedInputComponent } from './sandboxed-input.component';

@NgModule({
  declarations: [SandboxedInputComponent],
  exports: [SandboxedInputComponent]
})
export class SandboxModule {}
