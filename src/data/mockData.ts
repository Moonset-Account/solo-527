import { RentalRecord, DistrictAggregation, CommunityAggregation, DISTRICTS, LAYOUTS, SOURCES, SAMPLE_THRESHOLD } from '@/types';

const COMMUNITIES: Record<string, string[]> = {
  '朝阳区': ['望京新城', '亚运村', '三里屯SOHO', '国贸公寓', '双井富力城', '朝阳公园', '酒仙桥', '常营'],
  '海淀区': ['中关村', '五道口华清嘉园', '万柳', '西二旗', '上地', '世纪城', '公主坟', '魏公村'],
  '西城区': ['金融街', '西单', '月坛', '德胜门', '什刹海', '宣武门', '广安门', '三里河'],
  '东城区': ['王府井', '东直门', '东四十条', '朝阳门', '建国门', '天坛', '崇文门', '安定门'],
  '丰台区': ['方庄', '丽泽', '草桥', '马家堡', '宋家庄', '角门', '西局', '丰台科技园'],
  '石景山区': ['八角', '鲁谷', '古城', '苹果园', '金顶街', '五里坨', '广宁', '模式口'],
  '通州区': ['通州北苑', '梨园', '九棵树', '武夷花园', '物资学院', '北关', '乔庄', '玉桥'],
  '昌平区': ['回龙观', '天通苑', '龙泽', '霍营', '立水桥', '沙河', '南邵', '昌平县城'],
  '大兴区': ['黄村', '亦庄', '旧宫', '西红门', '高米店', '清源', '枣园', '瀛海'],
  '顺义区': ['后沙峪', '天竺', '顺义城区', '南法信', '马坡', '牛栏山', '杨镇', '李桥']
};

const DISTRICT_CENTER: Record<string, [number, number]> = {
  '朝阳区': [39.9219, 116.4438],
  '海淀区': [39.9599, 116.2983],
  '西城区': [39.9128, 116.3634],
  '东城区': [39.9283, 116.4163],
  '丰台区': [39.8586, 116.2869],
  '石景山区': [39.9066, 116.2228],
  '通州区': [39.9088, 116.6569],
  '昌平区': [40.2207, 116.2312],
  '大兴区': [39.7289, 116.3381],
  '顺义区': [40.1291, 116.6547]
};

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRandomMultiple<T>(arr: T[], min = 1, max = 3): T[] {
  const count = randomInRange(min, Math.min(max, arr.length));
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function generateDateInRange(startDate: Date, endDate: Date): string {
  const start = startDate.getTime();
  const end = endDate.getTime();
  const randomTime = randomInRange(start, end);
  const date = new Date(randomTime);
  return date.toISOString().split('T')[0];
}

function generateDistrictBoundary(center: [number, number]): [number, number][] {
  const radius = 0.08;
  const points: [number, number][] = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const r = radius * (0.7 + Math.random() * 0.6);
    points.push([
      center[0] + Math.cos(angle) * r,
      center[1] + Math.sin(angle) * r
    ]);
  }
  return points;
}

export function generateRentalRecords(count = 5000): RentalRecord[] {
  const records: RentalRecord[] = [];
  const today = new Date();
  const threeMonthsAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);

  for (let i = 0; i < count; i++) {
    const district = pickRandom(DISTRICTS);
    const community = pickRandom(COMMUNITIES[district]);
    const layout = pickRandom(LAYOUTS);
    const bedrooms = parseInt(layout[0]) || 1;
    const area = Math.round((40 + bedrooms * 25 + Math.random() * 30) * 10) / 10;

    const baseRentByDistrict: Record<string, number> = {
      '西城区': 9500,
      '东城区': 9000,
      '海淀区': 8500,
      '朝阳区': 8000,
      '石景山区': 5500,
      '丰台区': 5000,
      '通州区': 4000,
      '大兴区': 3800,
      '昌平区': 3600,
      '顺义区': 3500
    };

    let baseRent = baseRentByDistrict[district];
    const sizeFactor = area / 70;
    const bedroomFactor = 0.8 + bedrooms * 0.15;
    let rent = Math.round(baseRent * sizeFactor * bedroomFactor * (0.7 + Math.random() * 0.6));

    let isAnomaly = false;
    let anomalyReason: string | undefined;
    if (Math.random() < 0.05) {
      isAnomaly = true;
      const anomalyType = Math.random();
      if (anomalyType < 0.5) {
        rent = Math.round(rent * 2.5);
        anomalyReason = '租金异常偏高';
      } else {
        rent = Math.round(rent * 0.3);
        anomalyReason = '租金异常偏低';
      }
    }

    const unitRent = Math.round((rent / area) * 100) / 100;
    const buildingAge = randomInRange(1, 35);
    const subwayDistance = randomInRange(100, 3000);
    const listingDate = generateDateInRange(threeMonthsAgo, today);
    const dealCycle = Math.random() < 0.6 ? randomInRange(3, 60) : undefined;
    const dealDate = dealCycle
      ? new Date(new Date(listingDate).getTime() + dealCycle * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : undefined;

    const center = DISTRICT_CENTER[district];
    const lat = center[0] + (Math.random() - 0.5) * 0.12;
    const lng = center[1] + (Math.random() - 0.5) * 0.12;

    const sources = pickRandomMultiple(SOURCES, 1, 3);
    const mergeHistory = sources.map(s => `${s}-${i}-${Math.random().toString(36).substr(2, 9)}`);

    records.push({
      id: `REC-${String(i).padStart(5, '0')}`,
      sourcePlatforms: sources,
      community,
      district,
      area,
      layout,
      bedrooms,
      rent,
      unitRent,
      floor: `${randomInRange(1, 6)}/${randomInRange(6, 28)}层`,
      buildingAge,
      subwayDistance,
      listingDate,
      dealDate,
      dealCycle,
      lat,
      lng,
      isAnomaly,
      anomalyReason,
      annotation: undefined,
      mergeHistory
    });
  }

  return records;
}

export function generateDistrictAggregations(records: RentalRecord[]): DistrictAggregation[] {
  const districtMap = new Map<string, RentalRecord[]>();

  records.forEach(record => {
    if (!districtMap.has(record.district)) {
      districtMap.set(record.district, []);
    }
    districtMap.get(record.district)!.push(record);
  });

  return DISTRICTS.map(district => {
    const districtRecords = districtMap.get(district) || [];
    const rents = districtRecords.map(r => r.rent).sort((a, b) => a - b);
    const sampleCount = districtRecords.length;

    const q1 = rents[Math.floor(rents.length * 0.25)] || 0;
    const median = rents[Math.floor(rents.length * 0.5)] || 0;
    const q3 = rents[Math.floor(rents.length * 0.75)] || 0;

    const layoutDistribution: Record<string, number> = {};
    districtRecords.forEach(r => {
      layoutDistribution[r.layout] = (layoutDistribution[r.layout] || 0) + 1;
    });

    const avgDealCycleRecords = districtRecords.filter(r => r.dealCycle !== undefined);

    return {
      district,
      sampleCount,
      avgRent: rents.length > 0 ? Math.round(rents.reduce((a, b) => a + b, 0) / rents.length) : 0,
      medianRent: median,
      q1Rent: q1,
      q3Rent: q3,
      minRent: rents[0] || 0,
      maxRent: rents[rents.length - 1] || 0,
      avgUnitRent: districtRecords.length > 0
        ? Math.round(districtRecords.reduce((a, b) => a + b.unitRent, 0) / districtRecords.length * 100) / 100
        : 0,
      avgDealCycle: avgDealCycleRecords.length > 0
        ? Math.round(avgDealCycleRecords.reduce((a, b) => a + (b.dealCycle || 0), 0) / avgDealCycleRecords.length)
        : 0,
      avgBuildingAge: districtRecords.length > 0
        ? Math.round(districtRecords.reduce((a, b) => a + b.buildingAge, 0) / districtRecords.length)
        : 0,
      avgSubwayDistance: districtRecords.length > 0
        ? Math.round(districtRecords.reduce((a, b) => a + b.subwayDistance, 0) / districtRecords.length)
        : 0,
      layoutDistribution,
      isLowSample: sampleCount < SAMPLE_THRESHOLD,
      boundary: generateDistrictBoundary(DISTRICT_CENTER[district]),
      center: DISTRICT_CENTER[district]
    };
  });
}

export function generateCommunityAggregations(records: RentalRecord[]): CommunityAggregation[] {
  const communityMap = new Map<string, RentalRecord[]>();

  records.forEach(record => {
    const key = `${record.district}-${record.community}`;
    if (!communityMap.has(key)) {
      communityMap.set(key, []);
    }
    communityMap.get(key)!.push(record);
  });

  const aggregations: CommunityAggregation[] = [];
  communityMap.forEach((communityRecords, key) => {
    const [district, community] = key.split('-');
    const rents = communityRecords.map(r => r.rent).sort((a, b) => a - b);
    const sampleCount = communityRecords.length;

    aggregations.push({
      community,
      district,
      sampleCount,
      avgRent: rents.length > 0 ? Math.round(rents.reduce((a, b) => a + b, 0) / rents.length) : 0,
      medianRent: rents[Math.floor(rents.length * 0.5)] || 0,
      lat: communityRecords.reduce((a, b) => a + b.lat, 0) / communityRecords.length,
      lng: communityRecords.reduce((a, b) => a + b.lng, 0) / communityRecords.length,
      isLowSample: sampleCount < SAMPLE_THRESHOLD
    });
  });

  return aggregations;
}

export const MOCK_RECORDS = generateRentalRecords(3000);
export const DISTRICT_AGGREGATIONS = generateDistrictAggregations(MOCK_RECORDS);
export const COMMUNITY_AGGREGATIONS = generateCommunityAggregations(MOCK_RECORDS);

export const DATA_UPDATE_TIME = new Date().toISOString();
