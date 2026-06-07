export const ENTRANCES = ['东门', '西门', '南门', '北门'];

export const AREAS = [
  { id: 'area1', name: '主入口广场', capacity: 5000 },
  { id: 'area2', name: '过山车区', capacity: 2000 },
  { id: 'area3', name: '旋转木马区', capacity: 1500 },
  { id: 'area4', name: '水上乐园', capacity: 3000 },
  { id: 'area5', name: '演出剧场', capacity: 1200 },
  { id: 'area6', name: '美食街', capacity: 2500 },
  { id: 'area7', name: '纪念品商店', capacity: 800 },
  { id: 'area8', name: '儿童乐园', capacity: 1800 }
];

export const AREA_MAP: Record<string, string> = AREAS.reduce((acc, a) => {
  acc[a.id] = a.name;
  acc[a.name] = a.id;
  return acc;
}, {} as Record<string, string>);

export function getAreaName(areaId: string): string {
  return AREA_MAP[areaId] || areaId;
}

export function getAreaId(areaName: string): string {
  return AREA_MAP[areaName] || areaName;
}

export function getAreaIds(names: string[]): string[] {
  return names.map(n => getAreaId(n));
}

export function getAreaNames(ids: string[]): string[] {
  return ids.map(id => getAreaName(id));
}

export const TICKET_TYPES = ['成人票', '儿童票', '老人票', '学生票', 'VIP票', '家庭套票'];

export const ACTIVITIES = ['日常运营', '周末特别活动', '节假日', '暑期档', '夜间场'];
