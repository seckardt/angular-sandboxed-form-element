import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { SandboxModule } from './sandbox.module';
import { FormComponent } from './form.component';

@NgModule({
  imports: [ReactiveFormsModule, SandboxModule],
  declarations: [FormComponent],
  exports: [FormComponent, ReactiveFormsModule, SandboxModule]
})
export class FormModule {}
