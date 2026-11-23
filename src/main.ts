import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter, withViewTransitions } from '@angular/router';
import { routes } from './app/app.routes';
import { provideHttpClient } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';

bootstrapApplication(AppComponent, {
  providers: [
    // Habilitado zoneless para mejor rendimiento con signals
    provideZonelessChangeDetection(),
    // Page changes cross-fade; the homelab card morphs between home and /homelab
    provideRouter(
      routes,
      withViewTransitions({
        skipInitialTransition: true,
        // Shared names (see `.vt-route` in styles.scss) only exist during page
        // changes, so they don't leak into other transitions like the player's
        onViewTransitionCreated: ({ transition }) => {
          const root = document.documentElement;
          root.classList.add('vt-route');
          transition.finished.finally(() => root.classList.remove('vt-route'));
        },
      }),
    ),
    provideHttpClient()
  ]
}).catch(err => console.error(err));
