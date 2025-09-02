import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <div class="min-vh-100 bg-light">
      <app-directory-listing></app-directory-listing>
    </div>
  `
})
export class AppComponent {
  title = 'Directory Listing';
}