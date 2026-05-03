import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SplashScreenComponent } from './shared/components/splash-screen/splash-screen.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SplashScreenComponent],
  template: `
    <app-splash-screen
      *ngIf="showSplash"
      (splashDone)="onSplashDone()">
    </app-splash-screen>

    <div [class.hidden-until-splash]="showSplash" [class.visible]="!showSplash">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .hidden-until-splash {
      visibility: hidden;
      opacity: 0;
      transition: opacity 0.5s ease 0.3s, visibility 0s linear 0.3s;
    }
    .hidden-until-splash.visible,
    div:not(.hidden-until-splash) {
      visibility: visible;
      opacity: 1;
    }
  `]
})
export class AppComponent implements OnInit {
  showSplash = false;
  title = 'build-connect-web';

  ngOnInit(): void {
    const seen = sessionStorage.getItem('snetwork-splash-seen');
    if (!seen) {
      this.showSplash = true;
    }
  }

  onSplashDone(): void {
    this.showSplash = false;
    sessionStorage.setItem('snetwork-splash-seen', '1');
  }
}
