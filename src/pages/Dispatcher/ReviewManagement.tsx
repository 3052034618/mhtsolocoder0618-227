import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  AlertTriangle,
  Star,
  User,
  Clock,
  CheckCircle,
  MessageSquare,
  Send,
  Filter,
  Phone,
  MapPin,
} from 'lucide-react';
import { useOrderStore } from '../../store/useOrderStore';
import { useUserStore } from '../../store/useUserStore';
import { useAuthStore } from '../../store/useAuthStore';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SERVICE_CONFIG } from '../../types';
import { formatDate, cn } from '../../utils';

interface HandleForm {
  note: string;
  action: 'refund' | 're_service' | 'compensate' | 'other';
}

export const ReviewManagement: React.FC = () => {
  const { orders, fetchOrders, handleBadReview, loading } = useOrderStore();
  const { customers, cleaners, fetchCustomers, fetchCleaners } = useUserStore();
  const { user } = useAuthStore();
  const [filter, setFilter] = useState<'all' | 'pending' | 'handled'>('pending');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<HandleForm>({
    defaultValues: {
      note: '',
      action: 'other',
    },
  });

  const selectedAction = watch('action');

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchCleaners();
  }, []);

  const reviewedOrders = orders.filter((o) => o.review);
  const badReviews = reviewedOrders.filter((o) => o.review!.rating <= 2);

  const filteredReviews = badReviews.filter((order) => {
    if (filter === 'pending') return !order.review!.handled;
    if (filter === 'handled') return order.review!.handled;
    return true;
  });

  const getCustomer = (id: string) => customers.find((c) => c.id === id);
  const getCleaner = (id?: string) => (id ? cleaners.find((c) => c.id === id) : undefined);

  const onSubmit = async (data: HandleForm) => {
    if (!selectedOrder || !user) return;
    try {
      await handleBadReview({
        reviewId: selectedOrder.review!.id,
        action: data.action,
        note: data.note,
        handlerId: user.id,
      });
      setSelectedOrder(null);
      reset();
    } catch (error) {
      console.error('Handle review failed:', error);
    }
  };

  const pendingCount = badReviews.filter((o) => !o.review!.handled).length;
  const handledCount = badReviews.filter((o) => o.review!.handled).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-800">差评管理</h2>
          <p className="text-neutral-500">处理客户差评，提升服务质量</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-danger-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-danger-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-danger-600">{badReviews.length}</p>
              <p className="text-sm text-neutral-500">总差评数</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-600">{pendingCount}</p>
              <p className="text-sm text-neutral-500">待处理</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-green-600">{handledCount}</p>
              <p className="text-sm text-neutral-500">已处理</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card p-2">
        <div className="flex gap-2">
          {[
            { value: 'pending', label: '待处理', count: pendingCount },
            { value: 'handled', label: '已处理', count: handledCount },
            { value: 'all', label: '全部', count: badReviews.length },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as any)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2',
                filter === f.value
                  ? 'bg-primary-500 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100'
              )}
            >
              {f.label}
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs',
                  filter === f.value
                    ? 'bg-white/20 text-white'
                    : 'bg-neutral-100 text-neutral-500'
                )}
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {filteredReviews.length > 0 ? (
            filteredReviews.map((order) => {
              const customer = getCustomer(order.customerId);
              const cleaner = getCleaner(order.cleanerId);
              const isSelected = selectedOrder?.id === order.id;

              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={cn(
                    'card cursor-pointer transition-all',
                    isSelected && 'ring-2 ring-primary-500'
                  )}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                        {customer?.avatar ? (
                          <img
                            src={customer.avatar}
                            alt={customer.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-primary-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-neutral-800">{customer?.name}</p>
                        <p className="text-sm text-neutral-500">{order.orderNo}</p>
                      </div>
                    </div>
                    {order.review!.handled ? (
                      <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm font-medium">
                        已处理
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-amber-100 text-amber-600 rounded-full text-sm font-medium">
                        待处理
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'w-4 h-4',
                          i < order.review!.rating
                            ? 'text-accent-500 fill-accent-500'
                            : 'text-neutral-200'
                        )}
                      />
                    ))}
                    <span className="ml-2 font-bold text-accent-600">
                      {order.review!.rating}.0
                    </span>
                  </div>

                  <p className="text-neutral-600 mb-4">{order.review!.content}</p>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-neutral-500">
                        {SERVICE_CONFIG[order.serviceType].name}
                      </span>
                      <span className="text-neutral-400">|</span>
                      <span className="text-neutral-500">{formatDate(order.review!.createdAt)}</span>
                    </div>
                    <span className="text-primary-600 font-medium">¥{order.price}</span>
                  </div>

                  {cleaner && (
                    <div className="mt-4 pt-4 border-t border-neutral-100">
                      <p className="text-sm text-neutral-500 mb-2">服务保洁员</p>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-accent-100 flex items-center justify-center overflow-hidden">
                          {cleaner.avatar ? (
                            <img
                              src={cleaner.avatar}
                              alt={cleaner.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-4 h-4 text-accent-600" />
                          )}
                        </div>
                        <span className="font-medium text-neutral-700">{cleaner.name}</span>
                        <div className="flex items-center gap-1 ml-2">
                          <Star className="w-3 h-3 text-accent-500 fill-accent-500" />
                          <span className="text-sm text-neutral-600">{cleaner.rating}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="card text-center py-16">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-neutral-500">没有{filter === 'pending' ? '待处理的' : filter === 'handled' ? '已处理的' : ''}差评</p>
            </div>
          )}
        </div>

        {selectedOrder && !selectedOrder.review?.handled && (
          <div className="card h-fit animate-fade-in">
            <h3 className="text-lg font-bold text-neutral-800 mb-6">处理差评</h3>

            <div className="bg-danger-50 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-danger-800 mb-1">差评预警</p>
                  <p className="text-sm text-danger-700">
                    客户对订单 {selectedOrder.orderNo} 给出了{' '}
                    <span className="font-bold">{selectedOrder.review?.rating}星</span> 差评，
                    请及时介入处理。
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">处理方式</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'refund', label: '退款', desc: '全额或部分退款' },
                    { value: 're_service', label: '重派服务', desc: '安排重新服务' },
                    { value: 'compensate', label: '补偿', desc: '优惠券/现金补偿' },
                    { value: 'other', label: '其他', desc: '其他处理方式' },
                  ].map((action) => (
                    <div
                      key={action.value}
                      onClick={() =>
                        register('action').onChange({ target: { value: action.value } })
                      }
                      className={cn(
                        'p-3 border-2 rounded-xl cursor-pointer transition-all',
                        selectedAction === action.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 hover:border-primary-200'
                      )}
                    >
                      <p className="font-medium text-neutral-800">{action.label}</p>
                      <p className="text-xs text-neutral-500">{action.desc}</p>
                    </div>
                  ))}
                </div>
                <input type="hidden" {...register('action')} />
              </div>

              <div>
                <label className="label">处理备注</label>
                <textarea
                  className="input-field min-h-[100px]"
                  placeholder="请记录处理内容和沟通结果..."
                  {...register('note', { required: '请填写处理备注' })}
                />
                {errors.note && (
                  <p className="mt-2 text-sm text-danger-600">{errors.note.message}</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 btn-secondary"
                >
                  取消
                </button>
                <button type="submit" disabled={loading} className="flex-1 btn-primary">
                  {loading ? '处理中...' : '确认处理'}
                </button>
              </div>
            </form>
          </div>
        )}

        {selectedOrder?.review?.handled && (
          <div className="card h-fit">
            <h3 className="text-lg font-bold text-neutral-800 mb-4">处理记录</h3>
            <div className="bg-green-50 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">已处理</span>
              </div>
            </div>
            <p className="text-neutral-600">{selectedOrder.review.handlerNote}</p>
          </div>
        )}
      </div>
    </div>
  );
};
