import { config } from '../config';

export type PriceType = 'member' | 'subsidy' | 'commercial';

export function calculatePrice(
  hours: number,
  priceType: PriceType,
  fieldArea: number = 0
): {
  basePrice: number;
  multiplier: number;
  areaSurcharge: number;
  totalAmount: number;
} {
  const basePrice = hours * config.price.basePricePerHour;
  const multiplier = config.price.multipliers[priceType];
  
  let areaSurcharge = 0;
  if (fieldArea > 50) {
    areaSurcharge = basePrice * 0.05;
  }

  const totalAmount = (basePrice + areaSurcharge) * multiplier;

  return {
    basePrice: parseFloat(basePrice.toFixed(2)),
    multiplier,
    areaSurcharge: parseFloat(areaSurcharge.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2))
  };
}

export function getPriceTypeLabel(type: PriceType): string {
  const labels: Record<PriceType, string> = {
    member: '社员自用',
    subsidy: '合作社补贴',
    commercial: '跨村租赁'
  };
  return labels[type];
}

export function getPriceTypeDescription(type: PriceType): string {
  const descriptions: Record<PriceType, string> = {
    member: '合作社内部社员使用，享受7折优惠',
    subsidy: '政府补贴项目，个人仅需支付50%',
    commercial: '外部村社租赁，按市场价130%计费'
  };
  return descriptions[type];
}
