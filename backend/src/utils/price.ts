import { config } from '../config';
import { PriceType } from '../types';

export function calculatePrice(
  hours: number,
  priceType: PriceType,
  area: number = 0
): {
  basePrice: number;
  subsidyAmount: number;
  totalAmount: number;
} {
  const basePrice = hours * config.price.basePricePerHour;
  const multiplier = config.price.multipliers[priceType];
  
  let totalAmount = basePrice * multiplier;
  let subsidyAmount = 0;

  if (priceType === 'cooperative_subsidy') {
    subsidyAmount = basePrice * 0.5;
    totalAmount = basePrice - subsidyAmount;
  }

  return {
    basePrice: Math.round(basePrice * 100) / 100,
    subsidyAmount: Math.round(subsidyAmount * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100
  };
}

export function getPriceTypeLabel(type: PriceType): string {
  const labels: Record<PriceType, string> = {
    self_use: '社员自用',
    cooperative_subsidy: '合作社补贴',
    cross_village: '跨村租赁'
  };
  return labels[type];
}
