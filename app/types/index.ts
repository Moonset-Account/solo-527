export interface FilterState {
  fieldIds: number[];
  cropIds: number[];
  pumpIds: number[];
  strategyIds: number[];
  startDate: string;
  endDate: string;
}

export interface FilterOption {
  id: number;
  name: string;
  area?: number;
  waterRequirement?: number;
  ratedFlow?: number;
  strategyType?: string;
}

export interface FilterOptions {
  fields: FilterOption[];
  crops: FilterOption[];
  pumps: FilterOption[];
  strategies: FilterOption[];
}

export interface SummaryStats {
  totalIrrigations: number;
  totalWater: number;
  totalCost: number;
  postRainWater: number;
  activeFields: number;
  avgPumpEfficiency: number;
  anomalyCount: number;
  postRainRate: number;
}

export interface WaterTrendItem {
  date: string;
  fieldId?: number;
  fieldName?: string;
  totalWater: number;
  postRainWater: number;
  normalWater: number;
  irrigationCount: number;
  totalCost: number;
  rainfall: number;
  hasRain: boolean;
}

export interface MoistureItem {
  fieldId: number;
  fieldName: string;
  cropName: string;
  date: string;
  avgMoisture: number;
  minMoisture: number;
  maxMoisture: number;
  fieldArea: number;
}

export interface PumpEnergyItem {
  pumpId: number;
  pumpName: string;
  ratedFlow: number;
  powerRating: number;
  date: string;
  totalWater: number;
  totalElectricity: number;
  totalCost: number;
  avgFlow: number;
  runCount: number;
  runHours: number;
  efficiency: number;
  unitWaterCost: number;
}

export interface StrategyBenefitItem {
  strategyId: number;
  strategyName: string;
  strategyType: string;
  cropName: string;
  fieldName: string;
  applicationCount: number;
  totalWater: number;
  totalCost: number;
  avgFieldArea: number;
  waterPerField: number;
  waterPerMu: number;
  waterSavingRate: number;
}

export interface AnomalyItem {
  id: number;
  fieldName: string;
  cropName: string;
  pumpName: string;
  strategyName: string;
  startTime: string;
  waterVolume: number;
  isAfterRain: boolean;
  rainAmount24h: number;
  flowRate: number;
  ratedFlow: number;
  area: number;
  anomalyType: string;
  severity: string;
  description: string;
  suggestion: string;
}
