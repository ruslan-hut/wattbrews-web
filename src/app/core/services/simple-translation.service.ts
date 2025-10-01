import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SimpleTranslationService {
  private readonly http = inject(HttpClient);
  private translations: { [key: string]: any } = {};
  private currentLang = 'es';
  
  // Signals for reactive state management
  private readonly _currentLanguage = signal<string>(this.currentLang);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _availableLanguages = signal<string[]>(['en', 'es']);
  
  // Public readonly signals
  readonly currentLanguage = this._currentLanguage.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly availableLanguages = this._availableLanguages.asReadonly();
  
  // BehaviorSubjects for compatibility
  private languageSubject = new BehaviorSubject<string>(this.currentLang);
  public language$ = this.languageSubject.asObservable();
  
  constructor() {
    this.initializeTranslation();
  }
  
  /**
   * Initialize translation service
   */
  private initializeTranslation(): void {
    // Try to get language from storage or browser
    const savedLanguage = this.getSavedLanguage();
    const browserLanguage = this.getBrowserLanguage();
    const languageToUse = savedLanguage || browserLanguage || 'es';
    
    // Load translations synchronously for immediate use
    this.loadTranslationsSync(languageToUse);
    this.currentLang = languageToUse;
    this._currentLanguage.set(languageToUse);
    this.languageSubject.next(languageToUse);
  }
  
  /**
   * Load translations synchronously for immediate use
   */
  private loadTranslationsSync(language: string): void {
    // For now, we'll load the default language synchronously
    // This is a fallback to ensure translations work immediately
    if (language === 'en') {
      this.translations['en'] = {
        "app": {"title": "WattBrews"},
        "nav": {"dashboard": "Dashboard", "profile": "Profile", "home": "Home", "stations": "Stations", "my": "My Charges", "auth": "Sign In"},
        "language": {
          "switcher": "Change language",
          "english": "English",
          "spanish": "Español"
        },
        "auth": {"title": "Sign in", "google": "Continue with Google", "email": "Email", "password": "Password", "signin": "Sign in", "signout": "Sign out"},
        "session": {"active": "Active sessions", "history": "History", "stop": "Stop", "cost": "Cost", "energy": "Energy", "duration": "Duration"},
        "dashboard": {
          "title": "Welcome to WattBrews",
          "subtitle": "Choose a charger to start your charging session",
          "recentChargePoints": "Recent Charge Points",
          "recentTransactions": "Recent Transactions",
          "overview": "Overview",
          "loadingChargePoints": "Loading charge points...",
          "loadingOverview": "Loading overview...",
          "connectors": "Connectors",
          "duration": "Duration",
          "total": "Total",
          "online": "Online",
          "available": "Available",
          "noRecentChargePoints": "No recent charge points found",
          "noTransactions": "No recent transactions found",
          "noChargePoints": "No charge points available",
          "findStations": "Find Stations",
          "viewAllChargePoints": "View All Charge Points",
          "viewAllTransactions": "View All Transactions",
          "timeFormat": {
            "daysAgo": "{{count}} day ago",
            "daysAgo_plural": "{{count}} days ago",
            "hoursAgo": "{{count}} hour ago",
            "hoursAgo_plural": "{{count}} hours ago",
            "minutesAgo": "{{count}} minute ago",
            "minutesAgo_plural": "{{count}} minutes ago"
          },
          "tooltips": {
            "stationOffline": "Station is offline",
            "stationDisabled": "Station is disabled",
            "noAvailableConnectors": "No available connectors",
            "startCharging": "Start charging session"
          }
        },
        "stations": {
          "title": "Charging Stations",
          "subtitle": "Find and connect to charging stations near you",
          "searchLabel": "Search stations",
          "searchPlaceholder": "Search by station name, address, or vendor...",
          "loadingStations": "Loading charging stations...",
          "connectors": "Connectors",
          "ofConnectorsAvailable": "of {{total}} connectors available",
          "startCharge": "Start Charge",
          "start": "Start",
          "viewDetails": "View Details",
          "noStationsFound": "No stations found",
          "tryAdjustingSearch": "Try adjusting your search criteria",
          "noStationsAvailable": "No charging stations are currently available",
          "tooltips": {
            "accessRequired": "Access level 5+ required to view details",
            "viewDetails": "View detailed station information",
            "stationOffline": "Station is offline",
            "stationDisabled": "Station is disabled",
            "noAvailableConnectors": "No available connectors",
            "startCharging": "Start charging session"
          }
        },
        "stationDetail": {
          "title": "Station Details",
          "loading": "Loading station details...",
          "tryAgain": "Try Again",
          "basicInformation": "Basic Information",
          "statusInformation": "Status Information",
          "location": "Location",
          "connectors": "Connectors",
          "labels": {
            "address": "Address",
            "vendor": "Vendor",
            "model": "Model",
            "serialNumber": "Serial Number",
            "firmwareVersion": "Firmware Version",
            "lastSeen": "Last Seen",
            "currentStatus": "Current Status",
            "errorCode": "Error Code",
            "connection": "Connection",
            "availability": "Availability",
            "info": "Info:",
            "statusTime": "Status Time:",
            "eventTime": "Event Time:",
            "coordinates": "Coordinates",
            "connector": "Connector",
            "type": "Type:",
            "power": "Power:",
            "vendorWithColon": "Vendor:",
            "errorCodeWithColon": "Error Code:",
            "transactionId": "Transaction ID:",
            "statusTimeWithColon": "Status Time:"
          },
          "status": {
            "online": "Online",
            "offline": "Offline",
            "enabled": "Enabled",
            "disabled": "Disabled"
          },
          "actions": {
            "startCharge": "Start Charge",
            "startChargeInfo": "Click to begin charging at this station"
          }
        },
        "chargeInitiation": {
          "title": "Start Charging",
          "loadingStationDetails": "Loading station details...",
          "selectConnector": "Select Connector",
          "selectConnectorSubtitle": "Choose a connector to start charging",
          "connector": "Connector",
          "type": "Type:",
          "power": "Power:",
          "paymentMethod": "Payment Method",
          "paymentMethodSubtitle": "Choose your preferred payment method",
          "loadingPaymentMethods": "Loading payment methods...",
          "failedToLoadPaymentMethods": "Failed to load payment methods:",
          "noPaymentMethods": "No payment methods available. Please add a payment method in your profile.",
          "addPaymentMethod": "Add Payment Method",
          "tariffInformation": "Tariff Information",
          "loadingTariffInformation": "Loading tariff information...",
          "failedToLoadTariffInformation": "Failed to load tariff information:",
          "pricePerKwh": "Price per kWh:",
          "pricePerHour": "Price per Hour:",
          "selectedConnector": "Selected: Connector",
          "startCharge": "Start Charge",
          "selectConnectorToStart": "Please select an available connector to start charging.",
          "selectPaymentMethodToStart": "Please select a payment method to start charging"
        },
        "common": {
          "buttons": {
            "save": "Save",
            "signIn": "Sign In",
            "tryAgain": "Try Again",
            "clearSearch": "Clear Search",
            "refresh": "Refresh"
          },
          "units": {
            "kW": "kW",
            "kWh": "kWh"
          }
        },
        "pages": {
          "sessions": {
            "history": {
              "title": "Session History",
              "subtitle": "View and manage your charging session history",
              "loadingTransactions": "Loading transactions...",
              "noTransactions": "No transactions found",
              "auth": {
                "checking": "Checking Authentication...",
                "checkingMessage": "Please wait while we verify your login status.",
                "required": "Authentication Required",
                "requiredMessage": "You need to be logged in to view your session history. Please sign in to continue.",
                "signIn": "Sign In"
              },
              "stats": {
                "totalEnergy": "Total Energy (kWh)",
                "totalCost": "Total Cost",
                "completedSessions": "Completed Sessions"
              },
              "filters": {
                "searchLabel": "Search transactions",
                "searchPlaceholder": "Search by transaction ID, station name, or ID tag...",
                "monthLabel": "Month",
                "monthPlaceholder": "Select month",
                "clearMonthTooltip": "Clear month filter"
              },
              "table": {
                "title": "Transaction History",
                "columns": {
                  "id": "ID",
                  "status": "Status",
                  "station": "Station",
                  "energy": "Energy",
                  "duration": "Duration",
                  "payment": "Payment",
                  "startTime": "Start Time",
                  "endTime": "End Time",
                  "actions": "Actions"
                },
                "status": {
                  "completed": "Completed",
                  "inProgress": "In Progress"
                },
                "connector": "Connector",
                "free": "Free",
                "viewDetailsTooltip": "View Details"
              },
              "mobile": {
                "station": "Station",
                "connector": "Connector",
                "energy": "Energy",
                "duration": "Duration",
                "cost": "Cost"
              },
              "noData": {
                "searchCriteria": "Try adjusting your search criteria",
                "noSessions": "You haven't made any charging sessions yet"
              },
              "buttons": {
                "retry": "Retry"
              }
            }
          }
        },
        "transactionDetails": {
          "title": "Transaction Details",
          "loading": "Loading transaction details...",
          "retry": "Retry",
          "close": "Close",
          "overview": {
            "station": "Station",
            "connector": "Connector",
            "duration": "Duration",
            "energyConsumed": "Energy Consumed",
            "cost": "Cost",
            "averagePower": "Average Power"
          },
          "timing": {
            "title": "Timing",
            "started": "Started:",
            "ended": "Ended:"
          },
          "chart": {
            "title": "Energy Consumption Over Time"
          }
        },
        "profile": {
          "title": "Profile",
          "checkingAuth": "Checking authentication...",
          "authRequired": "Authentication Required",
          "authRequiredMessage": "You need to be logged in to view your profile. Please sign in to continue.",
          "loadingUserInfo": "Loading user information...",
          "basicInformation": "Basic Information",
          "paymentPlansTab": "Payment Plans",
          "userTagsTab": "User Tags",
          "paymentMethodsTab": "Payment Methods",
          "labels": {
            "username": "Username",
            "name": "Name",
            "email": "Email",
            "role": "Role",
            "accessLevel": "Access Level",
            "registrationDate": "Registration Date",
            "lastSeen": "Last Seen",
            "note": "Note:",
            "lastSeenWithColon": "Last Seen:",
            "registered": "Registered:",
            "country": "Country:",
            "expires": "Expires:",
            "merchantId": "Merchant ID:"
          },
          "roles": {
            "admin": "Admin",
            "user": "User"
          },
          "paymentPlans": {
            "title": "Tariff Plans",
            "default": "Default",
            "active": "Active",
            "start": "Start:",
            "end": "End:",
            "noPlans": "No payment plans available"
          },
          "userTags": {
            "title": "Registered Tags",
            "enabled": "Enabled",
            "local": "Local",
            "noNote": "No note",
            "noTags": "No user tags registered"
          },
          "paymentMethods": {
            "title": "Payment Methods",
            "default": "Default",
            "failures": "failures",
            "noMethods": "No payment methods registered"
          }
        }
      };
    } else {
      this.translations['es'] = {
        "app": {"title": "WattBrews"},
        "nav": {"dashboard": "Tablero", "profile": "Perfil", "home": "Inicio", "stations": "Estaciones de carga", "my": "Mis Cargas", "auth": "Iniciar sesión"},
        "language": {
          "switcher": "Selector de idioma",
          "english": "English",
          "spanish": "Español"
        },
        "auth": {"title": "Acceder", "google": "Continuar con Google", "email": "Correo", "password": "Contraseña", "signin": "Entrar", "signout": "Cerrar sesión"},
        "session": {"active": "Activa", "history": "Historial", "stop": "Detener", "cost": "Costo", "energy": "Energía", "duration": "Duración"},
        "dashboard": {
          "title": "Bienvenido a WattBrews",
          "subtitle": "Elige un cargador para iniciar tu sesión de carga",
          "recentChargePoints": "Puntos de Carga Recientes",
          "recentTransactions": "Transacciones Recientes",
          "overview": "Resumen",
          "loadingChargePoints": "Cargando puntos de carga...",
          "loadingOverview": "Cargando resumen...",
          "connectors": "Conectores",
          "duration": "Duración",
          "total": "Total",
          "online": "En Línea",
          "available": "Disponibles",
          "noRecentChargePoints": "No se encontraron puntos de carga recientes",
          "noTransactions": "No se encontraron transacciones recientes",
          "noChargePoints": "No hay puntos de carga disponibles",
          "findStations": "Buscar Estaciones",
          "viewAllChargePoints": "Ver Todos los Puntos de Carga",
          "viewAllTransactions": "Ver Todas las Transacciones",
          "timeFormat": {
            "daysAgo": "hace {{count}} día",
            "daysAgo_plural": "hace {{count}} días",
            "hoursAgo": "hace {{count}} hora",
            "hoursAgo_plural": "hace {{count}} horas",
            "minutesAgo": "hace {{count}} minuto",
            "minutesAgo_plural": "hace {{count}} minutos"
          },
          "tooltips": {
            "stationOffline": "La estación está desconectada",
            "stationDisabled": "La estación está deshabilitada",
            "noAvailableConnectors": "No hay conectores disponibles",
            "startCharging": "Iniciar sesión de carga"
          }
        },
        "stations": {
          "title": "Estaciones de Carga",
          "subtitle": "Encuentra y conéctate a estaciones de carga cerca de ti",
          "searchLabel": "Buscar estaciones",
          "searchPlaceholder": "Buscar por nombre de estación, dirección o fabricante...",
          "loadingStations": "Cargando estaciones de carga...",
          "connectors": "Conectores",
          "ofConnectorsAvailable": "de {{total}} conectores disponibles",
          "startCharge": "Iniciar Carga",
          "start": "Iniciar",
          "viewDetails": "Ver Detalles",
          "noStationsFound": "No se encontraron estaciones",
          "tryAdjustingSearch": "Intenta ajustar tus criterios de búsqueda",
          "noStationsAvailable": "No hay estaciones de carga disponibles actualmente",
          "tooltips": {
            "accessRequired": "Se requiere nivel de acceso 5+ para ver detalles",
            "viewDetails": "Ver información detallada de la estación",
            "stationOffline": "La estación está desconectada",
            "stationDisabled": "La estación está deshabilitada",
            "noAvailableConnectors": "No hay conectores disponibles",
            "startCharging": "Iniciar sesión de carga"
          }
        },
        "stationDetail": {
          "title": "Detalles de la Estación",
          "loading": "Cargando detalles de la estación...",
          "tryAgain": "Intentar de Nuevo",
          "basicInformation": "Información Básica",
          "statusInformation": "Información de Estado",
          "location": "Ubicación",
          "connectors": "Conectores",
          "labels": {
            "address": "Dirección",
            "vendor": "Fabricante",
            "model": "Modelo",
            "serialNumber": "Número de Serie",
            "firmwareVersion": "Versión del Firmware",
            "lastSeen": "Última Vez Visto",
            "currentStatus": "Estado Actual",
            "errorCode": "Código de Error",
            "connection": "Conexión",
            "availability": "Disponibilidad",
            "info": "Info:",
            "statusTime": "Hora del Estado:",
            "eventTime": "Hora del Evento:",
            "coordinates": "Coordenadas",
            "connector": "Conector",
            "type": "Tipo:",
            "power": "Potencia:",
            "vendorWithColon": "Fabricante:",
            "errorCodeWithColon": "Código de Error:",
            "transactionId": "ID de Transacción:",
            "statusTimeWithColon": "Hora del Estado:"
          },
          "status": {
            "online": "En Línea",
            "offline": "Desconectado",
            "enabled": "Habilitado",
            "disabled": "Deshabilitado"
          },
          "actions": {
            "startCharge": "Iniciar Carga",
            "startChargeInfo": "Haz clic para comenzar a cargar en esta estación"
          }
        },
        "chargeInitiation": {
          "title": "Iniciar Carga",
          "loadingStationDetails": "Cargando detalles de la estación...",
          "selectConnector": "Seleccionar Conector",
          "selectConnectorSubtitle": "Elige un conector para iniciar la carga",
          "connector": "Conector",
          "type": "Tipo:",
          "power": "Potencia:",
          "paymentMethod": "Método de Pago",
          "paymentMethodSubtitle": "Elige tu método de pago preferido",
          "loadingPaymentMethods": "Cargando métodos de pago...",
          "failedToLoadPaymentMethods": "Error al cargar métodos de pago:",
          "noPaymentMethods": "No hay métodos de pago disponibles. Por favor añade un método de pago en tu perfil.",
          "addPaymentMethod": "Añadir Método de Pago",
          "tariffInformation": "Información de Tarifas",
          "loadingTariffInformation": "Cargando información de tarifas...",
          "failedToLoadTariffInformation": "Error al cargar información de tarifas:",
          "pricePerKwh": "Precio por kWh:",
          "pricePerHour": "Precio por Hora:",
          "selectedConnector": "Seleccionado: Conector",
          "startCharge": "Iniciar Carga",
          "selectConnectorToStart": "Por favor selecciona un conector disponible para iniciar la carga.",
          "selectPaymentMethodToStart": "Por favor selecciona un método de pago para iniciar la carga"
        },
        "common": {
          "buttons": {
            "save": "Guardar",
            "signIn": "Iniciar Sesión",
            "tryAgain": "Intentar de Nuevo",
            "clearSearch": "Limpiar Búsqueda",
            "refresh": "Actualizar"
          },
          "units": {
            "kW": "kW",
            "kWh": "kWh"
          }
        },
        "pages": {
          "sessions": {
            "history": {
              "title": "Historial de Sesiones",
              "subtitle": "Ver y gestionar tu historial de sesiones de carga",
              "loadingTransactions": "Cargando transacciones...",
              "noTransactions": "No se encontraron transacciones",
              "auth": {
                "checking": "Verificando Autenticación...",
                "checkingMessage": "Por favor espera mientras verificamos tu estado de inicio de sesión.",
                "required": "Autenticación Requerida",
                "requiredMessage": "Necesitas estar conectado para ver tu historial de sesiones. Por favor inicia sesión para continuar.",
                "signIn": "Iniciar Sesión"
              },
              "stats": {
                "totalEnergy": "Energía Total (kWh)",
                "totalCost": "Costo Total",
                "completedSessions": "Sesiones Completadas"
              },
              "filters": {
                "searchLabel": "Buscar transacciones",
                "searchPlaceholder": "Buscar por ID de transacción, nombre de estación o etiqueta ID...",
                "monthLabel": "Mes",
                "monthPlaceholder": "Seleccionar mes",
                "clearMonthTooltip": "Limpiar filtro de mes"
              },
              "table": {
                "title": "Historial de Transacciones",
                "columns": {
                  "id": "ID",
                  "status": "Estado",
                  "station": "Estación",
                  "energy": "Energía",
                  "duration": "Duración",
                  "payment": "Pago",
                  "startTime": "Hora de Inicio",
                  "endTime": "Hora de Fin",
                  "actions": "Acciones"
                },
                "status": {
                  "completed": "Completada",
                  "inProgress": "En Progreso"
                },
                "connector": "Conector",
                "free": "Gratis",
                "viewDetailsTooltip": "Ver Detalles"
              },
              "mobile": {
                "station": "Estación",
                "connector": "Conector",
                "energy": "Energía",
                "duration": "Duración",
                "cost": "Costo"
              },
              "noData": {
                "searchCriteria": "Intenta ajustar tus criterios de búsqueda",
                "noSessions": "Aún no has realizado ninguna sesión de carga"
              },
              "buttons": {
                "retry": "Reintentar"
              }
            }
          }
        },
        "transactionDetails": {
          "title": "Detalles de la Transacción",
          "loading": "Cargando detalles de la transacción...",
          "retry": "Reintentar",
          "close": "Cerrar",
          "overview": {
            "station": "Estación",
            "connector": "Conector",
            "duration": "Duración",
            "energyConsumed": "Energía Consumida",
            "cost": "Costo",
            "averagePower": "Potencia Promedio"
          },
          "timing": {
            "title": "Tiempo",
            "started": "Iniciado:",
            "ended": "Finalizado:"
          },
          "chart": {
            "title": "Consumo de Energía en el Tiempo"
          }
        },
        "profile": {
          "title": "Perfil",
          "checkingAuth": "Verificando autenticación...",
          "authRequired": "Autenticación Requerida",
          "authRequiredMessage": "Necesitas estar conectado para ver tu perfil. Por favor inicia sesión para continuar.",
          "loadingUserInfo": "Cargando información del usuario...",
          "basicInformation": "Información Básica",
          "paymentPlansTab": "Planes de Pago",
          "userTagsTab": "Etiquetas de Usuario",
          "paymentMethodsTab": "Métodos de Pago",
          "labels": {
            "username": "Nombre de Usuario",
            "name": "Nombre",
            "email": "Correo Electrónico",
            "role": "Rol",
            "accessLevel": "Nivel de Acceso",
            "registrationDate": "Fecha de Registro",
            "lastSeen": "Última Vez Visto",
            "note": "Nota:",
            "lastSeenWithColon": "Última Vez Visto:",
            "registered": "Registrado:",
            "country": "País:",
            "expires": "Expira:",
            "merchantId": "ID del Comerciante:"
          },
          "roles": {
            "admin": "Administrador",
            "user": "Usuario"
          },
          "paymentPlans": {
            "title": "Planes de Tarifas",
            "default": "Por Defecto",
            "active": "Activo",
            "start": "Inicio:",
            "end": "Fin:",
            "noPlans": "No hay planes de pago disponibles"
          },
          "userTags": {
            "title": "Etiquetas Registradas",
            "enabled": "Habilitado",
            "local": "Local",
            "noNote": "Sin nota",
            "noTags": "No hay etiquetas de usuario registradas"
          },
          "paymentMethods": {
            "title": "Métodos de Pago",
            "default": "Por Defecto",
            "failures": "fallos",
            "noMethods": "No hay métodos de pago registrados"
          }
        }
      };
    }
  }
  
  /**
   * Set current language
   */
  async setLanguage(language: string): Promise<void> {
    if (!this._availableLanguages().includes(language)) {
      console.warn(`Language ${language} is not supported`);
      return;
    }
    
    try {
      this._isLoading.set(true);
      
      // Try to load translations from server first
      try {
      await this.loadTranslations(language);
      } catch (error) {
        console.warn(`Failed to load translations from server for ${language}, using fallback`);
        // Fallback to synchronous loading
        this.loadTranslationsSync(language);
      }
      
      this.currentLang = language;
      this._currentLanguage.set(language);
      this.languageSubject.next(language);
      
      // Save to storage
      this.saveLanguage(language);
      
    } catch (error) {
      console.error('Error setting language:', error);
      // Final fallback to synchronous loading
      this.loadTranslationsSync(language);
      this.currentLang = language;
      this._currentLanguage.set(language);
      this.languageSubject.next(language);
    } finally {
      this._isLoading.set(false);
    }
  }
  
  /**
   * Load translations for a language
   */
  private async loadTranslations(language: string): Promise<void> {
    try {
      const response = await this.http.get(`/assets/i18n/${language}.json`).toPromise();
      this.translations[language] = response;
    } catch (error) {
      console.error(`Error loading translations for ${language}:`, error);
      // Fallback to empty object
      this.translations[language] = {};
    }
  }
  
  /**
   * Get translation for key
   */
  get(key: string, params?: any): string {
    const translation = this.getNestedTranslation(this.translations[this.currentLang], key);
    if (!translation) {
      // Debug logging for missing translations
      this.logMissingTranslation(key);
      return key;
    }
    
    // Simple parameter replacement
    if (params && typeof translation === 'string') {
      return translation.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return params[paramKey] || match;
      });
    }
    
    return translation;
  }

  /**
   * Get reactive translation for key (triggers change detection)
   */
  getReactive(key: string, params?: any): string {
    // Access the current language signal to make this reactive
    const currentLang = this._currentLanguage();
    
    // Handle nested keys like 'app.title' -> translations.app.title
    const translation = this.getNestedTranslation(this.translations[currentLang], key);
    
    if (!translation) {
      // Debug logging for missing translations
      console.warn(`🌐 Translation not found for key: "${key}" in language: "${currentLang}"`);
      this.logMissingTranslation(key);
      return key;
    }
    
    // Simple parameter replacement
    if (params && typeof translation === 'string') {
      return translation.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return params[paramKey] || match;
      });
    }
    
    return translation;
  }

  /**
   * Get nested translation value from object using dot notation
   */
  private getNestedTranslation(obj: any, key: string): string | undefined {
    if (!obj || !key) return undefined;
    
    const keys = key.split('.');
    let current = obj;
    
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return undefined;
      }
    }
    
    return typeof current === 'string' ? current : undefined;
  }
  
  /**
   * Log missing translation key for debugging
   */
  private logMissingTranslation(key: string): void {
    const missingKey = {
      key,
      language: this.currentLang,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
    
    // Store in localStorage for collection
    try {
      const existingMissing = JSON.parse(localStorage.getItem('missingTranslations') || '[]');
      const isAlreadyLogged = existingMissing.some((item: any) => 
        item.key === key && item.language === this.currentLang
      );
      
      if (!isAlreadyLogged) {
        existingMissing.push(missingKey);
        localStorage.setItem('missingTranslations', JSON.stringify(existingMissing));
        console.warn(`🌐 Missing translation: "${key}" in ${this.currentLang}`, missingKey);
      }
    } catch (error) {
      console.error('Error logging missing translation:', error);
    }
  }

  /**
   * Scan for all translation keys used in the application
   */
  scanForTranslationKeys(): string[] {
    const keys = new Set<string>();
    
    // Scan DOM for translation service calls
    const elements = document.querySelectorAll('*');
    elements.forEach(element => {
      // Look for text content that might contain translation keys
      const textContent = element.textContent || '';
      
      // Look for patterns like translationService.get('key') or translationService.getReactive('key')
      const translationPattern = /translationService\.(get|getReactive)\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
      let match;
      while ((match = translationPattern.exec(textContent)) !== null) {
        keys.add(match[2]);
      }
    });
    
    // Also scan the HTML source for translation patterns
    const htmlContent = document.documentElement.outerHTML;
    const htmlPattern = /translationService\.(get|getReactive)\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
    let htmlMatch;
    while ((htmlMatch = htmlPattern.exec(htmlContent)) !== null) {
      keys.add(htmlMatch[2]);
    }
    
    return Array.from(keys);
  }

  /**
   * Check for missing translations by comparing used keys with available translations
   */
  checkForMissingTranslations(): any[] {
    const usedKeys = this.scanForTranslationKeys();
    const currentLang = this._currentLanguage();
    const availableTranslations = this.translations[currentLang] || {};
    const missing: any[] = [];
    
    usedKeys.forEach(key => {
      const translation = this.getNestedTranslation(availableTranslations, key);
      if (!translation) {
        missing.push({
          key,
          language: currentLang,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          type: 'missing'
        });
      }
    });
    
    return missing;
  }
  
  /**
   * Get all missing translation keys (for debugging)
   */
  getMissingTranslations(): any[] {
    try {
      return JSON.parse(localStorage.getItem('missingTranslations') || '[]');
    } catch (error) {
      console.error('Error getting missing translations:', error);
      return [];
    }
  }
  
  /**
   * Clear missing translations log (for debugging)
   */
  clearMissingTranslations(): void {
    localStorage.removeItem('missingTranslations');
    console.log('🌐 Missing translations log cleared');
  }
  
  /**
   * Get translation as observable
   */
  get$(key: string, params?: any): Observable<string> {
    return this.language$.pipe(
      map(() => this.get(key, params))
    );
  }
  
  /**
   * Get current language from browser
   */
  private getBrowserLanguage(): string | null {
    const browserLang = navigator.language || (navigator as any).userLanguage;
    if (!browserLang) return null;
    
    // Extract language code (e.g., 'en-US' -> 'en')
    const languageCode = browserLang.split('-')[0];
    
    return this._availableLanguages().includes(languageCode) ? languageCode : null;
  }
  
  /**
   * Get saved language from storage
   */
  private getSavedLanguage(): string | null {
    try {
      return localStorage.getItem('language');
    } catch (error) {
      console.error('Error getting saved language:', error);
      return null;
    }
  }
  
  /**
   * Save language to storage
   */
  private saveLanguage(language: string): void {
    try {
      localStorage.setItem('language', language);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  }
  
  /**
   * Get language display name
   */
  getLanguageDisplayName(languageCode: string): string {
    const languageNames: { [key: string]: string } = {
      'en': 'English',
      'es': 'Español',
      'fr': 'Français',
      'de': 'Deutsch',
      'it': 'Italiano',
      'pt': 'Português',
      'ar': 'العربية',
      'he': 'עברית',
      'fa': 'فارسی',
      'ur': 'اردو'
    };
    
    return languageNames[languageCode] || languageCode.toUpperCase();
  }
  
  /**
   * Get current language display name
   */
  getCurrentLanguageDisplayName(): string {
    return this.getLanguageDisplayName(this._currentLanguage());
  }
  
  /**
   * Get available languages with display names
   */
  getAvailableLanguagesWithNames(): Array<{ code: string; name: string }> {
    return this._availableLanguages().map(code => ({
      code,
      name: this.getLanguageDisplayName(code)
    }));
  }
}
