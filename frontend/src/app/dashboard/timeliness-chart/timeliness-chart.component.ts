import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-timeliness-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './timeliness-chart.component.html',
  styleUrls: ['./timeliness-chart.component.scss'],
})
export class TimelinessChartComponent implements OnInit {
  barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [],
  };

  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (label === '平均处理时长') {
              return `${label}: ${value} 小时`;
            }
            return `${label}: ${value}%`;
          },
        },
      },
    },
    scales: {
      x: {},
      y: {
        beginAtZero: true,
      },
    },
  };

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.dashboardService.getTimeliness().subscribe({
      next: (data) => {
        this.barChartData = {
          labels: data.labels,
          datasets: [
            {
              label: '平均处理时长',
              data: data.avgProcessingTimes,
              backgroundColor: 'rgba(63, 81, 181, 0.7)',
              borderColor: '#3f51b5',
              borderWidth: 1,
              yAxisID: 'y',
            },
            {
              label: 'SLA合规率',
              data: data.slaComplianceRates,
              backgroundColor: 'rgba(0, 150, 136, 0.7)',
              borderColor: '#009688',
              borderWidth: 1,
              yAxisID: 'y1',
            },
          ],
        };

        this.barChartOptions = {
          ...this.barChartOptions,
          scales: {
            x: {},
            y: {
              type: 'linear',
              position: 'left',
              beginAtZero: true,
              title: { display: true, text: '处理时长 (小时)' },
            },
            y1: {
              type: 'linear',
              position: 'right',
              beginAtZero: true,
              max: 100,
              title: { display: true, text: '合规率 (%)' },
              grid: { drawOnChartArea: false },
            },
          },
        };
      },
    });
  }
}
