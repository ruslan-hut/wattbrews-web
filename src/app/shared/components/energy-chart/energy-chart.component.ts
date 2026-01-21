import {
  Component,
  input,
  OnDestroy,
  AfterViewInit,
  signal,
  ChangeDetectionStrategy,
  effect,
  ViewChild,
  ElementRef,
  inject,
  PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsCoreOption, ECharts } from 'echarts/core';
import { MeterValue } from '../../models/chart.model';

// Register required ECharts components
echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  CanvasRenderer
]);

@Component({
  selector: 'app-energy-chart',
  standalone: true,
  imports: [MatIconModule, NgxEchartsDirective],
  providers: [
    provideEchartsCore({ echarts })
  ],
  templateUrl: './energy-chart.component.html',
  styleUrl: './energy-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnergyChartComponent implements AfterViewInit, OnDestroy {
  meterValues = input<MeterValue[]>([]);

  private readonly MAX_DATA_POINTS = 60;
  private platformId = inject(PLATFORM_ID);
  private chartInstance: ECharts | null = null;
  private resizeObserver: ResizeObserver | null = null;

  @ViewChild('chartContainer', { static: false }) chartContainer?: ElementRef<HTMLElement>;

  // ECharts configuration signals
  chartOptions = signal<EChartsCoreOption>(this.getBaseChartOptions());
  chartMergeOptions = signal<EChartsCoreOption>({});

  get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  constructor() {
    effect(() => {
      const values = this.meterValues();
      if (values && values.length > 0) {
        this.updateChartData(values);
      }
    });
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    // Apply responsive options after view init
    setTimeout(() => {
      this.applyResponsiveOptions();
    }, 0);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.chartInstance?.dispose();
  }

  onChartInit(chart: ECharts): void {
    this.chartInstance = chart;
    this.setupResizeObserver();
  }

  private setupResizeObserver(): void {
    if (!this.isBrowser || !this.chartContainer?.nativeElement) return;

    this.resizeObserver = new ResizeObserver(() => {
      this.chartInstance?.resize();
      this.applyResponsiveOptions();
    });

    this.resizeObserver.observe(this.chartContainer.nativeElement);
  }

  private applyResponsiveOptions(): void {
    if (!this.chartContainer?.nativeElement || !this.chartInstance) return;

    const width = this.chartContainer.nativeElement.clientWidth;
    const isMobile = width < 500;

    const responsiveOptions: EChartsCoreOption = isMobile
      ? this.getMobileChartOptions()
      : this.getDesktopChartOptions();

    this.chartInstance.setOption(responsiveOptions);
  }

  private updateChartData(values: MeterValue[]): void {
    const sortedData = [...values]
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
      .slice(-this.MAX_DATA_POINTS);

    const xAxisData = sortedData.map(d => d.time);
    const energyData = sortedData.map(d => d.consumed_energy ?? 0);
    const powerData = sortedData.map(d => d.power_rate ?? 0);

    this.chartMergeOptions.set({
      xAxis: {
        data: xAxisData
      },
      series: [
        { data: energyData },
        { data: powerData }
      ]
    });
  }

  private formatTime(isoString: string): string {
    const date = new Date(isoString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private getBaseChartOptions(): EChartsCoreOption {
    return {
      animation: true,
      animationDuration: 300,
      animationEasing: 'cubicOut',

      grid: {
        left: 55,
        right: 55,
        top: 40,
        bottom: 75,
        containLabel: false
      },

      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          crossStyle: {
            color: '#999'
          }
        },
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: [12, 16],
        textStyle: {
          color: '#fff',
          fontSize: 13
        },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return '';

          const time = this.formatTime(params[0].axisValue);
          let content = `<div style="font-weight:600;margin-bottom:8px;font-size:14px">${time}</div>`;

          params.forEach((param: any) => {
            const value = (param.value / 1000).toFixed(2);
            const isEnergy = param.seriesIndex === 0;
            const unit = isEnergy ? 'kWh' : 'kW';
            const label = isEnergy ? 'Energy' : 'Power';
            content += `<div style="display:flex;align-items:center;gap:8px;margin:4px 0">
              <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${param.color}"></span>
              <span style="color:#94a3b8">${label}:</span>
              <span style="font-weight:600;color:${param.color}">${value} ${unit}</span>
            </div>`;
          });

          return content;
        }
      },

      legend: {
        data: ['Consumed Energy (kWh)', 'Power Level (kW)'],
        bottom: 5,
        textStyle: {
          color: '#64748b',
          fontSize: 12,
          fontWeight: 500
        },
        itemGap: 24,
        icon: 'roundRect',
        itemWidth: 20,
        itemHeight: 4
      },

      xAxis: {
        type: 'category',
        data: [],
        axisLine: {
          lineStyle: {
            color: '#e2e8f0',
            width: 1
          }
        },
        axisTick: {
          alignWithLabel: true,
          lineStyle: {
            color: '#e2e8f0'
          }
        },
        axisLabel: {
          color: '#64748b',
          fontSize: 11,
          formatter: (value: string) => {
            const date = new Date(value);
            const minutes = date.getMinutes();
            // Show label only at 10-minute intervals
            if (minutes % 10 === 0) {
              return this.formatTime(value);
            }
            return '';
          },
          rotate: 0,
          interval: 0 // Check all labels, formatter filters display
        }
      },

      yAxis: [
        {
          type: 'value',
          name: 'kWh',
          position: 'left',
          nameTextStyle: {
            color: '#10b981',
            fontSize: 11,
            fontWeight: 600,
            padding: [0, 0, 0, 0]
          },
          nameGap: 10,
          axisLine: {
            show: true,
            lineStyle: {
              color: '#10b981',
              width: 2
            }
          },
          axisTick: {
            show: false
          },
          axisLabel: {
            color: '#64748b',
            fontSize: 11,
            formatter: (value: number) => (value / 1000).toFixed(1)
          },
          splitLine: {
            lineStyle: {
              type: 'dashed',
              color: '#f1f5f9'
            }
          }
        },
        {
          type: 'value',
          name: 'kW',
          position: 'right',
          nameTextStyle: {
            color: '#3b82f6',
            fontSize: 11,
            fontWeight: 600,
            padding: [0, 0, 0, 0]
          },
          nameGap: 10,
          axisLine: {
            show: true,
            lineStyle: {
              color: '#3b82f6',
              width: 2
            }
          },
          axisTick: {
            show: false
          },
          axisLabel: {
            color: '#64748b',
            fontSize: 11,
            formatter: (value: number) => (value / 1000).toFixed(1)
          },
          splitLine: {
            show: false
          }
        }
      ],

      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100,
          zoomOnMouseWheel: true,
          moveOnMouseMove: true
        }
      ],

      series: [
        {
          name: 'Consumed Energy (kWh)',
          type: 'line',
          yAxisIndex: 0,
          data: [],
          smooth: 0.3,
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: false,
          emphasis: {
            focus: 'series',
            itemStyle: {
              borderColor: '#fff',
              borderWidth: 2
            }
          },
          lineStyle: {
            color: '#10b981',
            width: 3
          },
          itemStyle: {
            color: '#10b981'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(16, 185, 129, 0.35)' },
                { offset: 0.6, color: 'rgba(16, 185, 129, 0.1)' },
                { offset: 1, color: 'rgba(16, 185, 129, 0.02)' }
              ]
            }
          }
        },
        {
          name: 'Power Level (kW)',
          type: 'line',
          yAxisIndex: 1,
          data: [],
          smooth: 0.3,
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: false,
          emphasis: {
            focus: 'series',
            itemStyle: {
              borderColor: '#fff',
              borderWidth: 2
            }
          },
          lineStyle: {
            color: '#3b82f6',
            width: 3
          },
          itemStyle: {
            color: '#3b82f6'
          }
        }
      ]
    };
  }

  private getMobileChartOptions(): EChartsCoreOption {
    return {
      grid: {
        left: 45,
        right: 45,
        top: 35,
        bottom: 70
      },
      legend: {
        bottom: 5,
        itemGap: 16,
        textStyle: {
          fontSize: 10
        },
        itemWidth: 14,
        itemHeight: 3
      },
      xAxis: {
        axisLabel: {
          fontSize: 9,
          rotate: 45
        }
      },
      yAxis: [
        {
          nameTextStyle: { fontSize: 9 },
          axisLabel: { fontSize: 9 }
        },
        {
          nameTextStyle: { fontSize: 9 },
          axisLabel: { fontSize: 9 }
        }
      ]
    };
  }

  private getDesktopChartOptions(): EChartsCoreOption {
    return {
      grid: {
        left: 55,
        right: 55,
        top: 40,
        bottom: 75
      },
      legend: {
        bottom: 5,
        itemGap: 24,
        textStyle: {
          fontSize: 12
        },
        itemWidth: 20,
        itemHeight: 4
      },
      xAxis: {
        axisLabel: {
          fontSize: 11,
          rotate: 0
        }
      },
      yAxis: [
        {
          nameTextStyle: { fontSize: 11 },
          axisLabel: { fontSize: 11 }
        },
        {
          nameTextStyle: { fontSize: 11 },
          axisLabel: { fontSize: 11 }
        }
      ]
    };
  }
}
