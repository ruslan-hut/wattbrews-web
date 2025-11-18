export interface MeterValue {
  time: string;
  consumed_energy?: number;
  power_rate?: number;
}

export interface ChartDataPoint {
  x: number;
  y: number;
  value: number;
  time: string;
  power: number;
  hovered: boolean;
}

export interface AxisLabel {
  value: string;
  x?: number;
  y?: number;
}

export interface GridLines {
  vertical: number[];
  horizontal: number[];
}

