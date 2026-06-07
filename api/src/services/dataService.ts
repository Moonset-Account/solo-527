import { randomUUID } from 'crypto';
import {
  vehicles, routes, customers, batches, probes,
  tempRecords, posRecords, doorRecords, anomalies,
  savedFilters, dataQualityLogs,
  rawTemperatureRecords, rawPositionRecords, rawDoorRecords
} from '../db/mockData.js';
import {
  cleanTemperatureRecords, cleanPositionRecords, cleanDoorRecords,
  calculateDataQuality
} from '../scripts/dataCleaner.js';
import { DATA_QUALITY_CONFIG } from '../config/metricsConfig.js';
import {
  getSavedFiltersFromStorage,
  saveFilterToStorage,
  deleteFilterFromStorage,
} from './fileStorage.js';
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
    .sort((a, b) => b.startTime - a.startTime)
    .slice(0, 100)
    .map(b => ({
      ...b,
      startTime: b.startTime,
      estimatedArrival: b.estimatedArrival,
      actualArrival: b.actualArrival,
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
    const start = b.startTime;
    const actual = b.actualArrival || start;
    const estimated = b.estimatedArrival;
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
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(0, 5000);
};

export const getAnomalyStatistics = (dimension: string = 'vehicle'): AnomalyStatistics[] => {
  if (dimension === 'vehicle') {
    return vehicles.map(v => {
      const vehicleAnomalies = anomalies.filter(a => a.vehicleId === v.id);
      const totalDuration = vehicleAnomalies.reduce((sum, a) => sum + (a.duration || 0), 0);
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
      const totalDuration = routeAnomalies.reduce((sum, a) => sum + (a.duration || 0), 0);
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
    const totalDuration = vehicleAnomalies.reduce((sum, a) => sum + (a.duration || 0), 0);
    return {
      dimension,
      dimensionValue: v.plateNumber,
      totalAnomalyDuration: totalDuration,
      anomalyCount: vehicleAnomalies.length,
    };
  }).sort((a, b) => b.totalAnomalyDuration - a.totalAnomalyDuration);
};

export const getProbeStatus = (): TemperatureProbe[] => {
  return [...probes];
};

export const getRouteTrack = (vehicleId: string, batchId?: string): PositionRecord[] => {
  let result = posRecords.filter(p => p.vehicleId === vehicleId);
  
  if (batchId) {
    const batch = batches.find(b => b.id === batchId);
    if (batch) {
      const startTime = batch.startTime;
      const endTime = batch.actualArrival || Date.now();
      result = result.filter(p => {
        const t = p.timestamp;
        return t >= startTime && t <= endTime;
      });
    }
  }
  
  return result
    .sort((a, b) => a.timestamp - b.timestamp);
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
  
  result.sort((a, b) => b.startTime - a.startTime);
  
  const total = result.length;
  const start = (page - 1) * pageSize;
  const list = result.slice(start, start + pageSize).map(a => ({
    ...a,
    startTime: a.startTime,
    endTime: a.endTime,
    duration: a.duration || 0,
  }));
  
  return { list, total, page, pageSize };
};

export const getAnomalyDetail = (anomalyId: string) => {
  const anomaly = anomalies.find(a => a.id === anomalyId);
  if (!anomaly) return null;
  
  const relatedDoors = doorRecords.filter(d => {
    if (d.vehicleId !== anomaly.vehicleId) return false;
    const anomalyStart = anomaly.startTime;
    const doorOpen = d.openTime || 0;
    const doorClose = d.closeTime || 0;
    return Math.abs(doorOpen - anomalyStart) < 30 * 60 * 1000 || 
           Math.abs(doorClose - anomalyStart) < 30 * 60 * 1000;
  });
  
  return {
    anomaly: {
      ...anomaly,
      startTime: anomaly.startTime,
      endTime: anomaly.endTime,
      duration: anomaly.duration || 0,
    },
    relatedDoors: relatedDoors.map(d => ({
      ...d,
      openTime: d.openTime || 0,
      closeTime: d.closeTime || 0,
      duration: d.duration || 0,
    })),
  };
};

export const getDoorRecords = (batchId: string): DoorRecord[] => {
  return doorRecords
    .filter(d => d.batchId === batchId)
    .sort((a, b) => (a.openTime || 0) - (b.openTime || 0))
    .map(d => ({
      ...d,
      openTime: d.openTime || 0,
      closeTime: d.closeTime || 0,
      duration: d.duration || 0,
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
        const actual = b.actualArrival || 0;
        const estimated = b.estimatedArrival;
        const start = b.startTime;
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
        const actual = b.actualArrival || 0;
        const estimated = b.estimatedArrival;
        const start = b.startTime;
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
        const actual = b.actualArrival || 0;
        const estimated = b.estimatedArrival;
        const start = b.startTime;
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
  } else if (dimension === 'batch') {
    for (const id of ids) {
      const batch = batches.find(b => b.id === id);
      if (!batch) continue;
      
      const batchTemps = tempRecords.filter(t => t.batchId === id);
      const avgTemp = batchTemps.length > 0 
        ? batchTemps.reduce((sum, t) => sum + t.temperature, 0) / batchTemps.length 
        : 0;
      
      const batchAnomalies = anomalies.filter(a => a.batchId === id);
      const isDelivered = batch.status === 'delivered' || batch.status === 'exception';
      const onTime = isDelivered && batch.actualArrival && batch.actualArrival <= batch.estimatedArrival ? 1 : 0;
      const duration = isDelivered && batch.actualArrival 
        ? Math.round((batch.actualArrival - batch.startTime) / 60000)
        : 0;
      
      items.push({
        id,
        name: `批次${batch.batchNo || id.slice(0, 8)}`,
        avgTemperature: Math.round(avgTemp * 100) / 100,
        anomalyCount: batchAnomalies.length,
        onTimeRate: isDelivered ? (onTime ? 100 : 0) : 0,
        avgDuration: duration,
      });
    }
  } else if (dimension === 'probe') {
    for (const id of ids) {
      const probe = probes.find(p => p.id === id);
      if (!probe) continue;
      
      const probeTemps = tempRecords.filter(t => t.probeId === id);
      const avgTemp = probeTemps.length > 0 
        ? probeTemps.reduce((sum, t) => sum + t.temperature, 0) / probeTemps.length 
        : 0;
      
      const probeAnomalies = anomalies.filter(a => a.probeId === id);
      const probeBatches = [...new Set(probeTemps.map(t => t.batchId).filter(Boolean))];
      const deliveredBatches = batches.filter(b => 
        probeBatches.includes(b.id) && (b.status === 'delivered' || b.status === 'exception')
      );
      let onTimeCount = 0;
      let totalDuration = 0;
      for (const b of deliveredBatches) {
        const actual = b.actualArrival || 0;
        const estimated = b.estimatedArrival;
        const start = b.startTime;
        if (actual <= estimated) onTimeCount++;
        totalDuration += (actual - start);
      }
      
      items.push({
        id,
        name: probe.probeCode,
        avgTemperature: Math.round(avgTemp * 100) / 100,
        anomalyCount: probeAnomalies.length,
        onTimeRate: deliveredBatches.length > 0 ? Math.round((onTimeCount / deliveredBatches.length) * 100) : 0,
        avgDuration: deliveredBatches.length > 0 ? Math.round(totalDuration / deliveredBatches.length / 60000) : 0,
      });
    }
  }
  
  return { dimension, items };
};

export const getDataQualityReport = (): DataQualityReport => {
  const tempCleanResult = cleanTemperatureRecords(rawTemperatureRecords);
  const posCleanResult = cleanPositionRecords(rawPositionRecords);
  const doorCleanResult = cleanDoorRecords(rawDoorRecords);
  
  const cleanedReport = calculateDataQuality(tempCleanResult, posCleanResult, doorCleanResult);
  
  const sampleSize = [
    { dimension: 'temperature_records', count: rawTemperatureRecords.length },
    { dimension: 'position_records', count: rawPositionRecords.length },
    { dimension: 'door_records', count: rawDoorRecords.length },
    { dimension: 'anomaly_events', count: anomalies.length },
    { dimension: 'delivery_batches', count: batches.length },
  ];
  
  const allIssues = [...tempCleanResult.issues, ...posCleanResult.issues, ...doorCleanResult.issues];
  const errorMessage = allIssues.length > 0 
    ? allIssues.slice(0, 3).join('; ') 
    : undefined;
  
  const isUpdateFailed = cleanedReport.completeness < DATA_QUALITY_CONFIG.completenessThreshold;
  
  return {
    updateTime: Date.now(),
    completeness: cleanedReport.completeness,
    missingFields: cleanedReport.missingFields,
    anomalyPoints: tempCleanResult.data.filter(t => !t.isNormal).length,
    sampleSize,
    isUpdateFailed,
    errorMessage,
  };
};

export const getSavedFilters = (userId: string = 'default'): SavedFilter[] => {
  return getSavedFiltersFromStorage(userId);
};

export const saveFilter = (name: string, filters: Record<string, any>, userId: string = 'default'): SavedFilter => {
  return saveFilterToStorage(name, filters, userId);
};

export const deleteFilter = (id: string): boolean => {
  return deleteFilterFromStorage(id);
};
