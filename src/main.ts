import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection(),provideRouter(routes),
    provideHttpClient(),
    importProvidersFrom(FormsModule, ReactiveFormsModule)
  ]
}).catch(err => console.error(err));
