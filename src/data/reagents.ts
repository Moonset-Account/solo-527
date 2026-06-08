import { Reagent } from '@/types/game';

export const reagents: Reagent[] = [
  { id: 'nacl', name: '氯化钠', formula: 'NaCl', concentration: '10%', color: '#ffffff', state: 'solid', dangerLevel: 0 },
  { id: 'water', name: '蒸馏水', formula: 'H₂O', concentration: '纯', color: '#b3e5fc', state: 'liquid', dangerLevel: 0 },
  { id: 'hcl', name: '盐酸', formula: 'HCl', concentration: '0.1mol/L', color: '#e8f5e9', state: 'liquid', dangerLevel: 2 },
  { id: 'naoh', name: '氢氧化钠溶液', formula: 'NaOH', concentration: '0.1mol/L', color: '#fff9c4', state: 'liquid', dangerLevel: 2 },
  { id: 'cuso4', name: '硫酸铜溶液', formula: 'CuSO₄', concentration: '0.1mol/L', color: '#42a5f5', state: 'liquid', dangerLevel: 1 },
  { id: 'agno3', name: '硝酸银溶液', formula: 'AgNO₃', concentration: '0.1mol/L', color: '#e0e0e0', state: 'liquid', dangerLevel: 1 },
  { id: 'phenolphthalein', name: '酚酞指示剂', formula: 'C₂₀H₁₄O₄', concentration: '0.1%', color: '#f8bbd0', state: 'liquid', dangerLevel: 0 },
  { id: 'litmus', name: '石蕊指示剂', formula: '', concentration: '0.5%', color: '#9c27b0', state: 'liquid', dangerLevel: 0 },
  { id: 'bacl2', name: '氯化钡溶液', formula: 'BaCl₂', concentration: '0.1mol/L', color: '#e8eaf6', state: 'liquid', dangerLevel: 2 },
  { id: 'na2so4', name: '硫酸钠溶液', formula: 'Na₂SO₄', concentration: '0.1mol/L', color: '#e0f7fa', state: 'liquid', dangerLevel: 0 },
];

export function getReagentById(id: string): Reagent | undefined {
  return reagents.find(r => r.id === id);
}
