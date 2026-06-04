import { create } from 'zustand';
import type { PackageType, MemberPackage } from '../../shared/types';
import { packageApi } from '@/utils/api';

interface PackageState {
  packageTypes: PackageType[];
  memberPackages: MemberPackage[];
  loading: boolean;
  error: string | null;
  fetchPackageTypes: (activeOnly?: boolean) => Promise<void>;
  createPackageType: (data: Partial<PackageType>) => Promise<PackageType>;
  updatePackageType: (id: number, data: Partial<PackageType>) => Promise<PackageType>;
  deletePackageType: (id: number) => Promise<void>;
  purchasePackage: (memberId: number, packageTypeId: number, paidAmount: number) => Promise<MemberPackage>;
  fetchMemberPackages: (memberId: number) => Promise<void>;
}

export const usePackageStore = create<PackageState>((set) => ({
  packageTypes: [],
  memberPackages: [],
  loading: false,
  error: null,
  fetchPackageTypes: async (activeOnly?: boolean) => {
    set({ loading: true, error: null });
    try {
      const packageTypes = await packageApi.list(activeOnly);
      set({ packageTypes, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
  createPackageType: async (data: Partial<PackageType>) => {
    const pt = await packageApi.create(data);
    set((s) => ({ packageTypes: [...s.packageTypes, pt] }));
    return pt;
  },
  updatePackageType: async (id: number, data: Partial<PackageType>) => {
    const pt = await packageApi.update(id, data);
    set((s) => ({ packageTypes: s.packageTypes.map((p) => (p.id === id ? pt : p)) }));
    return pt;
  },
  deletePackageType: async (id: number) => {
    await packageApi.remove(id);
    set((s) => ({ packageTypes: s.packageTypes.filter((p) => p.id !== id) }));
  },
  purchasePackage: async (memberId: number, packageTypeId: number, paidAmount: number) => {
    const mp = await packageApi.purchasePackage(memberId, packageTypeId, paidAmount);
    set((s) => ({ memberPackages: [...s.memberPackages, mp] }));
    return mp;
  },
  fetchMemberPackages: async (memberId: number) => {
    try {
      const memberPackages = await packageApi.getMemberPackages(memberId);
      set({ memberPackages });
    } catch (err: any) {
      set({ error: err.message });
    }
  },
}));
