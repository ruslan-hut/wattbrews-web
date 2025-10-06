import { Component, Input, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

@Component({
  selector: 'app-small-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="small-map-container">
      <div #mapContainer class="map-container"></div>
      <div class="map-overlay" *ngIf="!isMapReady">
        <div class="loading-spinner">
          <div class="spinner"></div>
          <span>Loading map...</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .small-map-container {
      position: relative;
      width: 100%;
      height: 200px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #e0e0e0;
    }

    .map-container {
      width: 100%;
      height: 100%;
    }

    .map-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(255, 255, 255, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .loading-spinner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid #f3f3f3;
      border-top: 2px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .loading-spinner span {
      font-size: 12px;
      color: #666;
    }

    /* Leaflet map styles */
    :host ::ng-deep .leaflet-container {
      height: 100% !important;
      width: 100% !important;
      background-color: #f8f9fa !important;
    }

    :host ::ng-deep .leaflet-tile {
      filter: none !important;
    }

    :host ::ng-deep .leaflet-popup-content {
      font-size: 12px;
      margin: 8px 12px;
    }

    :host ::ng-deep .leaflet-popup-content-wrapper {
      border-radius: 6px;
      box-shadow: 0 3px 14px rgba(0,0,0,0.4);
    }

    :host ::ng-deep .leaflet-control-zoom {
      border-radius: 4px;
      box-shadow: 0 1px 5px rgba(0,0,0,0.4);
    }

    :host ::ng-deep .leaflet-control-zoom a {
      border-radius: 4px;
      font-size: 18px;
      line-height: 26px;
    }

    :host ::ng-deep .leaflet-control-zoom a:hover {
      background-color: #f4f4f4;
    }

    :host ::ng-deep .custom-marker {
      background: transparent !important;
      border: none !important;
    }
  `]
})
export class SmallMapComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() latitude!: number;
  @Input() longitude!: number;
  @Input() title?: string;
  @Input() zoom: number = 15;
  @Input() height: string = '200px';

  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

  private map: L.Map | null = null;
  private marker: L.Marker | null = null;
  isMapReady = false;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    // Set container height from input
    if (this.height) {
      this.mapContainer.nativeElement.style.height = this.height;
    }
  }

  ngAfterViewInit() {
    this.initializeMap();
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  private initializeMap() {
    if (!this.latitude || !this.longitude) {
      console.warn('SmallMapComponent: Latitude and longitude are required');
      this.isMapReady = true;
      this.cdr.detectChanges();
      return;
    }

    try {
      // Wait for the view to be initialized
      setTimeout(() => {
        if (!this.mapContainer?.nativeElement) {
          console.error('Map container not found');
          this.isMapReady = true;
          this.cdr.detectChanges();
          return;
        }

        // Initialize the map
        this.map = L.map(this.mapContainer.nativeElement, {
          center: [this.latitude, this.longitude],
          zoom: this.zoom,
          zoomControl: true,
          attributionControl: false,
          dragging: true,
          touchZoom: true,
          doubleClickZoom: true,
          scrollWheelZoom: true,
          boxZoom: false,
          keyboard: false
        });

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(this.map);

        // Add marker
        const markerIcon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="
              background-color: #007bff;
              width: 20px;
              height: 20px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 12px;
              font-weight: bold;
            ">📍</div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
          popupAnchor: [0, -10]
        });

        this.marker = L.marker([this.latitude, this.longitude], {
          icon: markerIcon
        }).addTo(this.map);

        // Add popup if title is provided
        if (this.title) {
          this.marker.bindPopup(`
            <div style="text-align: center;">
              <strong>${this.title}</strong><br>
              <small>${this.latitude.toFixed(6)}, ${this.longitude.toFixed(6)}</small>
            </div>
          `);
        }

        // Set map ready and trigger resize
        this.isMapReady = true;
        this.cdr.detectChanges();
        
        // Trigger resize to ensure proper rendering
        setTimeout(() => {
          if (this.map) {
            this.map.invalidateSize();
          }
        }, 50);

      }, 100);

    } catch (error) {
      console.error('Error initializing small map:', error);
      this.isMapReady = true; // Hide loading overlay even on error
      this.cdr.detectChanges();
    }
  }

  /**
   * Update map center and marker position
   */
  updateLocation(lat: number, lng: number, title?: string) {
    this.latitude = lat;
    this.longitude = lng;
    
    if (this.map) {
      this.map.setView([lat, lng], this.zoom);
      
      if (this.marker) {
        this.marker.setLatLng([lat, lng]);
        if (title) {
          this.marker.bindPopup(`
            <div style="text-align: center;">
              <strong>${title}</strong><br>
              <small>${lat.toFixed(6)}, ${lng.toFixed(6)}</small>
            </div>
          `);
        }
      }
    }
  }

  /**
   * Fit map to show marker with some padding
   */
  fitToMarker() {
    if (this.map && this.marker) {
      this.map.fitBounds(this.marker.getLatLng().toBounds(0.01));
    }
  }
}
