import { ApplicationConfig } from '@angular/core';
import { provideRouter, RouteReuseStrategy } from '@angular/router';
import { NoReuseStrategy } from './core/strategies/no-reuse-strategy';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    {
      provide: RouteReuseStrategy,
      useClass: NoReuseStrategy
    }
  ]
};
