import { randomUUID } from 'crypto';
import {
  vehicles, routes, customers, batches, probes,
  tempRecords, posRecords, doorRecords, anomalies,
  savedFilters, dataQualityLogs
} from '../db/mockData.js';
import type {
  Vehicle, Route, Customer, TemperatureRecord, PositionRecord,
  DoorRecord, DeliveryBatch, TemperatureProbe, AnomalyEvent,
  KPIData, AnomalyStatistics, DataQualityReport, SavedFilter, CompareMetrics
} from '../../../shared/types';

export const getVehicles = (): Vehicle[] => {
  return [...vehicles];
};

export const getRoutes = (): Route[] => {
  return [...routes];
};

export const getCustomers = (): Customer[] => {
  return [...customers];
};

export const getBatches = (filters?: any): DeliveryBatch[] => {
  let result = [...batches];
  
  if (filters?.vehicleId) {
    result = result.filter(b => b.vehicleId === filters.vehicleId);
  }
  if (filters?.status) {
    result = result.filter(b => b.status === filters.status);
  }
  
  return result
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 100)
    .map(b => ({
      ...b,
      startTime: new Date(b.startTime).getTime(),
      estimatedArrival: new Date(b.estimatedArrival).getTime(),
      actualArrival: b.actualArrival ? new Date(b.actualArrival).getTime() : null,
    }));
};

export const getKPIData = (): KPIData => {
  const activeVehicles = vehicles.filter(v => v.status === 'running').length;
  const totalTempRecords = tempRecords.length;
  const anomalyTempRecords = tempRecords.filter(t => !t.isNormal).length;
  const deliveredBatches = batches.filter(b => b.status === 'delivered' || b.status === 'exception');
  
  let totalDuration = 0;
  let onTimeCount = 0;
  for (const b of deliveredBatches) {
    const start = new Date(b.startTime).getTime();
    const actual = b.actualArrival ? new Date(b.actualArrival).getTime() : start;
    const estimated = new Date(b.estimatedArrival).getTime();
    totalDuration += (actual - start);
    if (actual <= estimated) onTimeCount++;
  }

  const pendingAnomalies = anomalies.filter(a => a.status === 'pending').length;

  return {
    activeVehicles,
    temperatureAnomalyRate: totalTempRecords > 0 
      ? Math.round((anomalyTempRecords / totalTempRecords) * 10000) / 100 
      : 0,
    avgDeliveryDuration: deliveredBatches.length > 0 
      ? Math.round(totalDuration / deliveredBatches.length / 60000) 
      : 0,
    onTimeRate: deliveredBatches.length > 0 
      ? Math.round((onTimeCount / deliveredBatches.length) * 10000) / 100 
      : 0,
    pendingAnomalies,
  };
};

export const getTemperatureTrend = (vehicleId?: string, batchId?: string): TemperatureRecord[] => {
  let result = [...tempRecords];
  
  if (vehicleId) {
    result = result.filter(t => t.vehicleId === vehicleId);
  }
  if (batchId) {
    result = result.filter(t => t.batchId === batchId);
  }
  
  return result
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .slice(0, 5000)
    .map(t => ({
      ...t,
      timestamp: new Date(t.timestamp).getTime(),
    }));
};

export const getAnomalyStatistics = (dimension: string = 'vehicle'): AnomalyStatistics[] => {
  if (dimension === 'vehicle') {
    return vehicles.map(v => {
      const vehicleAnomalies = anomalies.filter(a => a.vehicleId === v.id);
      const totalDuration = vehicleAnomalies.reduce((sum, a) => sum + (a.durationSeconds || 0), 0);
      return {
        dimension,
        dimensionValue: v.plateNumber,
        totalAnomalyDuration: totalDuration,
        anomalyCount: vehicleAnomalies.length,
      };
    }).sort((a, b) => b.totalAnomalyDuration - a.totalAnomalyDuration);
  } else if (dimension === 'route') {
    return routes.map(r => {
      const routeBatches = batches.filter(b => b.routeId === r.id);
      const routeAnomalies = anomalies.filter(a => 
        routeBatches.some(b => b.id === a.batchId)
      );
      const totalDuration = routeAnomalies.reduce((sum, a) => sum + (a.durationSeconds || 0), 0);
      return {
        dimension,
        dimensionValue: r.name,
        totalAnomalyDuration: totalDuration,
        anomalyCount: routeAnomalies.length,
      };
    }).sort((a, b) => b.totalAnomalyDuration - a.totalAnomalyDuration);
  }
  
  return vehicles.map(v => {
    const vehicleAnomalies = anomalies.filter(a => a.vehicleId === v.id);
    const totalDuration = vehicleAnomalies.reduce((sum, a) => sum + (a.durationSeconds || 0), 0);
    return {
      dimension,
      dimensionValue: v.plateNumber,
      totalAnomalyDuration: totalDuration,
      anomalyCount: vehicleAnomalies.length,
    };
  }).sort((a, b) => b.totalAnomalyDuration - a.totalAnomalyDuration);
};

export const getProbeStatus = (): TemperatureProbe[] => {
  return probes.map(p => ({
    ...p,
    lastCalibrationDate: new Date(p.lastCalibrationDate).getTime(),
    nextCalibrationDate: new Date(p.nextCalibrationDate).getTime(),
  }));
};

export const getRouteTrack = (vehicleId: string, batchId?: string): PositionRecord[] => {
  let result = posRecords.filter(p => p.vehicleId === vehicleId);
  
  if (batchId) {
    const batch = batches.find(b => b.id === batchId);
    if (batch) {
      const startTime = new Date(batch.startTime).getTime();
      const endTime = batch.actualArrival ? new Date(batch.actualArrival).getTime() : Date.now();
      result = result.filter(p => {
        const t = new Date(p.timestamp).getTime();
        return t >= startTime && t <= endTime;
      });
    }
  }
  
  return result
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(p => ({
      ...p,
      timestamp: new Date(p.timestamp).getTime(),
    }));
};

export const getAnomalyList = (page: number = 1, pageSize: number = 20, filters?: any) => {
  let result = [...anomalies];
  
  if (filters?.type) {
    result = result.filter(a => a.type === filters.type);
  }
  if (filters?.severity) {
    result = result.filter(a => a.severity === filters.severity);
  }
  if (filters?.status) {
    result = result.filter(a => a.status === filters.status);
  }
  
  result.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  
  const total = result.length;
  const start = (page - 1) * pageSize;
  const list = result.slice(start, start + pageSize).map(a => ({
    ...a,
    startTime: new Date(a.startTime).getTime(),
    endTime: a.endTime ? new Date(a.endTime).getTime() : null,
    duration: a.durationSeconds || 0,
  }));
  
  return { list, total, page, pageSize };
};

export const getAnomalyDetail = (anomalyId: string) => {
  const anomaly = anomalies.find(a => a.id === anomalyId);
  if (!anomaly) return null;
  
  const relatedDoors = doorRecords.filter(d => {
    if (d.vehicleId !== anomaly.vehicleId) return false;
    const anomalyStart = new Date(anomaly.startTime).getTime();
    const doorOpen = d.openTime ? new Date(d.openTime).getTime() : 0;
    const doorClose = d.closeTime ? new Date(d.closeTime).getTime() : 0;
    return Math.abs(doorOpen - anomalyStart) < 30 * 60 * 1000 || 
           Math.abs(doorClose - anomalyStart) < 30 * 60 * 1000;
  });
  
  return {
    anomaly: {
      ...anomaly,
      startTime: new Date(anomaly.startTime).getTime(),
      endTime: anomaly.endTime ? new Date(anomaly.endTime).getTime() : null,
      duration: anomaly.durationSeconds || 0,
    },
    relatedDoors: relatedDoors.map(d => ({
      ...d,
      openTime: d.openTime ? new Date(d.openTime).getTime() : 0,
      closeTime: d.closeTime ? new Date(d.closeTime).getTime() : 0,
      duration: d.durationSeconds || 0,
    })),
  };
};

export const getDoorRecords = (batchId: string): DoorRecord[] => {
  return doorRecords
    .filter(d => d.batchId === batchId)
    .sort((a, b) => new Date(a.openTime || 0).getTime() - new Date(b.openTime || 0).getTime())
    .map(d => ({
      ...d,
      openTime: d.openTime ? new Date(d.openTime).getTime() : 0,
      closeTime: d.closeTime ? new Date(d.closeTime).getTime() : 0,
      duration: d.durationSeconds || 0,
    }));
};

export const getCompareMetrics = (dimension: string, ids: string[], metrics: string[]): CompareMetrics => {
  const items: CompareMetrics['items'] = [];
  
  if (dimension === 'vehicle') {
    for (const id of ids) {
      const vehicle = vehicles.find(v => v.id === id);
      if (!vehicle) continue;
      
      const vehicleTemps = tempRecords.filter(t => t.vehicleId === id);
      const avgTemp = vehicleTemps.length > 0 
        ? vehicleTemps.reduce((sum, t) => sum + t.temperature, 0) / vehicleTemps.length 
        : 0;
      
      const vehicleAnomalies = anomalies.filter(a => a.vehicleId === id);
      const vehicleBatches = batches.filter(b => b.vehicleId === id && (b.status === 'delivered' || b.status === 'exception'));
      
      let onTimeCount = 0;
      let totalDuration = 0;
      for (const b of vehicleBatches) {
        const actual = b.actualArrival ? new Date(b.actualArrival).getTime() : 0;
        const estimated = new Date(b.estimatedArrival).getTime();
        const start = new Date(b.startTime).getTime();
        if (actual <= estimated) onTimeCount++;
        totalDuration += (actual - start);
      }
      
      items.push({
        id,
        name: vehicle.plateNumber,
        avgTemperature: Math.round(avgTemp * 100) / 100,
        anomalyCount: vehicleAnomalies.length,
        onTimeRate: vehicleBatches.length > 0 ? Math.round((onTimeCount / vehicleBatches.length) * 100) : 0,
        avgDuration: vehicleBatches.length > 0 ? Math.round(totalDuration / vehicleBatches.length / 60000) : 0,
      });
    }
  } else if (dimension === 'route') {
    for (const id of ids) {
      const route = routes.find(r => r.id === id);
      if (!route) continue;
      
      const routeBatches = batches.filter(b => b.routeId === id);
      const routeTemps = tempRecords.filter(t => 
        routeBatches.some(b => b.id === t.batchId)
      );
      const avgTemp = routeTemps.length > 0 
        ? routeTemps.reduce((sum, t) => sum + t.temperature, 0) / routeTemps.length 
        : 0;
      
      const routeAnomalies = anomalies.filter(a => 
        routeBatches.some(b => b.id === a.batchId)
      );
      
      const deliveredBatches = routeBatches.filter(b => b.status === 'delivered' || b.status === 'exception');
      let onTimeCount = 0;
      let totalDuration = 0;
      for (const b of deliveredBatches) {
        const actual = b.actualArrival ? new Date(b.actualArrival).getTime() : 0;
        const estimated = new Date(b.estimatedArrival).getTime();
        const start = new Date(b.startTime).getTime();
        if (actual <= estimated) onTimeCount++;
        totalDuration += (actual - start);
      }
      
      items.push({
        id,
        name: route.name,
        avgTemperature: Math.round(avgTemp * 100) / 100,
        anomalyCount: routeAnomalies.length,
        onTimeRate: deliveredBatches.length > 0 ? Math.round((onTimeCount / deliveredBatches.length) * 100) : 0,
        avgDuration: deliveredBatches.length > 0 ? Math.round(totalDuration / deliveredBatches.length / 60000) : 0,
      });
    }
  } else if (dimension === 'customer') {
    for (const id of ids) {
      const customer = customers.find(c => c.id === id);
      if (!customer) continue;
      
      const customerBatches = batches.filter(b => b.customerId === id);
      const customerTemps = tempRecords.filter(t => 
        customerBatches.some(b => b.id === t.batchId)
      );
      const avgTemp = customerTemps.length > 0 
        ? customerTemps.reduce((sum, t) => sum + t.temperature, 0) / customerTemps.length 
        : 0;
      
      const customerAnomalies = anomalies.filter(a => 
        customerBatches.some(b => b.id === a.batchId)
      );
      
      const deliveredBatches = customerBatches.filter(b => b.status === 'delivered' || b.status === 'exception');
      let onTimeCount = 0;
      let totalDuration = 0;
      for (const b of deliveredBatches) {
        const actual = b.actualArrival ? new Date(b.actualArrival).getTime() : 0;
        const estimated = new Date(b.estimatedArrival).getTime();
        const start = new Date(b.startTime).getTime();
        if (actual <= estimated) onTimeCount++;
        totalDuration += (actual - start);
      }
      
      items.push({
        id,
        name: customer.name,
        avgTemperature: Math.round(avgTemp * 100) / 100,
        anomalyCount: customerAnomalies.length,
        onTimeRate: deliveredBatches.length > 0 ? Math.round((onTimeCount / deliveredBatches.length) * 100) : 0,
        avgDuration: deliveredBatches.length > 0 ? Math.round(totalDuration / deliveredBatches.length / 60000) : 0,
      });
    }
  }
  
  return { dimension, items };
};

export const getDataQualityReport = (): DataQualityReport => {
  const latest = dataQualityLogs.length > 0 
    ? dataQualityLogs.sort((a, b) => new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime())[0]
    : null;
  
  const sampleSize = [
    { dimension: 'temperature_records', count: tempRecords.length },
    { dimension: 'position_records', count: posRecords.length },
    { dimension: 'door_records', count: doorRecords.length },
    { dimension: 'anomaly_events', count: anomalies.length },
    { dimension: 'delivery_batches', count: batches.length },
  ];
  
  if (!latest) {
    return {
      updateTime: Date.now(),
      completeness: 100,
      missingFields: [],
      anomalyPoints: 0,
      sampleSize,
      isUpdateFailed: false,
    };
  }
  
  return {
    updateTime: new Date(latest.updateTime).getTime(),
    completeness: latest.completeness,
    missingFields: latest.missingFields || [],
    anomalyPoints: latest.anomalyPoints,
    sampleSize,
    isUpdateFailed: latest.isUpdateFailed,
    errorMessage: latest.errorMessage,
  };
};

export const getSavedFilters = (userId: string = 'default'): SavedFilter[] => {
  return savedFilters
    .filter(f => f.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(f => ({
      ...f,
      createdAt: new Date(f.createdAt).getTime(),
    }));
};

export const saveFilter = (name: string, filters: Record<string, any>, userId: string = 'default'): SavedFilter => {
  const newFilter: SavedFilter = {
    id: randomUUID(),
    userId,
    name,
    filters,
    createdAt: new Date().toISOString(),
  };
  savedFilters.push(newFilter);
  return newFilter;
};

export const deleteFilter = (id: string): boolean => {
  const index = savedFilters.findIndex(f => f.id === id);
  if (index > -1) {
    savedFilters.splice(index, 1);
    return true;
  }
  return false;
};
