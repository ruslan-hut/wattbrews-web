export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  roles: string[];
  createdAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}

export interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: Address;
  preferences: UserPreferences;
  paymentMethods: PaymentMethod[];
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface UserPreferences {
  language: string;
  currency: string;
  notifications: NotificationSettings;
  theme: 'light' | 'dark' | 'auto';
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  chargingUpdates: boolean;
  promotions: boolean;
}

export interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'debit_card' | 'wallet';
  last4: string;
  brand: string;
  isDefault: boolean;
  expiresAt?: Date;
}
