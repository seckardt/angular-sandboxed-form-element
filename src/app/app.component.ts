import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {
  form = new FormGroup({
    firstName: new FormControl('Mark'),
    lastName: new FormControl('Otto'),
    userName: new FormControl(),
    city: new FormControl(),
    state: new FormControl(),
    zip: new FormControl(),
    checkbox: new FormControl(false)
  });
}
