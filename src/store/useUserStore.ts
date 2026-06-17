import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Cleaner, Customer, RecurringService, CleanerPerformance } from '../types';
import {
  getCleaners,
  getCustomers,
  getRecurringServices,
  getCleanerPerformances,
  createRecurringService,
  toggleRecurringService,
} from '../services/userService';

interface UserState {
  cleaners: Cleaner[];
  customers: Customer[];
  recurringServices: RecurringService[];
  performances: CleanerPerformance[];
  loading: boolean;
  error: string | null;
  fetchCleaners: () => Promise<void>;
  fetchCustomers: () => Promise<void>;
  fetchRecurringServices: (customerId?: string) => Promise<void>;
  fetchPerformances: (month?: string) => Promise<void>;
  addRecurringService: (data: Omit<RecurringService, 'id' | 'createdAt' | 'address' | 'nextOrderDate' | 'isActive'>) => Promise<RecurringService>;
  createRecurringService: (data: Omit<RecurringService, 'id' | 'createdAt' | 'address' | 'nextOrderDate' | 'isActive'>) => Promise<RecurringService>;
  deleteRecurringService: (id: string) => Promise<void>;
  toggleRecurring: (id: string) => Promise<void>;
  updateCleanerStatus: (cleanerId: string, status: Cleaner['status']) => void;
  updateCleaner: (cleanerId: string, updates: Partial<Cleaner>) => Promise<void>;
  deleteCleaner: (cleanerId: string) => Promise<void>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      cleaners: [],
      customers: [],
      recurringServices: [],
      performances: [],
      loading: false,
      error: null,

      fetchCleaners: async () => {
        set({ loading: true, error: null });
        try {
          const response = await getCleaners();
          set({ cleaners: response.data, loading: false });
        } catch (error) {
          set({ error: '获取保洁员列表失败', loading: false });
        }
      },

      fetchCustomers: async () => {
        set({ loading: true, error: null });
        try {
          const response = await getCustomers();
          set({ customers: response.data, loading: false });
        } catch (error) {
          set({ error: '获取客户列表失败', loading: false });
        }
      },

      fetchRecurringServices: async (customerId) => {
        set({ loading: true, error: null });
        try {
          const response = await getRecurringServices(customerId);
          const serviceData = response.data;
          set((state) => {
            const persistedMap = new Map(state.recurringServices.map((rs) => [rs.id, rs]));
            const merged = serviceData.map((srs) => {
              const prs = persistedMap.get(srs.id);
              if (prs) return prs;
              return srs;
            });
            const serviceIds = new Set(serviceData.map((rs) => rs.id));
            const localOnly = state.recurringServices.filter((rs) => !serviceIds.has(rs.id));
            return {
              recurringServices: [...localOnly, ...merged],
              loading: false,
            };
          });
        } catch (error) {
          set({ error: '获取定期服务失败', loading: false });
        }
      },

      fetchPerformances: async (month) => {
        set({ loading: true, error: null });
        try {
          const response = await getCleanerPerformances(month);
          set({ performances: response.data, loading: false });
        } catch (error) {
          set({ error: '获取绩效数据失败', loading: false });
        }
      },

      addRecurringService: async (data) => {
        set({ loading: true, error: null });
        try {
          const response = await createRecurringService(data);
          set((state) => ({
            recurringServices: [...state.recurringServices, response.data],
            loading: false,
          }));
          return response.data;
        } catch (error) {
          set({ error: '创建定期服务失败', loading: false });
          throw error;
        }
      },

      createRecurringService: async (data) => {
        return await get().addRecurringService(data);
      },

      deleteRecurringService: async (id) => {
        set({ loading: true, error: null });
        try {
          set((state) => ({
            recurringServices: state.recurringServices.filter((rs) => rs.id !== id),
            loading: false,
          }));
        } catch (error) {
          set({ error: '删除定期服务失败', loading: false });
        }
      },

      toggleRecurring: async (id) => {
        try {
          set((state) => ({
            recurringServices: state.recurringServices.map((rs) =>
              rs.id === id ? { ...rs, isActive: !rs.isActive } : rs
            ),
          }));
          await toggleRecurringService(id);
        } catch (error) {
          set({ error: '更新定期服务失败', loading: false });
        }
      },

      updateCleanerStatus: (cleanerId, status) => {
        set((state) => ({
          cleaners: state.cleaners.map((c) =>
            c.id === cleanerId ? { ...c, status } : c
          ),
        }));
      },

      updateCleaner: async (cleanerId, updates) => {
        set({ loading: true, error: null });
        try {
          set((state) => ({
            cleaners: state.cleaners.map((c) =>
              c.id === cleanerId ? { ...c, ...updates } : c
            ),
            loading: false,
          }));
        } catch (error) {
          set({ error: '更新保洁员信息失败', loading: false });
        }
      },

      deleteCleaner: async (cleanerId) => {
        set({ loading: true, error: null });
        try {
          set((state) => ({
            cleaners: state.cleaners.filter((c) => c.id !== cleanerId),
            loading: false,
          }));
        } catch (error) {
          set({ error: '删除保洁员失败', loading: false });
        }
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        cleaners: state.cleaners,
        customers: state.customers,
        recurringServices: state.recurringServices,
      }),
    }
  )
);
