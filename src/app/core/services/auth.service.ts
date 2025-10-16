import { Injectable, signal, computed, inject, Injector, runInInjectionContext } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User, sendPasswordResetEmail, updateProfile, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, ActionCodeSettings } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, from, throwError, firstValueFrom } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { User as AppUser, UserProfile } from '../models/user.model';
import { UserInfoService } from './user-info.service';
import { environment } from '../../../environments/environment';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  displayName: string;
  firstName: string;
  lastName: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly firestore = inject(Firestore);
  private readonly router = inject(Router);
  private readonly userInfoService = inject(UserInfoService);
  private readonly injector = inject(Injector);

  // Signals for reactive state management
  private readonly _user = signal<AppUser | null>(null);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _userName = signal<string | null>(null);
  private readonly _userProfile = signal<UserProfile | null>(null);

  // Public readonly signals
  readonly user = this._user.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly userName = this._userName.asReadonly();
  readonly userProfile = this._userProfile.asReadonly();
  readonly isAuthenticated = computed(() => !!this._user());

  // BehaviorSubject for compatibility with existing code
  private userSubject = new BehaviorSubject<AppUser | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor() {
    // Listen to Firebase auth state changes
    onAuthStateChanged(this.auth, async (firebaseUser) => {
      if (firebaseUser) {
        await runInInjectionContext(this.injector, () => this.loadUserProfile(firebaseUser.uid));
      } else {
        this._user.set(null);
        this._userProfile.set(null);
        this._userName.set(null);
        this.userSubject.next(null);
      }
    });
  }

  /**
   * Sign in with Google (Primary method)
   */
  async signInWithGoogle(): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');

      const result = await signInWithPopup(this.auth, provider);
      const user = result.user;

      // Check if user profile exists, if not create it
      await this.ensureUserProfile(user);
      await this.loadUserProfile(user.uid);
      
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this._error.set(this.getErrorMessage(error));
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Sign in with email and password (Secondary method)
   */
  async login(credentials: LoginCredentials): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        credentials.email,
        credentials.password
      );

      await this.loadUserProfile(userCredential.user.uid);
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this._error.set(this.getErrorMessage(error));
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Register new user
   */
  async register(credentials: RegisterCredentials): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        credentials.email,
        credentials.password
      );

      // Update Firebase user profile
      await updateProfile(userCredential.user, {
        displayName: credentials.displayName
      });

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: userCredential.user.uid,
        firstName: credentials.firstName,
        lastName: credentials.lastName,
        preferences: {
          language: environment.defaultLang,
          currency: 'EUR', // Default currency
          theme: 'auto',
          notifications: {
            email: true,
            push: true,
            sms: false,
            chargingUpdates: true,
            promotions: false
          }
        },
        paymentMethods: []
      };

      await runInInjectionContext(this.injector, () =>
        setDoc(doc(this.firestore, 'users', userCredential.user.uid), userProfile)
      );

      await this.loadUserProfile(userCredential.user.uid);
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this._error.set(this.getErrorMessage(error));
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Sign out current user
   */
  async logout(): Promise<void> {
    try {
      this._isLoading.set(true);
      await signOut(this.auth);
      this._user.set(null);
      this._userProfile.set(null);
      this._userName.set(null);
      this.userSubject.next(null);
      this.userInfoService.clearData(); // Clear user info data
      this.router.navigate(['/auth/login']);
    } catch (error: any) {
      this._error.set(this.getErrorMessage(error));
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);
      await sendPasswordResetEmail(this.auth, email);
    } catch (error: any) {
      this._error.set(this.getErrorMessage(error));
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Send sign-in link to email (passwordless authentication)
   */
  async sendSignInLinkToEmail(email: string): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      const actionCodeSettings: ActionCodeSettings = {
        url: `${window.location.origin}/auth/verify-email-link`,
        handleCodeInApp: true,
        iOS: {
          bundleId: 'com.wattbrews.app'
        },
        android: {
          packageName: 'com.wattbrews.app',
          installApp: true,
          minimumVersion: '1.0'
        }
      };

      await sendSignInLinkToEmail(this.auth, email, actionCodeSettings);
      
      // Store email locally for verification
      localStorage.setItem('emailForSignIn', email);
    } catch (error: any) {
      this._error.set(this.getErrorMessage(error));
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Check if current URL is a sign-in link
   */
  isSignInWithEmailLink(url: string): boolean {
    return isSignInWithEmailLink(this.auth, url);
  }

  /**
   * Complete sign-in with email link
   */
  async signInWithEmailLink(email: string, url: string): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      const userCredential = await signInWithEmailLink(this.auth, email, url);
      
      // Clear stored email
      localStorage.removeItem('emailForSignIn');
      
      // Check if user profile exists, if not create it
      await this.ensureUserProfile(userCredential.user);
      await this.loadUserProfile(userCredential.user.uid);
      
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this._error.set(this.getErrorMessage(error));
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Get stored email for sign-in link verification
   */
  getStoredEmailForSignIn(): string | null {
    return localStorage.getItem('emailForSignIn');
  }

  /**
   * Get current user token (for backend requests)
   */
  async getToken(): Promise<string | null> {
    const user = this.auth.currentUser;
    if (!user) {
      return null;
    }
    
    try {
      const token = await user.getIdToken();
      return token;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get fresh token (forces refresh)
   */
  async getFreshToken(): Promise<string | null> {
    const user = this.auth.currentUser;
    if (!user) return null;
    
    try {
      return await user.getIdToken(true); // Force refresh
    } catch (error) {
      return null;
    }
  }

  /**
   * Ensure user profile exists in Firestore
   */
  async ensureUserProfile(firebaseUser: User): Promise<void> {
    try {
      const userDoc = await runInInjectionContext(this.injector, () => 
        getDoc(doc(this.firestore, 'users', firebaseUser.uid))
      );
      
      if (!userDoc.exists()) {
        // Create user profile for Google sign-in users
        const userProfile: UserProfile = {
          uid: firebaseUser.uid,
          firstName: firebaseUser.displayName?.split(' ')[0] || '',
          lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
          preferences: {
            language: environment.defaultLang,
            currency: 'EUR',
            theme: 'auto',
            notifications: {
              email: true,
              push: true,
              sms: false,
              chargingUpdates: true,
              promotions: false
            }
          },
          paymentMethods: []
        };

        await runInInjectionContext(this.injector, () =>
          setDoc(doc(this.firestore, 'users', firebaseUser.uid), userProfile)
        );
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    const user = this._user();
    return user?.roles?.includes(role) ?? false;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    const user = this._user();
    if (!user?.roles) {
      return false;
    }
    return roles.some(role => user.roles.includes(role));
  }

  /**
   * Load user profile from Firestore
   */
  private async loadUserProfile(uid: string): Promise<void> {
    try {
      const userDoc = await runInInjectionContext(this.injector, () =>
        getDoc(doc(this.firestore, 'users', uid))
      );
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        this._userProfile.set(userData);
        const firebaseUser = this.auth.currentUser;
        
        if (firebaseUser) {
          // Load actual role from backend API
          let roles = ['user']; // Default role
          try {
            await firstValueFrom(this.userInfoService.loadCurrentUserInfo());
            const userRole = this.userInfoService.getUserRole();
            roles = [userRole]; // Use role from backend API
          } catch (error) {
            // Silently fall back to default role if API call fails
          }

          const appUser: AppUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            displayName: firebaseUser.displayName || `${userData.firstName} ${userData.lastName}`,
            photoURL: firebaseUser.photoURL || undefined,
            roles: roles,
            createdAt: new Date(firebaseUser.metadata.creationTime!),
            lastLoginAt: new Date(),
            isActive: true
          };
          
          this._user.set(appUser);
          this.userSubject.next(appUser);
          
          // Set user name for display
          const displayName = userData.firstName && userData.lastName 
            ? `${userData.firstName} ${userData.lastName}`.trim()
            : userData.firstName || userData.lastName || appUser.displayName || appUser.email || 'User';
          this._userName.set(displayName);
        }
      }
    } catch (error) {
      this._error.set('Failed to load user profile');
    }
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: any): string {
    switch (error.code) {
      case 'auth/user-not-found':
        return 'No user found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/invalid-action-code':
        return 'The sign-in link is invalid or has expired.';
      case 'auth/expired-action-code':
        return 'The sign-in link has expired. Please request a new one.';
      case 'auth/invalid-email-verified':
        return 'The email address is not verified.';
      case 'auth/email-already-exists':
        return 'An account with this email already exists.';
      default:
        return error.message || 'An error occurred during authentication.';
    }
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this._error.set(null);
  }
}
