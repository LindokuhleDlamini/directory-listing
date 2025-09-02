import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DirectoryListingComponent } from './components/directory-listing/directory-listing.component';
import { BookmarkButtonComponent } from './components/bookmark-button/bookmark-button.component';
import { BookmarksPanelComponent } from './components/bookmark-panel/bookmark-panel.component';
import { FileSizePipe } from './pipes/file-size.pipe';
import { DateFormatPipe } from './pipes/date-format.pipe';

@NgModule({
  declarations: [
    AppComponent,
    DirectoryListingComponent,
    BookmarkButtonComponent,
    BookmarksPanelComponent,
    FileSizePipe,
    DateFormatPipe
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }