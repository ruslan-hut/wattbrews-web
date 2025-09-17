import { Component, Input, OnInit, OnChanges, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-energy-chart',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="chart-container">
      <!-- No data message -->
      <div class="no-data-message" *ngIf="!meterValues || meterValues.length === 0">
        <mat-icon>show_chart</mat-icon>
        <p>No energy consumption data available</p>
      </div>
      
      <!-- SVG Chart -->
      <svg *ngIf="meterValues && meterValues.length > 0"
           class="chart-svg"
           [attr.width]="chartWidth"
           [attr.height]="chartHeight"
           (mousemove)="onMouseMove($event)"
           (mouseleave)="onMouseLeave()">
        
        <!-- Grid lines -->
        <g class="grid">
          <!-- Vertical grid lines -->
          <line *ngFor="let x of gridLines().vertical; let i = index"
                [attr.x1]="x"
                [attr.y1]="padding.top"
                [attr.x2]="x"
                [attr.y2]="chartHeight - padding.bottom"
                class="grid-line" />
          
          <!-- Horizontal grid lines -->
          <line *ngFor="let y of gridLines().horizontal; let i = index"
                [attr.x1]="padding.left"
                [attr.y1]="y"
                [attr.x2]="chartWidth - padding.right"
                [attr.y2]="y"
                class="grid-line" />
        </g>
        
        <!-- Axes -->
        <g class="axes">
          <!-- X axis -->
          <line [attr.x1]="padding.left"
                [attr.y1]="chartHeight - padding.bottom"
                [attr.x2]="chartWidth - padding.right"
                [attr.y2]="chartHeight - padding.bottom"
                class="axis" />
          
          <!-- Y axis -->
          <line [attr.x1]="padding.left"
                [attr.y1]="padding.top"
                [attr.x2]="padding.left"
                [attr.y2]="chartHeight - padding.bottom"
                class="axis" />
        </g>
        
        <!-- Y-axis labels -->
        <g class="y-axis-labels">
          <text *ngFor="let label of yAxisLabels(); let i = index"
                [attr.x]="padding.left - 10"
                [attr.y]="label.y + 4"
                class="y-axis-label">
            {{ label.value }}
          </text>
        </g>
        
        <!-- X-axis labels -->
        <g class="x-axis-labels">
          <text *ngFor="let label of xAxisLabels(); let i = index"
                [attr.x]="label.x"
                [attr.y]="chartHeight - padding.bottom + 20"
                class="x-axis-label">
            {{ label.value }}
          </text>
        </g>
        
        <!-- Energy data line -->
        <path [attr.d]="energyDataPath()"
              class="energy-line"
              fill="none" />
        
        <!-- Power data line -->
        <path [attr.d]="powerDataPath()"
              class="power-line"
              fill="none" />
        
        <!-- Energy data points -->
        <circle *ngFor="let point of energyDataPoints(); let i = index"
                [attr.cx]="point.x"
                [attr.cy]="point.y"
                [attr.r]="point.hovered ? 6 : 4"
                class="energy-point"
                [class.hovered]="point.hovered" />
        
        <!-- Power data points -->
        <circle *ngFor="let point of powerDataPoints(); let i = index"
                [attr.cx]="point.x"
                [attr.cy]="point.y"
                [attr.r]="point.hovered ? 6 : 4"
                class="power-point"
                [class.hovered]="point.hovered" />
        
        <!-- Hover line -->
        <line *ngIf="hoverLine().x > 0"
              [attr.x1]="hoverLine().x"
              [attr.y1]="padding.top"
              [attr.x2]="hoverLine().x"
              [attr.y2]="chartHeight - padding.bottom"
              class="hover-line" />
        
        <!-- Hover point -->
        <circle *ngIf="hoverPoint().x > 0"
                [attr.cx]="hoverPoint().x"
                [attr.cy]="hoverPoint().y"
                r="6"
                class="hover-point" />
      </svg>
      
      <!-- Legend -->
      <div class="chart-legend" *ngIf="meterValues && meterValues.length > 0">
        <div class="legend-item">
          <div class="legend-color energy"></div>
          <span class="legend-text">Consumed Energy (Wh)</span>
        </div>
        <div class="legend-item">
          <div class="legend-color power"></div>
          <span class="legend-text">Power Level (W)</span>
        </div>
      </div>
      
      <!-- Tooltip -->
      <div class="chart-tooltip" 
           [style.left.px]="tooltipX()" 
           [style.top.px]="tooltipY()"
           [style.display]="showTooltip() ? 'block' : 'none'">
        <div class="tooltip-content">
          <div class="tooltip-time">{{ tooltipTime() }}</div>
          <div class="tooltip-value">{{ tooltipValue() }} Wh</div>
          <div class="tooltip-power" *ngIf="tooltipPower() > 0">{{ tooltipPower() }} W</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chart-container {
      position: relative;
      width: 100%;
      height: 300px;
      background: #f8f9fa;
      border-radius: 8px;
      overflow: hidden;
      min-height: 250px;
    }
    
    .chart-svg {
      width: 100%;
      height: 100%;
      display: block;
    }
    
    .no-data-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #666;
      text-align: center;
    }
    
    .no-data-message mat-icon {
      font-size: 3rem;
      color: #ccc;
      margin-bottom: 16px;
    }
    
    .no-data-message p {
      margin: 0;
      font-size: 1rem;
    }
    
    .grid-line {
      stroke: #e0e0e0;
      stroke-width: 1;
      stroke-dasharray: 2,2;
    }
    
    .axis {
      stroke: #666666;
      stroke-width: 2;
    }
    
    .y-axis-label {
      font-size: 11px;
      fill: #666;
      text-anchor: end;
      font-family: Arial, sans-serif;
    }
    
    .x-axis-label {
      font-size: 11px;
      fill: #666;
      text-anchor: middle;
      font-family: Arial, sans-serif;
    }
    
    .energy-line {
      stroke: #2e7d32;
      stroke-width: 3;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    
    .power-line {
      stroke: #1976d2;
      stroke-width: 3;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    
    .energy-point {
      fill: #2e7d32;
      stroke: #fff;
      stroke-width: 2;
      transition: r 0.2s ease;
    }
    
    .power-point {
      fill: #1976d2;
      stroke: #fff;
      stroke-width: 2;
      transition: r 0.2s ease;
    }
    
    .energy-point.hovered {
      fill: #1b5e20;
    }
    
    .power-point.hovered {
      fill: #0d47a1;
    }
    
    .hover-line {
      stroke: #2e7d32;
      stroke-width: 1;
      stroke-dasharray: 5,5;
      opacity: 0.7;
    }
    
    .hover-point {
      fill: #2e7d32;
      stroke: #fff;
      stroke-width: 2;
    }
    
    .chart-tooltip {
      position: fixed;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 13px;
      pointer-events: none;
      z-index: 10000;
      transform: translate(-50%, -100%);
      margin-top: -12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.2);
      min-width: 120px;
    }
    
    .tooltip-content {
      text-align: center;
    }
    
    .tooltip-time {
      font-weight: bold;
      margin-bottom: 6px;
      font-size: 14px;
    }
    
    .tooltip-value {
      color: #4caf50;
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 4px;
    }
    
    .tooltip-power {
      color: #81c784;
      font-size: 12px;
      font-weight: 500;
    }
    
    .chart-legend {
      display: flex !important;
      justify-content: center;
      gap: 30px;
      margin-top: 15px;
      padding: 15px;
      background: #ffffff;
      border-radius: 8px;
      border: 2px solid #e0e0e0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      min-height: 50px;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      color: #333;
      font-weight: 600;
    }
    
    .legend-text {
      font-size: 14px;
      color: #333;
      font-weight: 600;
    }
    
    .legend-color {
      width: 24px;
      height: 4px;
      border-radius: 2px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
    
    .legend-color.energy {
      background-color: #2e7d32;
    }
    
    .legend-color.power {
      background-color: #1976d2;
    }
    
    @media (max-width: 768px) {
      .chart-legend {
        gap: 20px;
        padding: 12px;
        margin-top: 10px;
      }
      
      .legend-item {
        font-size: 12px;
        gap: 8px;
      }
      
      .legend-color {
        width: 16px;
        height: 3px;
      }
    }
    
    @media (max-width: 768px) {
      .chart-container {
        height: 250px;
      }
    }
    
    @media (max-width: 480px) {
      .chart-container {
        height: 200px;
      }
    }
  `]
})
export class EnergyChartComponent implements OnInit, OnChanges {
  @Input() meterValues: any[] = [];

  // Chart dimensions
  chartWidth = 720;
  chartHeight = 300;
  padding = { top: 20, right: 60, bottom: 40, left: 60 };

  // Data processing
  processedData = signal<any[]>([]);
  energyDataPoints = signal<any[]>([]);
  powerDataPoints = signal<any[]>([]);
  energyDataPath = signal<string>('');
  powerDataPath = signal<string>('');
  gridLines = signal<any>({ vertical: [], horizontal: [] });

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
  energyMinY = signal(0);
  energyMaxY = signal(0);
  powerMinY = signal(0);
  powerMaxY = signal(0);
  minX = signal(0);
  maxX = signal(0);
  
  // Axis labels
  yAxisLabels = signal<any[]>([]);
  xAxisLabels = signal<any[]>([]);

  ngOnInit() {
    this.processData();
  }

  ngOnChanges() {
    this.processData();
  }

  private processData() {
    if (!this.meterValues || this.meterValues.length === 0) {
      this.processedData.set([]);
      this.energyDataPoints.set([]);
      this.powerDataPoints.set([]);
      this.energyDataPath.set('');
      this.powerDataPath.set('');
      return;
    }

    // Sort data by time
    const sortedData = [...this.meterValues].sort((a, b) => 
      new Date(a.time).getTime() - new Date(b.time).getTime()
    );

    // Calculate ranges for both energy and power
    const energyValues = sortedData.map(d => d.value || 0);
    const powerValues = sortedData.map(d => d.power_rate || 0);
    
    const energyMin = Math.min(...energyValues);
    const energyMax = Math.max(...energyValues);
    const powerMin = Math.min(...powerValues);
    const powerMax = Math.max(...powerValues);
    
    this.energyMinY.set(energyMin);
    this.energyMaxY.set(energyMax);
    this.powerMinY.set(powerMin);
    this.powerMaxY.set(powerMax);
    this.minX.set(0);
    this.maxX.set(sortedData.length - 1);

    // Process data points for both energy and power
    const chartAreaWidth = this.chartWidth - this.padding.left - this.padding.right;
    const chartAreaHeight = this.chartHeight - this.padding.top - this.padding.bottom;

    const energyPoints = sortedData.map((item, index) => {
      const x = this.padding.left + (index / (sortedData.length - 1)) * chartAreaWidth;
      const y = this.padding.top + chartAreaHeight - 
        ((item.value - energyMin) / (energyMax - energyMin)) * chartAreaHeight;
      
      return {
        x,
        y,
        value: item.value,
        time: item.time,
        power: item.power_rate || 0,
        hovered: false
      };
    });

    const powerPoints = sortedData.map((item, index) => {
      const x = this.padding.left + (index / (sortedData.length - 1)) * chartAreaWidth;
      const y = this.padding.top + chartAreaHeight - 
        ((item.power_rate - powerMin) / (powerMax - powerMin)) * chartAreaHeight;
      
      return {
        x,
        y,
        value: item.power_rate || 0,
        time: item.time,
        power: item.power_rate || 0,
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

  private generateEnergyDataPath(points: any[]) {
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

  private generatePowerDataPath(points: any[]) {
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
    const chartAreaWidth = this.chartWidth - this.padding.left - this.padding.right;
    const chartAreaHeight = this.chartHeight - this.padding.top - this.padding.bottom;

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
    const chartAreaHeight = this.chartHeight - this.padding.top - this.padding.bottom;
    const chartAreaWidth = this.chartWidth - this.padding.left - this.padding.right;
    
    // Y-axis labels (energy values)
    const yLabels = [];
    for (let i = 0; i <= 4; i++) {
      const value = this.energyMinY() + (this.energyMaxY() - this.energyMinY()) * (4 - i) / 4;
      const y = this.padding.top + i * (chartAreaHeight / 4);
      yLabels.push({
        value: Math.round(value).toLocaleString(),
        y: y
      });
    }
    this.yAxisLabels.set(yLabels);
    
    // X-axis labels (time values)
    const xLabels = [];
    const timeStep = Math.max(1, Math.floor(this.processedData().length / 6));
    for (let i = 0; i < this.processedData().length; i += timeStep) {
      const point = this.processedData()[i];
      if (point) {
        const x = this.padding.left + (i / (this.processedData().length - 1)) * chartAreaWidth;
        const time = new Date(point.time).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
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
    let closestPoint: any = null;
    let minDistance = Infinity;

    this.energyDataPoints().forEach(point => {
      const distance = Math.abs(point.x - mouseX);
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    });

    if (closestPoint && minDistance < 50) {
      this.showTooltip.set(true);
      this.tooltipX.set(event.clientX);
      this.tooltipY.set(event.clientY);
      this.tooltipTime.set(new Date(closestPoint.time).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }));
      this.tooltipValue.set(closestPoint.value.toLocaleString());
      this.tooltipPower.set(closestPoint.power);

      this.hoverLine.set({ x: closestPoint.x, y: closestPoint.y });
      this.hoverPoint.set({ x: closestPoint.x, y: closestPoint.y });

      // Update both energy and power data points to show hover state
      this.energyDataPoints.set(
        this.energyDataPoints().map(p => ({
          ...p,
          hovered: p === closestPoint
        }))
      );
      
      this.powerDataPoints.set(
        this.powerDataPoints().map(p => ({
          ...p,
          hovered: p.x === closestPoint.x // Match by x position
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