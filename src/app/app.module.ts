import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MainComponent } from './components/main/main.component';
import { ClockComponent } from './components/clock/clock.component';
import { CardProfileComponent } from './components/card-profile/card-profile.component';

import { ProfileViewerComponent } from './components/profile-viewer/profile-viewer.component';
import { NekoComponent } from './components/neko/neko.component';

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    NekoComponent,
    ClockComponent,
    CardProfileComponent,
    ProfileViewerComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
