import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html'
})
export class FormComponent {
  form = new FormGroup({
    firstName: new FormControl('Mark'),
    lastName: new FormControl('Otto'),
    userName: new FormControl(),
    city: new FormControl('San Francisco'),
    state: new FormControl('CA'),
    zip: new FormControl(),
    checkbox: new FormControl(false)
  });
}
