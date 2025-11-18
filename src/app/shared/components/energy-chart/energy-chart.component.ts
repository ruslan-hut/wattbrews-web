import { Component, input, OnInit, OnChanges, AfterViewInit, OnDestroy, signal, computed, ViewChild, ElementRef, ChangeDetectionStrategy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MeterValue, ChartDataPoint, AxisLabel, GridLines } from '../../models/chart.model';

@Component({
  selector: 'app-energy-chart',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './energy-chart.component.html',
  styleUrl: './energy-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnergyChartComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  meterValues = input<MeterValue[]>([]);

  // Maximum number of data points to display
  private readonly MAX_DATA_POINTS = 60;

  // Chart dimensions - will be calculated dynamically
  chartWidth = signal(720);
  chartHeight = signal(300);
  padding = { top: 20, right: 60, bottom: 40, left: 60 };
  
  // Container reference for responsive sizing
  @ViewChild('chartContainer', { static: false }) chartContainer?: ElementRef<HTMLElement>;
  private resizeListener?: () => void;

  // Data processing
  processedData = signal<ChartDataPoint[]>([]);
  energyDataPoints = signal<ChartDataPoint[]>([]);
  powerDataPoints = signal<ChartDataPoint[]>([]);
  energyDataPath = signal<string>('');
  powerDataPath = signal<string>('');
  gridLines = signal<GridLines>({ vertical: [], horizontal: [] });

  // Hover state
  showTooltip = signal(false);
  tooltipX = signal(0);
  tooltipY = signal(0);
  tooltipTime = signal('');
  tooltipValue = signal('');
  tooltipPower = signal(0);
  hoverLine = signal({ x: 0, y: 0 });
  hoverPoint = signal({ x: 0, y: 0 });

  // Data ranges
  minY = signal(0);
  maxY = signal(0);
  minX = signal(0);
  maxX = signal(0);
  
  // Axis labels
  yAxisLabels = signal<AxisLabel[]>([]);
  xAxisLabels = signal<AxisLabel[]>([]);

  constructor() {
    // Watch for changes to meterValues input
    effect(() => {
      const values = this.meterValues();
      if (values) {
        this.processData();
      }
    });
  }

  ngOnInit() {
    this.calculateChartDimensions();
    this.processData();
  }
  
  ngAfterViewInit() {
    // Calculate dimensions after view init to ensure container is available
    setTimeout(() => {
      this.calculateChartDimensions();
      this.processData();
    }, 0);
    
    // Recalculate on window resize
    if (typeof window !== 'undefined') {
      this.resizeListener = () => this.onResize();
      window.addEventListener('resize', this.resizeListener);
    }
  }
  
  ngOnDestroy() {
    if (typeof window !== 'undefined' && this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
  }
  
  private onResize() {
    this.calculateChartDimensions();
    this.processData();
  }
  
  private calculateChartDimensions() {
    // Try to get container from ViewChild first, then fallback to querySelector
    let container: HTMLElement | null = null;
    
    if (this.chartContainer?.nativeElement) {
      container = this.chartContainer.nativeElement;
    } else if (typeof document !== 'undefined') {
      container = document.querySelector('.chart-container') as HTMLElement;
    }
    
    if (!container) return;
    
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Calculate responsive dimensions
    // Use container width minus padding, with minimum constraints
    const minWidth = 280;
    const minHeight = 180;
    const maxWidth = 720;
    const maxHeight = 400;
    
    // Calculate width based on container, respecting min/max
    let calculatedWidth = Math.max(0, containerWidth - 32); // Account for container padding
    calculatedWidth = Math.max(minWidth, Math.min(maxWidth, calculatedWidth));
    
    // Calculate height based on container or aspect ratio
    let calculatedHeight = Math.max(0, containerHeight - 32); // Account for container padding
    if (calculatedHeight < minHeight || calculatedHeight === 0) {
      // Use aspect ratio if container height is too small
      calculatedHeight = calculatedWidth * 0.4; // 2.5:1 aspect ratio
    }
    calculatedHeight = Math.max(minHeight, Math.min(maxHeight, calculatedHeight));
    
    // Adjust padding for smaller screens
    if (calculatedWidth < 500) {
      // Reduce padding on mobile
      this.padding = { top: 15, right: 40, bottom: 35, left: 40 };
    } else if (calculatedWidth < 600) {
      this.padding = { top: 18, right: 50, bottom: 38, left: 50 };
    } else {
      this.padding = { top: 20, right: 60, bottom: 40, left: 60 };
    }
    
    this.chartWidth.set(calculatedWidth);
    this.chartHeight.set(calculatedHeight);
  }

  ngOnChanges() {
    // No longer needed with signal inputs and effect
  }

  private processData() {
    const values = this.meterValues();
    if (!values || values.length === 0) {
      this.processedData.set([]);
      this.energyDataPoints.set([]);
      this.powerDataPoints.set([]);
      this.energyDataPath.set('');
      this.powerDataPath.set('');
      return;
    }

    // Sort data by time and keep only the last 60 values
    const sortedData = [...values]
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
      .slice(-this.MAX_DATA_POINTS); // Keep only the last 60 values

    // Calculate ranges for both energy and power
    const energyValues = sortedData.map(d => d.consumed_energy || 0);
    const powerValues = sortedData.map(d => d.power_rate || 0);
    
    const energyMin = Math.min(...energyValues);
    const energyMax = Math.max(...energyValues);
    const powerMin = Math.min(...powerValues);
    const powerMax = Math.max(...powerValues);
    
    // Calculate unified vertical scale: use maximum from both datasets + 10% margin
    const unifiedMax = Math.max(energyMax, powerMax);
    const unifiedMaxWithMargin = unifiedMax * 1.1;
    const unifiedMin = Math.min(energyMin, powerMin);
    
    // Ensure we have a valid range (avoid division by zero)
    const finalMinY = unifiedMin >= 0 ? 0 : unifiedMin;
    const finalMaxY = unifiedMaxWithMargin > finalMinY ? unifiedMaxWithMargin : finalMinY + 1;
    
    this.minY.set(finalMinY);
    this.maxY.set(finalMaxY);
    this.minX.set(0);
    this.maxX.set(sortedData.length - 1);

    // Process data points for both energy and power
    const chartAreaWidth = this.chartWidth() - this.padding.left - this.padding.right;
    const chartAreaHeight = this.chartHeight() - this.padding.top - this.padding.bottom;

    const energyPoints = sortedData.map((item, index) => {
      const x = this.padding.left + (index / (sortedData.length - 1)) * chartAreaWidth;
      const consumedEnergy = item.consumed_energy ?? 0;
      const y = this.padding.top + chartAreaHeight - 
        ((consumedEnergy - finalMinY) / (finalMaxY - finalMinY)) * chartAreaHeight;
      
      return {
        x,
        y,
        value: consumedEnergy,
        time: item.time,
        power: item.power_rate ?? 0,
        hovered: false
      };
    });

    const powerPoints = sortedData.map((item, index) => {
      const x = this.padding.left + (index / (sortedData.length - 1)) * chartAreaWidth;
      const powerRate = item.power_rate ?? 0;
      const y = this.padding.top + chartAreaHeight - 
        ((powerRate - finalMinY) / (finalMaxY - finalMinY)) * chartAreaHeight;
      
      return {
        x,
        y,
        value: powerRate,
        time: item.time,
        power: powerRate,
        hovered: false
      };
    });

    this.processedData.set(energyPoints); // Keep for compatibility
    this.energyDataPoints.set(energyPoints);
    this.powerDataPoints.set(powerPoints);
    this.generateEnergyDataPath(energyPoints);
    this.generatePowerDataPath(powerPoints);
    this.generateGridLines();
    this.generateAxisLabels();
  }

  private generateEnergyDataPath(points: ChartDataPoint[]) {
    if (points.length === 0) {
      this.energyDataPath.set('');
      return;
    }

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    
    this.energyDataPath.set(path);
  }

  private generatePowerDataPath(points: ChartDataPoint[]) {
    if (points.length === 0) {
      this.powerDataPath.set('');
      return;
    }

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    
    this.powerDataPath.set(path);
  }

  private generateGridLines() {
    const chartAreaWidth = this.chartWidth() - this.padding.left - this.padding.right;
    const chartAreaHeight = this.chartHeight() - this.padding.top - this.padding.bottom;

    // Vertical grid lines (6 lines)
    const verticalLines = [];
    for (let i = 0; i <= 6; i++) {
      verticalLines.push(this.padding.left + (i / 6) * chartAreaWidth);
    }

    // Horizontal grid lines (4 lines)
    const horizontalLines = [];
    for (let i = 0; i <= 4; i++) {
      horizontalLines.push(this.padding.top + (i / 4) * chartAreaHeight);
    }

    this.gridLines.set({
      vertical: verticalLines,
      horizontal: horizontalLines
    });
  }

  private generateAxisLabels() {
    const chartAreaHeight = this.chartHeight() - this.padding.top - this.padding.bottom;
    const chartAreaWidth = this.chartWidth() - this.padding.left - this.padding.right;
    
    // Y-axis labels (using unified scale) - convert to kW and show as integers
    const yLabels = [];
    for (let i = 0; i <= 4; i++) {
      const value = this.minY() + (this.maxY() - this.minY()) * (4 - i) / 4;
      const y = this.padding.top + i * (chartAreaHeight / 4);
      // Convert to kW (divide by 1000) and round to integer
      const valueInKw = value / 1000;
      yLabels.push({
        value: Math.round(valueInKw).toString(),
        y: y
      });
    }
    this.yAxisLabels.set(yLabels);
    
    // X-axis labels (time values) - 24-hour format
    const xLabels = [];
    const timeStep = Math.max(1, Math.floor(this.processedData().length / 6));
    for (let i = 0; i < this.processedData().length; i += timeStep) {
      const point = this.processedData()[i];
      if (point) {
        const x = this.padding.left + (i / (this.processedData().length - 1)) * chartAreaWidth;
        const date = new Date(point.time);
        // Format as 24-hour: HH:mm
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const time = `${hours}:${minutes}`;
        xLabels.push({
          value: time,
          x: x
        });
      }
    }
    this.xAxisLabels.set(xLabels);
  }

  onMouseMove(event: MouseEvent) {
    if (this.energyDataPoints().length === 0) return;

    const rect = (event.target as SVGElement).getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Find closest data point from energy data
    let closestPoint: ChartDataPoint | null = null;
    let minDistance = Infinity;

    this.energyDataPoints().forEach(point => {
      const distance = Math.abs(point.x - mouseX);
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    });

    if (closestPoint !== null && minDistance < 50) {
      this.showTooltip.set(true);
      this.tooltipX.set(event.clientX);
      this.tooltipY.set(event.clientY);
      // Format tooltip time in 24-hour format
      const tooltipDate = new Date(closestPoint.time);
      const tooltipHours = tooltipDate.getHours().toString().padStart(2, '0');
      const tooltipMinutes = tooltipDate.getMinutes().toString().padStart(2, '0');
      this.tooltipTime.set(`${tooltipHours}:${tooltipMinutes}`);
      this.tooltipValue.set(closestPoint.value.toLocaleString());
      this.tooltipPower.set(closestPoint.power);

      this.hoverLine.set({ x: closestPoint.x, y: closestPoint.y });
      this.hoverPoint.set({ x: closestPoint.x, y: closestPoint.y });

      // Update both energy and power data points to show hover state
      const closestX = closestPoint.x;
      this.energyDataPoints.set(
        this.energyDataPoints().map(p => ({
          ...p,
          hovered: p === closestPoint
        }))
      );
      
      this.powerDataPoints.set(
        this.powerDataPoints().map(p => ({
          ...p,
          hovered: p.x === closestX // Match by x position
        }))
      );
    } else {
      this.onMouseLeave();
    }
  }

  onMouseLeave() {
    this.showTooltip.set(false);
    this.hoverLine.set({ x: 0, y: 0 });
    this.hoverPoint.set({ x: 0, y: 0 });
    
    // Reset hover state for both lines
    this.energyDataPoints.set(
      this.energyDataPoints().map(p => ({
        ...p,
        hovered: false
      }))
    );
    
    this.powerDataPoints.set(
      this.powerDataPoints().map(p => ({
        ...p,
        hovered: false
      }))
    );
  }
}