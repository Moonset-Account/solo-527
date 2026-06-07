import type { DataCaliber } from '@/types';

export const DATA_CALIBERS: DataCaliber[] = [
  {
    id: 'c1',
    metricName: 'realtimeVisitor',
    name: '实时客流',
    formula: 'SUM(gate_in) - SUM(gate_out) OVER (last 15min)',
    source: ['gate_record'],
    timeWindow: '15min',
    granularity: '5min',
    version: 'v2.1.0'
  },
  {
    id: 'c2',
    metricName: 'avgWaitTime',
    name: '平均排队时长',
    formula: 'MEDIAN(pass_time - queue_start_time)',
    source: ['gate_record', 'queue_camera'],
    timeWindow: '30min',
    granularity: '10min',
    version: 'v2.1.0'
  },
  {
    id: 'c3',
    metricName: 'entryRate',
    name: '入园率',
    formula: 'COUNT(DISTINCT gate.ticket_no) / COUNT(DISTINCT ticket.ticket_no)',
    source: ['ticket_record', 'gate_record'],
    timeWindow: '1day',
    granularity: '1hour',
    version: 'v2.1.0'
  },
  {
    id: 'c4',
    metricName: 'avgSpendPerVisitor',
    name: '客单价',
    formula: 'SUM(consumption.amount) / COUNT(DISTINCT gate.visitor_id)',
    source: ['consumption_record', 'gate_record'],
    timeWindow: '1day',
    granularity: '2hour',
    version: 'v2.1.0'
  },
  {
    id: 'c5',
    metricName: 'queuePrediction',
    name: '排队预测',
    formula: 'ARIMA(historical_queue, weather, show_schedule)',
    source: ['queue_history', 'weather', 'show_schedule'],
    timeWindow: '2hour',
    granularity: '5min',
    version: 'v2.1.0'
  },
  {
    id: 'c6',
    metricName: 'conversionRate',
    name: '消费转化率',
    formula: 'COUNT(consumption) / COUNT(gate_entry)',
    source: ['gate_record', 'consumption_record'],
    timeWindow: '1day',
    granularity: '1hour',
    version: 'v2.1.0'
  }
];

export const CALIBER_VERSION = 'v2.1.0';
export const LAST_CALIBER_UPDATE = '2024-06-15';
