import { Injectable, signal, computed } from '@angular/core';
import { ChargingStation, StationStatus, ConnectorStatus } from '../models/station.model';
import { ChargingSession, SessionStatus } from '../models/session.model';
import { User } from '../models/user.model';

export interface AppState {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  
  // Stations state
  stations: ChargingStation[];
  selectedStation: ChargingStation | null;
  nearbyStations: ChargingStation[];
  favoriteStations: string[];
  
  // Sessions state
  activeSessions: ChargingSession[];
  sessionHistory: ChargingSession[];
  selectedSession: ChargingSession | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  currentLocation: { lat: number; lng: number } | null;
  
  // Filters and search
  stationFilters: {
    status: StationStatus[];
    connectorTypes: string[];
    minPower: number | null;
    maxPower: number | null;
    isAvailable: boolean | null;
    amenities: string[];
    priceRange: { min: number; max: number } | null;
  };
  
  searchQuery: string;
  mapView: {
    center: { lat: number; lng: number };
    zoom: number;
  };
}

const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  stations: [],
  selectedStation: null,
  nearbyStations: [],
  favoriteStations: [],
  activeSessions: [],
  sessionHistory: [],
  selectedSession: null,
  isLoading: false,
  error: null,
  currentLocation: null,
  stationFilters: {
    status: [],
    connectorTypes: [],
    minPower: null,
    maxPower: null,
    isAvailable: null,
    amenities: [],
    priceRange: null
  },
  searchQuery: '',
  mapView: {
    center: { lat: 40.4168, lng: -3.7038 }, // Madrid, Spain
    zoom: 13
  }
};

@Injectable({
  providedIn: 'root'
})
export class StateService {
  // Signals for reactive state management
  private readonly _state = signal<AppState>(initialState);
  
  // Public readonly signals
  readonly state = this._state.asReadonly();
  
  // Computed signals for derived state
  readonly user = computed(() => this._state().user);
  readonly isAuthenticated = computed(() => this._state().isAuthenticated);
  readonly stations = computed(() => this._state().stations);
  readonly selectedStation = computed(() => this._state().selectedStation);
  readonly nearbyStations = computed(() => this._state().nearbyStations);
  readonly favoriteStations = computed(() => this._state().favoriteStations);
  readonly activeSessions = computed(() => this._state().activeSessions);
  readonly sessionHistory = computed(() => this._state().sessionHistory);
  readonly selectedSession = computed(() => this._state().selectedSession);
  readonly isLoading = computed(() => this._state().isLoading);
  readonly error = computed(() => this._state().error);
  readonly currentLocation = computed(() => this._state().currentLocation);
  readonly stationFilters = computed(() => this._state().stationFilters);
  readonly searchQuery = computed(() => this._state().searchQuery);
  readonly mapView = computed(() => this._state().mapView);
  
  // Computed derived state
  readonly availableStations = computed(() => 
    this._state().stations.filter(station => 
      station.status === StationStatus.AVAILABLE
    )
  );
  
  readonly filteredStations = computed(() => {
    const stations = this._state().stations;
    const filters = this._state().stationFilters;
    const searchQuery = this._state().searchQuery.toLowerCase();
    
    return stations.filter(station => {
      // Search filter
      if (searchQuery && !station.name.toLowerCase().includes(searchQuery) && 
          !station.address.street.toLowerCase().includes(searchQuery)) {
        return false;
      }
      
      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(station.status)) {
        return false;
      }
      
      // Connector types filter
      if (filters.connectorTypes.length > 0) {
        const hasMatchingConnector = station.connectors.some(connector => 
          filters.connectorTypes.includes(connector.type)
        );
        if (!hasMatchingConnector) return false;
      }
      
      // Power range filter
      if (filters.minPower !== null) {
        const maxPower = Math.max(...station.connectors.map(c => c.power));
        if (maxPower < filters.minPower) return false;
      }
      
      if (filters.maxPower !== null) {
        const maxPower = Math.max(...station.connectors.map(c => c.power));
        if (maxPower > filters.maxPower) return false;
      }
      
      // Availability filter
      if (filters.isAvailable !== null) {
        const isAvailable = station.connectors.some(connector => 
          connector.status === ConnectorStatus.AVAILABLE
        );
        if (isAvailable !== filters.isAvailable) return false;
      }
      
      // Amenities filter
      if (filters.amenities.length > 0) {
        const hasAllAmenities = filters.amenities.every(amenity => 
          station.amenities.includes(amenity)
        );
        if (!hasAllAmenities) return false;
      }
      
      // Price range filter
      if (filters.priceRange) {
        const hasAffordableTariff = station.tariffs.some(tariff => 
          tariff.pricePerKwh >= filters.priceRange!.min && 
          tariff.pricePerKwh <= filters.priceRange!.max
        );
        if (!hasAffordableTariff) return false;
      }
      
      return true;
    });
  });
  
  readonly hasActiveSessions = computed(() => 
    this._state().activeSessions.length > 0
  );
  
  readonly totalEnergyDelivered = computed(() => 
    this._state().sessionHistory.reduce((total, session) => 
      total + session.energyDelivered, 0
    )
  );
  
  readonly totalCost = computed(() => 
    this._state().sessionHistory.reduce((total, session) => 
      total + (session.cost / 100), 0
    )
  );

  // User actions
  setUser(user: User | null): void {
    this.updateState({ user, isAuthenticated: !!user });
  }

  clearUser(): void {
    this.updateState({ user: null, isAuthenticated: false });
  }

  // Station actions
  setStations(stations: ChargingStation[]): void {
    this.updateState({ stations });
  }

  addStation(station: ChargingStation): void {
    const currentStations = this._state().stations;
    this.updateState({ stations: [...currentStations, station] });
  }

  updateStation(updatedStation: ChargingStation): void {
    const currentStations = this._state().stations;
    const stations = currentStations.map(station => 
      station.id === updatedStation.id ? updatedStation : station
    );
    this.updateState({ stations });
  }

  removeStation(stationId: string): void {
    const currentStations = this._state().stations;
    const stations = currentStations.filter(station => station.id !== stationId);
    this.updateState({ stations });
  }

  setSelectedStation(station: ChargingStation | null): void {
    this.updateState({ selectedStation: station });
  }

  setNearbyStations(stations: ChargingStation[]): void {
    this.updateState({ nearbyStations: stations });
  }

  addFavoriteStation(stationId: string): void {
    const currentFavorites = this._state().favoriteStations;
    if (!currentFavorites.includes(stationId)) {
      this.updateState({ 
        favoriteStations: [...currentFavorites, stationId] 
      });
    }
  }

  removeFavoriteStation(stationId: string): void {
    const currentFavorites = this._state().favoriteStations;
    this.updateState({ 
      favoriteStations: currentFavorites.filter(id => id !== stationId) 
    });
  }

  // Session actions
  setActiveSessions(sessions: ChargingSession[]): void {
    this.updateState({ activeSessions: sessions });
  }

  addActiveSession(session: ChargingSession): void {
    const currentSessions = this._state().activeSessions;
    this.updateState({ activeSessions: [...currentSessions, session] });
  }

  updateActiveSession(updatedSession: ChargingSession): void {
    const currentSessions = this._state().activeSessions;
    const sessions = currentSessions.map(session => 
      session.id === updatedSession.id ? updatedSession : session
    );
    this.updateState({ activeSessions: sessions });
  }

  removeActiveSession(sessionId: string): void {
    const currentSessions = this._state().activeSessions;
    this.updateState({ 
      activeSessions: currentSessions.filter(session => session.id !== sessionId) 
    });
  }

  setSessionHistory(sessions: ChargingSession[]): void {
    this.updateState({ sessionHistory: sessions });
  }

  addSessionToHistory(session: ChargingSession): void {
    const currentHistory = this._state().sessionHistory;
    this.updateState({ 
      sessionHistory: [session, ...currentHistory] 
    });
  }

  setSelectedSession(session: ChargingSession | null): void {
    this.updateState({ selectedSession: session });
  }

  // UI actions
  setLoading(loading: boolean): void {
    this.updateState({ isLoading: loading });
  }

  setError(error: string | null): void {
    this.updateState({ error });
  }

  clearError(): void {
    this.updateState({ error: null });
  }

  setCurrentLocation(location: { lat: number; lng: number } | null): void {
    this.updateState({ currentLocation: location });
  }

  // Filter actions
  setStationFilters(filters: Partial<AppState['stationFilters']>): void {
    const currentFilters = this._state().stationFilters;
    this.updateState({ 
      stationFilters: { ...currentFilters, ...filters } 
    });
  }

  clearStationFilters(): void {
    this.updateState({ stationFilters: initialState.stationFilters });
  }

  setSearchQuery(query: string): void {
    this.updateState({ searchQuery: query });
  }

  clearSearchQuery(): void {
    this.updateState({ searchQuery: '' });
  }

  // Map actions
  setMapView(center: { lat: number; lng: number }, zoom: number): void {
    this.updateState({ 
      mapView: { center, zoom } 
    });
  }

  // Utility methods
  private updateState(updates: Partial<AppState>): void {
    const currentState = this._state();
    const newState = { ...currentState, ...updates };
    this._state.set(newState);
  }

  // Reset state
  resetState(): void {
    this._state.set(initialState);
  }

  // Get current state snapshot
  getCurrentState(): AppState {
    return this._state();
  }
}
