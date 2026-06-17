import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Order, CreateOrderRequest, DispatchOrderRequest, SubmitReviewRequest, OrderPhoto, OrderStatus, RecurringService, ReviewFollowUp, ReviewFollowUpAction } from '../types';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  dispatchOrder,
  acceptOrder,
  checkInOrder,
  completeOrder,
  submitReview,
  uploadPhoto,
  payOrder,
  createRecurringOrder,
  cancelRecurringOrders,
  handleBadReview as handleBadReviewApi,
  generateNextRecurringOrder as generateNextRecurringOrderApi,
  syncAllRecurringOrders as syncAllRecurringOrdersApi,
  submitChangeRequest as submitChangeRequestApi,
  processChangeRequest as processChangeRequestApi,
  addReviewFollowUp as addReviewFollowUpApi,
} from '../services/orderService';

interface HandleBadReviewRequest {
  reviewId: string;
  action: 'refund' | 're_service' | 'compensate' | 'other';
  note: string;
  handlerId: string;
}

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  loading: boolean;
  error: string | null;
  fetchOrders: (filters?: Record<string, unknown>) => Promise<void>;
  fetchOrderById: (id: string) => Promise<Order | null>;
  createOrder: (data: CreateOrderRequest) => Promise<Order>;
  updateStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  dispatch: (data: DispatchOrderRequest) => Promise<void>;
  assignOrder: (data: DispatchOrderRequest) => Promise<void>;
  accept: (orderId: string) => Promise<void>;
  acceptOrder: (orderId: string) => Promise<void>;
  checkIn: (orderId: string) => Promise<void>;
  startService: (orderId: string) => Promise<void>;
  complete: (orderId: string) => Promise<void>;
  completeService: (orderId: string) => Promise<void>;
  review: (data: SubmitReviewRequest) => Promise<void>;
  submitReview: (data: SubmitReviewRequest) => Promise<void>;
  uploadPhoto: (orderId: string, type: 'before' | 'after', url: string) => Promise<OrderPhoto>;
  pay: (orderId: string) => Promise<void>;
  payOrder: (orderId: string) => Promise<void>;
  handleBadReview: (data: HandleBadReviewRequest) => Promise<void>;
  createOrderFromRecurring: (recurringService: RecurringService) => Promise<Order | null>;
  cancelOrdersByRecurringId: (recurringServiceId: string) => Promise<void>;
  generateNextRecurringOrder: (recurringServiceId: string) => Promise<Order | null>;
  syncAllRecurringOrders: () => Promise<Order[]>;
  submitChangeRequest: (orderId: string, data: { type: 'reschedule' | 'cancel'; newScheduledTime?: string; reason: string }) => Promise<void>;
  processChangeRequest: (orderId: string, approve: boolean, processorNote?: string) => Promise<void>;
  addReviewFollowUp: (reviewId: string, data: { action: ReviewFollowUpAction; content: string; operatorId: string; operatorName: string }) => Promise<ReviewFollowUp | null>;
  clearCurrentOrder: () => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      currentOrder: null,
      loading: false,
      error: null,

      fetchOrders: async (filters) => {
        set({ loading: true, error: null });
        try {
          const response = await getOrders(filters);
          const serviceOrders = response.data;
          set((state) => {
            const persistedMap = new Map(state.orders.map((o) => [o.id, o]));
            const mergedOrders = serviceOrders.map((so) => {
              const po = persistedMap.get(so.id);
              if (po) {
                const poTime = new Date(po.updatedAt).getTime();
                const soTime = new Date(so.updatedAt).getTime();
                if (poTime >= soTime) return po;
              }
              return so;
            });
            const serviceIds = new Set(serviceOrders.map((o) => o.id));
            const localOnly = state.orders.filter((o) => !serviceIds.has(o.id));
            return {
              orders: [...localOnly, ...mergedOrders],
              loading: false,
            };
          });
          try {
            await get().syncAllRecurringOrders();
          } catch (e) {
            // ignore sync error
          }
        } catch (error) {
          set({ error: '获取订单列表失败', loading: false });
        }
      },

      fetchOrderById: async (id) => {
        set({ loading: true, error: null });
        try {
          const response = await getOrderById(id);
          set({ currentOrder: response.data, loading: false });
          return response.data;
        } catch (error) {
          set({ error: '获取订单详情失败', loading: false });
          return null;
        }
      },

      createOrder: async (data) => {
        set({ loading: true, error: null });
        try {
          const response = await createOrder(data);
          set((state) => ({
            orders: [response.data, ...state.orders],
            loading: false,
          }));
          return response.data;
        } catch (error) {
          set({ error: '创建订单失败', loading: false });
          throw error;
        }
      },

      updateStatus: async (orderId, status) => {
        set({ loading: true, error: null });
        try {
          await updateOrderStatus(orderId, status);
          set((state) => ({
            orders: state.orders.map((o) =>
              o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o
            ),
            currentOrder:
              state.currentOrder?.id === orderId
                ? { ...state.currentOrder, status, updatedAt: new Date().toISOString() }
                : state.currentOrder,
            loading: false,
          }));
        } catch (error) {
          set({ error: '更新订单状态失败', loading: false });
        }
      },

      dispatch: async (data) => {
        set({ loading: true, error: null });
        try {
          const response = await dispatchOrder(data);
          set((state) => ({
            orders: state.orders.map((o) =>
              o.id === data.orderId ? response.data : o
            ),
            loading: false,
          }));
        } catch (error) {
          set({ error: '派单失败', loading: false });
        }
      },

      assignOrder: async (data) => {
        await get().dispatch(data);
      },

      accept: async (orderId) => {
        set({ loading: true, error: null });
        try {
          const response = await acceptOrder(orderId);
          set((state) => ({
            orders: state.orders.map((o) =>
              o.id === orderId ? response.data : o
            ),
            currentOrder:
              state.currentOrder?.id === orderId ? response.data : state.currentOrder,
            loading: false,
          }));
        } catch (error) {
          set({ error: '接单失败', loading: false });
        }
      },

      acceptOrder: async (orderId) => {
        await get().accept(orderId);
      },

      checkIn: async (orderId) => {
        set({ loading: true, error: null });
        try {
          const response = await checkInOrder(orderId);
          set((state) => ({
            orders: state.orders.map((o) =>
              o.id === orderId ? response.data : o
            ),
            currentOrder:
              state.currentOrder?.id === orderId ? response.data : state.currentOrder,
            loading: false,
          }));
        } catch (error) {
          set({ error: '签到失败', loading: false });
        }
      },

      startService: async (orderId) => {
        await get().updateStatus(orderId, 'in_progress');
      },

      complete: async (orderId) => {
        set({ loading: true, error: null });
        try {
          const response = await completeOrder(orderId);
          const completedOrder = response.data;
          set((state) => ({
            orders: state.orders.map((o) =>
              o.id === orderId ? completedOrder : o
            ),
            currentOrder:
              state.currentOrder?.id === orderId ? completedOrder : state.currentOrder,
            loading: false,
          }));
          if (completedOrder.recurringServiceId) {
            setTimeout(() => {
              get().generateNextRecurringOrder(completedOrder.recurringServiceId!);
            }, 500);
          }
        } catch (error) {
          set({ error: '完成订单失败', loading: false });
        }
      },

      completeService: async (orderId) => {
        await get().complete(orderId);
      },

      review: async (data) => {
        set({ loading: true, error: null });
        try {
          const response = await submitReview(data);
          set((state) => ({
            orders: state.orders.map((o) =>
              o.id === data.orderId ? response.data : o
            ),
            currentOrder:
              state.currentOrder?.id === data.orderId
                ? response.data
                : state.currentOrder,
            loading: false,
          }));
        } catch (error) {
          set({ error: '提交评价失败', loading: false });
        }
      },

      submitReview: async (data) => {
        await get().review(data);
      },

      uploadPhoto: async (orderId, type, url) => {
        set({ loading: true, error: null });
        try {
          const response = await uploadPhoto(orderId, type, url);
          set((state) => ({
            orders: state.orders.map((o) =>
              o.id === orderId
                ? { ...o, photos: [...o.photos, response.data] }
                : o
            ),
            currentOrder:
              state.currentOrder?.id === orderId
                ? {
                    ...state.currentOrder,
                    photos: [...state.currentOrder.photos, response.data],
                  }
                : state.currentOrder,
            loading: false,
          }));
          return response.data;
        } catch (error) {
          set({ error: '上传照片失败', loading: false });
          throw error;
        }
      },

      pay: async (orderId) => {
        set({ loading: true, error: null });
        try {
          const response = await payOrder(orderId);
          set((state) => ({
            orders: state.orders.map((o) =>
              o.id === orderId ? response.data : o
            ),
            currentOrder:
              state.currentOrder?.id === orderId
                ? response.data
                : state.currentOrder,
            loading: false,
          }));
        } catch (error) {
          set({ error: '支付失败', loading: false });
        }
      },

      payOrder: async (orderId) => {
        await get().pay(orderId);
      },

      handleBadReview: async (data) => {
        set({ loading: true, error: null });
        try {
          set((state) => ({
            orders: state.orders.map((o) => {
              if (o.review?.id === data.reviewId) {
                return {
                  ...o,
                  review: {
                    ...o.review,
                    handled: true,
                    handlerNote: data.note,
                    handlerId: data.handlerId,
                    action: data.action,
                  },
                };
              }
              return o;
            }),
            currentOrder:
              state.currentOrder?.review?.id === data.reviewId
                ? {
                    ...state.currentOrder,
                    review: {
                      ...state.currentOrder.review,
                      handled: true,
                      handlerNote: data.note,
                      handlerId: data.handlerId,
                      action: data.action,
                    },
                  }
                : state.currentOrder,
            loading: false,
          }));

          try {
            await handleBadReviewApi(data.reviewId, data.note);
          } catch (e) {
            // ignore service sync error since store already updated
          }
        } catch (error) {
          set({ error: '处理差评失败', loading: false });
        }
      },

      createOrderFromRecurring: async (recurringService) => {
        set({ loading: true, error: null });
        try {
          const response = await createRecurringOrder(recurringService);
          set((state) => ({
            orders: [response.data, ...state.orders],
            loading: false,
          }));
          return response.data;
        } catch (error) {
          set({ error: '创建续单失败', loading: false });
          return null;
        }
      },

      cancelOrdersByRecurringId: async (recurringServiceId) => {
        set({ loading: true, error: null });
        try {
          await cancelRecurringOrders(recurringServiceId);
          set((state) => ({
            orders: state.orders.map((o) => {
              if (o.recurringServiceId === recurringServiceId && o.status === 'pending') {
                return { ...o, status: 'cancelled' as const, updatedAt: new Date().toISOString() };
              }
              return o;
            }),
            loading: false,
          }));
        } catch (error) {
          set({ error: '取消关联订单失败', loading: false });
        }
      },

      submitChangeRequest: async (orderId, data) => {
        set({ loading: true, error: null });
        try {
          const response = await submitChangeRequestApi(orderId, data);
          set((state) => ({
            orders: state.orders.map((o) =>
              o.id === orderId ? response.data : o
            ),
            currentOrder:
              state.currentOrder?.id === orderId ? response.data : state.currentOrder,
            loading: false,
          }));
        } catch (error) {
          set({ error: '提交变更申请失败', loading: false });
        }
      },

      processChangeRequest: async (orderId, approve, processorNote) => {
        set({ loading: true, error: null });
        try {
          const response = await processChangeRequestApi(orderId, approve, processorNote);
          set((state) => ({
            orders: state.orders.map((o) =>
              o.id === orderId ? response.data : o
            ),
            loading: false,
          }));
        } catch (error) {
          set({ error: '处理变更失败', loading: false });
        }
      },

      generateNextRecurringOrder: async (recurringServiceId) => {
        try {
          const response = await generateNextRecurringOrderApi(recurringServiceId);
          if (response.data) {
            set((state) => ({
              orders: [response.data!, ...state.orders],
            }));
          }
          return response.data;
        } catch (error) {
          set({ error: '生成续单失败' });
          return null;
        }
      },

      syncAllRecurringOrders: async () => {
        try {
          const response = await syncAllRecurringOrdersApi();
          if (response.data && response.data.length > 0) {
            set((state) => {
              const existingIds = new Set(state.orders.map((o) => o.id));
              const newOrders = response.data!.filter((o) => !existingIds.has(o.id));
              return { orders: [...newOrders, ...state.orders] };
            });
          }
          return response.data || [];
        } catch (error) {
          set({ error: '同步续单失败' });
          return [];
        }
      },

      addReviewFollowUp: async (reviewId, data) => {
        try {
          const response = await addReviewFollowUpApi(reviewId, data);
          set((state) => ({
            orders: state.orders.map((o) => {
              if (o.review?.id === reviewId) {
                const existing = o.review!.followUps || [];
                return {
                  ...o,
                  review: {
                    ...o.review!,
                    followUps: [...existing, response.data],
                  },
                };
              }
              return o;
            }),
            currentOrder:
              state.currentOrder?.review?.id === reviewId
                ? {
                    ...state.currentOrder!,
                    review: {
                      ...state.currentOrder!.review!,
                      followUps: [...(state.currentOrder!.review!.followUps || []), response.data],
                    },
                  }
                : state.currentOrder,
          }));
          return response.data;
        } catch (error) {
          set({ error: '添加跟进记录失败' });
          return null;
        }
      },

      clearCurrentOrder: () => {
        set({ currentOrder: null });
      },
    }),
    {
      name: 'order-storage',
      partialize: (state) => ({ orders: state.orders }),
    }
  )
);
