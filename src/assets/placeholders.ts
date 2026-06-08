export interface PlaceholderAsset {
  id: string;
  type: 'apparatus' | 'reagent' | 'effect' | 'ui';
  width: number;
  height: number;
  color: string;
  label: string;
}

export const placeholderAssets: PlaceholderAsset[] = [
  { id: 'ph_beaker', type: 'apparatus', width: 60, height: 70, color: '#8ecae6', label: '烧杯' },
  { id: 'ph_flask', type: 'apparatus', width: 55, height: 75, color: '#8ecae6', label: '锥形瓶' },
  { id: 'ph_test_tube', type: 'apparatus', width: 20, height: 80, color: '#8ecae6', label: '试管' },
  { id: 'ph_thermometer', type: 'apparatus', width: 12, height: 90, color: '#e74c3c', label: '温度计' },
  { id: 'ph_bunsen_burner', type: 'apparatus', width: 40, height: 60, color: '#555', label: '酒精灯' },
  { id: 'ph_dropper', type: 'apparatus', width: 14, height: 70, color: '#7a5c3a', label: '滴管' },
  { id: 'ph_stirrer', type: 'apparatus', width: 8, height: 80, color: '#888', label: '玻璃棒' },
  { id: 'ph_funnel', type: 'apparatus', width: 50, height: 60, color: '#8ecae6', label: '漏斗' },
  { id: 'ph_graduated_cylinder', type: 'apparatus', width: 30, height: 90, color: '#8ecae6', label: '量筒' },
  { id: 'ph_reagent_bottle', type: 'reagent', width: 30, height: 50, color: '#444', label: '试剂瓶' },
  { id: 'ph_bubble', type: 'effect', width: 10, height: 10, color: 'rgba(255,255,255,0.6)', label: '气泡' },
  { id: 'ph_steam', type: 'effect', width: 30, height: 40, color: 'rgba(200,200,200,0.4)', label: '蒸汽' },
  { id: 'ph_precipitate', type: 'effect', width: 20, height: 10, color: '#fff', label: '沉淀' },
  { id: 'ph_heat_glow', type: 'effect', width: 40, height: 30, color: '#ff6600', label: '热辐射' },
  { id: 'ph_button', type: 'ui', width: 120, height: 40, color: '#F5C542', label: '按钮' },
  { id: 'ph_panel', type: 'ui', width: 200, height: 300, color: 'rgba(0,0,0,0.5)', label: '面板' },
];

export function getPlaceholder(id: string): PlaceholderAsset | undefined {
  return placeholderAssets.find(p => p.id === id);
}
