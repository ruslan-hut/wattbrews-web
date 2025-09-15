import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface MapConfig {
  center: { lat: number; lng: number };
  zoom: number;
  minZoom?: number;
  maxZoom?: number;
  style?: 'light' | 'dark' | 'satellite' | 'terrain';
}

export interface MapMarker {
  id: string;
  position: { lat: number; lng: number };
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  draggable?: boolean;
  data?: any;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

@Injectable({
  providedIn: 'root'
})
export class MapService {
  // Signals for reactive state management
  private readonly _mapInstance = signal<any>(null);
  private readonly _markers = signal<MapMarker[]>([]);
  private readonly _selectedMarker = signal<MapMarker | null>(null);
  private readonly _mapConfig = signal<MapConfig>({
    center: { lat: 40.4168, lng: -3.7038 }, // Madrid, Spain
    zoom: 13,
    minZoom: 5,
    maxZoom: 18
  });
  private readonly _isMapReady = signal<boolean>(false);
  private readonly _userLocation = signal<{ lat: number; lng: number } | null>(null);

  // Public readonly signals
  readonly mapInstance = this._mapInstance.asReadonly();
  readonly markers = this._markers.asReadonly();
  readonly selectedMarker = this._selectedMarker.asReadonly();
  readonly mapConfig = this._mapConfig.asReadonly();
  readonly isMapReady = this._isMapReady.asReadonly();
  readonly userLocation = this._userLocation.asReadonly();

  // Computed signals
  readonly mapCenter = computed(() => this._mapConfig().center);
  readonly mapZoom = computed(() => this._mapConfig().zoom);
  readonly hasMarkers = computed(() => this._markers().length > 0);

  // BehaviorSubjects for compatibility
  private mapInstanceSubject = new BehaviorSubject<any>(null);
  private markersSubject = new BehaviorSubject<MapMarker[]>([]);
  private selectedMarkerSubject = new BehaviorSubject<MapMarker | null>(null);

  public mapInstance$ = this.mapInstanceSubject.asObservable();
  public markers$ = this.markersSubject.asObservable();
  public selectedMarker$ = this.selectedMarkerSubject.asObservable();

  /**
   * Initialize map with configuration
   */
  initializeMap(containerId: string, config?: Partial<MapConfig>): void {
    try {
      // This would typically initialize Leaflet map
      // For now, we'll simulate the initialization
      const mapConfig = { ...this._mapConfig(), ...config };
      this._mapConfig.set(mapConfig);
      this._isMapReady.set(true);
      
      console.log('Map initialized with config:', mapConfig);
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  /**
   * Set map instance (called by map component)
   */
  setMapInstance(mapInstance: any): void {
    this._mapInstance.set(mapInstance);
    this.mapInstanceSubject.next(mapInstance);
  }

  /**
   * Update map configuration
   */
  updateMapConfig(config: Partial<MapConfig>): void {
    const currentConfig = this._mapConfig();
    const newConfig = { ...currentConfig, ...config };
    this._mapConfig.set(newConfig);
  }

  /**
   * Set map center
   */
  setMapCenter(center: { lat: number; lng: number }): void {
    this.updateMapConfig({ center });
    // In a real implementation, this would update the actual map
    console.log('Map center set to:', center);
  }

  /**
   * Set map zoom level
   */
  setMapZoom(zoom: number): void {
    this.updateMapConfig({ zoom });
    // In a real implementation, this would update the actual map
    console.log('Map zoom set to:', zoom);
  }

  /**
   * Fit map to bounds
   */
  fitToBounds(bounds: MapBounds): void {
    // In a real implementation, this would fit the map to the bounds
    console.log('Fitting map to bounds:', bounds);
  }

  /**
   * Add marker to map
   */
  addMarker(marker: MapMarker): void {
    const currentMarkers = this._markers();
    const existingIndex = currentMarkers.findIndex(m => m.id === marker.id);
    
    if (existingIndex >= 0) {
      // Update existing marker
      const updatedMarkers = [...currentMarkers];
      updatedMarkers[existingIndex] = marker;
      this._markers.set(updatedMarkers);
    } else {
      // Add new marker
      this._markers.set([...currentMarkers, marker]);
    }
    
    this.markersSubject.next(this._markers());
  }

  /**
   * Add multiple markers
   */
  addMarkers(markers: MapMarker[]): void {
    const currentMarkers = this._markers();
    const newMarkers = [...currentMarkers];
    
    markers.forEach(marker => {
      const existingIndex = newMarkers.findIndex(m => m.id === marker.id);
      if (existingIndex >= 0) {
        newMarkers[existingIndex] = marker;
      } else {
        newMarkers.push(marker);
      }
    });
    
    this._markers.set(newMarkers);
    this.markersSubject.next(newMarkers);
  }

  /**
   * Remove marker from map
   */
  removeMarker(markerId: string): void {
    const currentMarkers = this._markers();
    const filteredMarkers = currentMarkers.filter(m => m.id !== markerId);
    this._markers.set(filteredMarkers);
    this.markersSubject.next(filteredMarkers);
  }

  /**
   * Clear all markers
   */
  clearMarkers(): void {
    this._markers.set([]);
    this.markersSubject.next([]);
  }

  /**
   * Select marker
   */
  selectMarker(markerId: string): void {
    const marker = this._markers().find(m => m.id === markerId);
    this._selectedMarker.set(marker || null);
    this.selectedMarkerSubject.next(marker || null);
  }

  /**
   * Clear selected marker
   */
  clearSelectedMarker(): void {
    this._selectedMarker.set(null);
    this.selectedMarkerSubject.next(null);
  }

  /**
   * Get marker by ID
   */
  getMarker(markerId: string): MapMarker | undefined {
    return this._markers().find(m => m.id === markerId);
  }

  /**
   * Update marker
   */
  updateMarker(markerId: string, updates: Partial<MapMarker>): void {
    const currentMarkers = this._markers();
    const markerIndex = currentMarkers.findIndex(m => m.id === markerId);
    
    if (markerIndex >= 0) {
      const updatedMarkers = [...currentMarkers];
      updatedMarkers[markerIndex] = { ...updatedMarkers[markerIndex], ...updates };
      this._markers.set(updatedMarkers);
      this.markersSubject.next(updatedMarkers);
    }
  }

  /**
   * Get user's current location
   */
  getCurrentLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          this._userLocation.set(location);
          resolve(location);
        },
        (error) => {
          console.error('Error getting location:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  /**
   * Watch user's location
   */
  watchUserLocation(): Observable<{ lat: number; lng: number }> {
    return new Observable(observer => {
      if (!navigator.geolocation) {
        observer.error(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          this._userLocation.set(location);
          observer.next(location);
        },
        (error) => {
          console.error('Error watching location:', error);
          observer.error(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    });
  }

  /**
   * Calculate distance between two points
   */
  calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(point2.lat - point1.lat);
    const dLng = this.deg2rad(point2.lng - point1.lng);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(point1.lat)) * Math.cos(this.deg2rad(point2.lat)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    
    return distance;
  }

  /**
   * Find markers within radius
   */
  findMarkersInRadius(
    center: { lat: number; lng: number },
    radiusKm: number
  ): MapMarker[] {
    return this._markers().filter(marker => {
      const distance = this.calculateDistance(center, marker.position);
      return distance <= radiusKm;
    });
  }

  /**
   * Get bounds from markers
   */
  getBoundsFromMarkers(markers: MapMarker[]): MapBounds | null {
    if (markers.length === 0) return null;

    let north = markers[0].position.lat;
    let south = markers[0].position.lat;
    let east = markers[0].position.lng;
    let west = markers[0].position.lng;

    markers.forEach(marker => {
      north = Math.max(north, marker.position.lat);
      south = Math.min(south, marker.position.lat);
      east = Math.max(east, marker.position.lng);
      west = Math.min(west, marker.position.lng);
    });

    return { north, south, east, west };
  }

  /**
   * Convert degrees to radians
   */
  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  /**
   * Reset map to default state
   */
  resetMap(): void {
    this._markers.set([]);
    this._selectedMarker.set(null);
    this._isMapReady.set(false);
    this._userLocation.set(null);
    
    this.markersSubject.next([]);
    this.selectedMarkerSubject.next(null);
  }
}
