import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SuperadminState {
  selectedCompanyId: string | null;
  selectedCompanyName: string | null;
  setSelectedCompany: (id: string | null, name?: string | null) => void;
  clearSelectedCompany: () => void;
}

export const useSuperadminStore = create<SuperadminState>()(
  persist(
    (set) => ({
      selectedCompanyId: null,
      selectedCompanyName: null,
      setSelectedCompany: (id, name) => set({ 
        selectedCompanyId: id, 
        selectedCompanyName: name 
      }),
      clearSelectedCompany: () => set({ 
        selectedCompanyId: null, 
        selectedCompanyName: null 
      }),
    }),
    {
      name: 'superadmin-storage',
    }
  )
);
