import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-splash-screen',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="splash-overlay" [class.fade-out]="fading">
      <div class="splash-content">
        <!-- Logo -->
        <div class="splash-logo" [class.logo-appear]="logoVisible">
          <div class="logo-circle">
            <img src="assets/images/snetwork-logo.jpg" alt="S-Network" class="logo-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
            <div class="logo-fallback" style="display:none">
              <span class="logo-s">S</span><span class="logo-dash">-</span><span class="logo-n">N</span>
            </div>
          </div>
          <div class="logo-rings">
            <div class="ring ring-1"></div>
            <div class="ring ring-2"></div>
            <div class="ring ring-3"></div>
          </div>
        </div>

        <!-- Brand Name -->
        <div class="splash-brand" [class.brand-appear]="brandVisible">
          <span class="brand-s">S</span><span class="brand-dash">-</span><span class="brand-n">N</span><span class="brand-rest">etwork</span>
        </div>

        <!-- Tagline -->
        <div class="splash-tagline" [class.tagline-appear]="taglineVisible">
          Find. Verify. Build.
        </div>

        <!-- Loading bar -->
        <div class="splash-progress" [class.progress-appear]="progressVisible">
          <div class="progress-bar" [style.width]="progress + '%'"></div>
        </div>

        <!-- Floating icons -->
        <div class="floating-icons">
          <span class="float-icon fi-1">🏗️</span>
          <span class="float-icon fi-2">📐</span>
          <span class="float-icon fi-3">🔧</span>
          <span class="float-icon fi-4">⚡</span>
          <span class="float-icon fi-5">🏠</span>
          <span class="float-icon fi-6">🎨</span>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .splash-overlay {
      position: fixed; inset: 0; z-index: 99999;
      background: linear-gradient(135deg, #0A1628 0%, #0D1F3C 50%, #1B3A5C 100%);
      display: flex; align-items: center; justify-content: center;
      transition: opacity 0.6s ease, transform 0.6s ease;
    }
    .splash-overlay.fade-out { opacity: 0; transform: scale(1.05); pointer-events: none; }

    .splash-content { text-align: center; position: relative; z-index: 2; }

    .splash-logo {
      position: relative; display: inline-block; margin-bottom: 24px;
      opacity: 0; transform: scale(0.5);
      transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .splash-logo.logo-appear { opacity: 1; transform: scale(1); }

    .logo-circle {
      width: 120px; height: 120px;
      border-radius: 50%; overflow: hidden;
      border: 4px solid #CC0000;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 40px rgba(204,0,0,0.5), 0 0 80px rgba(204,0,0,0.2);
      position: relative; z-index: 2; background: #0A1628;
    }
    .logo-img { width: 100%; height: 100%; object-fit: cover; }

    .logo-fallback {
      font-size: 36px; font-weight: 900; color: white;
      letter-spacing: -2px;
      .logo-s, .logo-n { color: #CC0000; }
      .logo-dash { color: rgba(255,255,255,0.7); }
    }

    .ring {
      position: absolute; border-radius: 50%;
      border: 2px solid rgba(204,0,0,0.3);
      top: 50%; left: 50%; transform: translate(-50%, -50%);
      animation: ring-pulse 2s ease-out infinite;
    }
    .ring-1 { width: 150px; height: 150px; animation-delay: 0s; }
    .ring-2 { width: 190px; height: 190px; animation-delay: 0.4s; }
    .ring-3 { width: 230px; height: 230px; animation-delay: 0.8s; }

    @keyframes ring-pulse {
      0%   { opacity: 0.8; transform: translate(-50%, -50%) scale(0.8); }
      100% { opacity: 0;   transform: translate(-50%, -50%) scale(1.2); }
    }

    .splash-brand {
      font-size: 3rem; font-weight: 900; letter-spacing: -1px;
      margin-bottom: 8px;
      opacity: 0; transform: translateY(20px);
      transition: opacity 0.5s, transform 0.5s;
    }
    .splash-brand.brand-appear { opacity: 1; transform: translateY(0); }
    .brand-s, .brand-n { color: #CC0000; }
    .brand-dash { color: rgba(255,255,255,0.5); }
    .brand-rest { color: white; }

    .splash-tagline {
      font-size: 1rem; color: rgba(255,255,255,0.6);
      letter-spacing: 4px; text-transform: uppercase;
      font-weight: 400; margin-bottom: 40px;
      opacity: 0; transition: opacity 0.5s;
    }
    .splash-tagline.tagline-appear { opacity: 1; }

    .splash-progress {
      width: 200px; height: 3px; background: rgba(255,255,255,0.1);
      border-radius: 3px; margin: 0 auto; overflow: hidden;
      opacity: 0; transition: opacity 0.3s;
    }
    .splash-progress.progress-appear { opacity: 1; }
    .progress-bar {
      height: 100%; background: linear-gradient(90deg, #CC0000, #FF4444);
      border-radius: 3px; transition: width 0.03s linear;
      box-shadow: 0 0 10px rgba(204,0,0,0.5);
    }

    .floating-icons { position: absolute; inset: -300px; pointer-events: none; z-index: 1; }
    .float-icon { position: absolute; font-size: 24px; opacity: 0.15; animation: float-icon 4s ease-in-out infinite; }
    .fi-1 { left: 10%; top: 20%; animation-delay: 0s; }
    .fi-2 { left: 80%; top: 15%; animation-delay: 0.5s; }
    .fi-3 { left: 15%; top: 70%; animation-delay: 1s; }
    .fi-4 { left: 85%; top: 65%; animation-delay: 1.5s; }
    .fi-5 { left: 50%; top: 10%; animation-delay: 0.3s; }
    .fi-6 { left: 40%; top: 85%; animation-delay: 0.8s; }

    @keyframes float-icon {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50%       { transform: translateY(-20px) rotate(10deg); }
    }
  `]
})
export class SplashScreenComponent implements OnInit {
    @Output() splashDone = new EventEmitter<void>();

    logoVisible = false;
    brandVisible = false;
    taglineVisible = false;
    progressVisible = false;
    fading = false;
    progress = 0;

    ngOnInit(): void {
        setTimeout(() => this.logoVisible = true, 200);
        setTimeout(() => this.brandVisible = true, 800);
        setTimeout(() => this.taglineVisible = true, 1300);
        setTimeout(() => this.progressVisible = true, 1600);

        let prog = 0;
        const interval = setInterval(() => {
            prog += 2;
            this.progress = prog;
            if (prog >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    this.fading = true;
                    setTimeout(() => this.splashDone.emit(), 600);
                }, 200);
            }
        }, 30); // ~3 seconds total
    }
}
