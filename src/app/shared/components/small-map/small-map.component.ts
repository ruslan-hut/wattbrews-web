import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy, input } from '@angular/core';

import * as L from 'leaflet';
import { inject } from '@angular/core';

@Component({
  selector: 'app-small-map',
  imports: [],
  templateUrl: './small-map.component.html',
  styleUrl: './small-map.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SmallMapComponent implements OnInit, AfterViewInit, OnDestroy {
  latitude = input.required<number>();
  longitude = input.required<number>();
  title = input<string>();
  zoom = input<number>(15);
  height = input<string>('200px');

  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

  private map: L.Map | null = null;
  private marker: L.Marker | null = null;
  isMapReady = false;

  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    // Height is now controlled by the parent container
    // The component fills 100% of its parent
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
    const lat = this.latitude();
    const lng = this.longitude();
    
    if (!lat || !lng) {
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
          center: [lat, lng],
          zoom: this.zoom(),
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

        this.marker = L.marker([lat, lng], {
          icon: markerIcon
        }).addTo(this.map);

        // Add popup if title is provided
        const mapTitle = this.title();
        if (mapTitle) {
          this.marker.bindPopup(`
            <div style="text-align: center;">
              <strong>${mapTitle}</strong><br>
              <small>${lat.toFixed(6)}, ${lng.toFixed(6)}</small>
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
    if (this.map) {
      this.map.setView([lat, lng], this.zoom());
      
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
