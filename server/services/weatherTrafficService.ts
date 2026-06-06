import { prisma } from '../utils/db';
import type { FilterParams, WeatherTrafficResponse } from '@shared/types';

export async function getWeatherTrafficAnalysis(filters: FilterParams): Promise<WeatherTrafficResponse> {
  const startDate = new Date(filters.startDate);
  const endDate = new Date(filters.endDate);

  const inventoryWhere: any = {};
  if (filters.storeIds?.length) {
    inventoryWhere.storeId = { in: filters.storeIds };
  }
  if (filters.supplierIds?.length) {
    inventoryWhere.supplierId = { in: filters.supplierIds };
  }
  if (filters.categoryIds?.length) {
    inventoryWhere.product = { categoryId: { in: filters.categoryIds } };
  }
  if (filters.batchIds?.length) {
    inventoryWhere.batchId = { in: filters.batchIds };
  }

  const matchedInventories = await prisma.factInventory.findMany({
    where: inventoryWhere,
    select: { storeId: true },
    distinct: ['storeId'],
  });

  const matchedStoreIds = matchedInventories.map((i: any) => i.storeId);

  const trafficData = await prisma.factDailyTraffic.findMany({
    where: {
      dateId: { gte: startDate, lte: endDate },
      ...(matchedStoreIds.length > 0
        ? { storeId: { in: matchedStoreIds } }
        : {}),
    },
    include: { store: true },
    orderBy: { dateId: 'asc' },
  });

  const lossWhere: any = {
    lossDate: { gte: startDate, lte: endDate },
  };
  
  if (filters.storeIds?.length) {
    lossWhere.inventory = { storeId: { in: filters.storeIds } };
  }
  if (filters.batchIds?.length) {
    lossWhere.inventory = { ...lossWhere.inventory, batchId: { in: filters.batchIds } };
  }
  if (filters.supplierIds?.length) {
    lossWhere.inventory = { ...lossWhere.inventory, supplierId: { in: filters.supplierIds } };
  }
  if (filters.categoryIds?.length) {
    lossWhere.inventory = { ...lossWhere.inventory, product: { categoryId: { in: filters.categoryIds } } };
  }

  const lossData = await prisma.factLoss.findMany({
    where: lossWhere,
    include: { inventory: true },
  });

  const weatherData = await prisma.dimWeather.findMany({
    where: {
      dateId: { gte: startDate, lte: endDate },
    },
    orderBy: { dateId: 'asc' },
  });

  const dailyMap = new Map<string, {
    customerCount: number;
    lossAmount: number;
    lossQty: number;
    conversionRates: number[];
  }>();

  trafficData.forEach((t: any) => {
    const dateKey = t.dateId.toISOString().split('T')[0];
    const existing = dailyMap.get(dateKey) || {
      customerCount: 0,
      lossAmount: 0,
      lossQty: 0,
      conversionRates: [],
    };
    existing.customerCount += t.customerCount;
    existing.conversionRates.push(t.conversionRate);
    dailyMap.set(dateKey, existing);
  });

  lossData.forEach((l: any) => {
    const dateKey = l.lossDate.toISOString().split('T')[0];
    const existing = dailyMap.get(dateKey) || {
      customerCount: 0,
      lossAmount: 0,
      lossQty: 0,
      conversionRates: [],
    };
    existing.lossAmount += l.lossAmount.toNumber();
    existing.lossQty += l.lossQty;
    dailyMap.set(dateKey, existing);
  });

  const items = weatherData.map((w: any) => {
    const dateKey = w.dateId.toISOString().split('T')[0];
    const daily = dailyMap.get(dateKey) || {
      customerCount: 0,
      lossAmount: 0,
      lossQty: 0,
      conversionRates: [],
    };
    const avgConversion = daily.conversionRates.length > 0
      ? daily.conversionRates.reduce((a: number, b: number) => a + b, 0) / daily.conversionRates.length
      : 0;

    return {
      date: dateKey,
      weatherType: w.weatherType || '晴',
      temperature: w.temperature || 20,
      rainfall: w.rainfall || 0,
      customerCount: daily.customerCount,
      lossAmount: daily.lossAmount,
      lossQty: daily.lossQty,
      conversionRate: avgConversion,
    };
  });

  const rainfallValues: number[] = [];
  const lossValues: number[] = [];
  const tempValues: number[] = [];
  const trafficValues: number[] = [];

  items.forEach((item: any) => {
    if (item.lossAmount > 0) {
      rainfallValues.push(item.rainfall);
      lossValues.push(item.lossAmount);
      tempValues.push(item.temperature);
      trafficValues.push(item.customerCount);
    }
  });

  const correlation = {
    rainfallVsLoss: calculateCorrelation(rainfallValues, lossValues),
    temperatureVsLoss: calculateCorrelation(tempValues, lossValues),
    trafficVsLoss: calculateCorrelation(trafficValues, lossValues),
    weatherVsTraffic: calculateCorrelation(rainfallValues, trafficValues),
  };

  return { items, correlation };
}

function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length < 2 || x.length !== y.length) return 0;

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  );

  return denominator === 0 ? 0 : Math.round((numerator / denominator) * 100) / 100;
}
