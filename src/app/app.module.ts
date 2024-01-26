import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CardProfileComponent } from './components/card-profile/card-profile.component';
import { MainComponent } from './components/main/main.component';

import { HttpClientModule } from '@angular/common/http';
import { MarkdownModule } from 'ngx-markdown';
import { ClockComponent } from './components/clock/clock.component';
import { CustomCursorComponent } from './components/custom-cursor/custom-cursor.component';

@NgModule({
  declarations: [
    AppComponent,
    CardProfileComponent,
    MainComponent,
    ClockComponent,
    CustomCursorComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    HttpClientModule,
    MarkdownModule.forRoot()
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
