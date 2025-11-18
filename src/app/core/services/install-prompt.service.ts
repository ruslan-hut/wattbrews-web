import { Injectable, signal, inject } from '@angular/core';
import { STORAGE_KEYS } from '../constants/storage.constants';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Injectable({
  providedIn: 'root'
})
export class InstallPromptService {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  // Signal to track if install prompt is available
  readonly canInstall = signal<boolean>(false);
  
  // Signal to track if app is installed
  readonly isInstalled = signal<boolean>(false);
  
  // Signal to track if user has dismissed the prompt
  readonly isDismissed = signal<boolean>(false);

  constructor() {
    this.initializeInstallPrompt();
    this.checkIfInstalled();
    this.loadDismissedState();
  }

  /**
   * Initialize install prompt handling
   */
  private initializeInstallPrompt(): void {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.canInstall.set(true);
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      this.isInstalled.set(true);
      this.canInstall.set(false);
      this.deferredPrompt = null;
      this.clearDismissedState();
    });
  }

  /**
   * Check if the app is already installed
   */
  private checkIfInstalled(): void {
    // Check if running in standalone mode (installed PWA)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled.set(true);
      this.canInstall.set(false);
      return;
    }

    // Check if running as TWA (Trusted Web Activity)
    const isTWA = (window.navigator as any).standalone === true || 
                  (window.matchMedia('(display-mode: standalone)').matches);
    
    if (isTWA) {
      this.isInstalled.set(true);
      this.canInstall.set(false);
    }
  }

  /**
   * Show the install prompt
   */
  async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt || !this.canInstall()) {
      return false;
    }

    try {
      // Show the install prompt
      await this.deferredPrompt.prompt();
      
      // Wait for user's response
      const choiceResult = await this.deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        this.isInstalled.set(true);
        this.canInstall.set(false);
        this.clearDismissedState();
        return true;
      } else {
        // User dismissed the prompt
        this.saveDismissedState();
        return false;
      }
    } catch (error) {
      console.error('Error showing install prompt:', error);
      return false;
    } finally {
      // Clear the deferred prompt after use
      this.deferredPrompt = null;
      this.canInstall.set(false);
    }
  }

  /**
   * Check if install prompt should be shown
   */
  shouldShowPrompt(): boolean {
    return this.canInstall() && !this.isInstalled() && !this.isDismissed();
  }

  /**
   * Load dismissed state from localStorage
   */
  private loadDismissedState(): void {
    const dismissed = localStorage.getItem(STORAGE_KEYS.INSTALL_PROMPT_DISMISSED);
    if (dismissed === 'true') {
      this.isDismissed.set(true);
    }
  }

  /**
   * Save dismissed state to localStorage
   */
  private saveDismissedState(): void {
    localStorage.setItem(STORAGE_KEYS.INSTALL_PROMPT_DISMISSED, 'true');
    this.isDismissed.set(true);
  }

  /**
   * Clear dismissed state from localStorage
   */
  private clearDismissedState(): void {
    localStorage.removeItem(STORAGE_KEYS.INSTALL_PROMPT_DISMISSED);
    this.isDismissed.set(false);
  }

  /**
   * Reset dismissed state (for testing or user preference)
   */
  resetDismissedState(): void {
    this.clearDismissedState();
  }
}

