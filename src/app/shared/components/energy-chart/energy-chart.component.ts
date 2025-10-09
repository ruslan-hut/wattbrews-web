import { Component, Input, OnInit, OnChanges, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-energy-chart',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './energy-chart.component.html',
  styleUrl: './energy-chart.component.scss'
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

    // Transform energy values to start from 0 (difference from first value)
    const firstEnergyValue = sortedData[0]?.value || 0;
    const transformedData = sortedData.map(d => ({
      ...d,
      value: (d.value || 0) - firstEnergyValue
    }));

    // Calculate ranges for both energy and power
    const energyValues = transformedData.map(d => d.value);
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

    const energyPoints = transformedData.map((item, index) => {
      const x = this.padding.left + (index / (transformedData.length - 1)) * chartAreaWidth;
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