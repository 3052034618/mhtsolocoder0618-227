import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  RefreshCw,
  Calendar,
  MapPin,
  Clock,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Droplets,
  Truck,
  ChevronRight,
  Settings,
  XCircle,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useUserStore } from '../../store/useUserStore';
import { useOrderStore } from '../../store/useOrderStore';
import { SERVICE_CONFIG, RECURRING_FREQUENCY_CONFIG } from '../../types';
import { formatDate, cn, getNextOrderDate } from '../../utils';
import type { ServiceType, RecurringFrequency, Customer } from '../../types';

interface RecurringForm {
  serviceType: ServiceType;
  addressId: string;
  houseArea: number;
  frequency: RecurringFrequency;
  preferredDay: number;
  preferredTime: string;
  startDate: string;
}

const ServiceIcon: React.FC<{ type: ServiceType; className?: string }> = ({ type, className }) => {
  if (type === 'daily') return <Sparkles className={className} />;
  if (type === 'deep') return <Droplets className={className} />;
  return <Truck className={className} />;
};

const frequencyOptions: { value: RecurringFrequency; label: string; desc: string }[] = [
  { value: 'weekly', label: '每周', desc: '每周服务一次' },
  { value: 'biweekly', label: '每两周', desc: '每两周服务一次' },
  { value: 'monthly', label: '每月', desc: '每月服务一次' },
];

const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const timeSlots = ['08:00', '10:00', '13:00', '15:00', '17:00'];

export const RecurringService: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const customer = user as Customer | null;
  const {
    recurringServices,
    fetchRecurringServices,
    createRecurringService,
    toggleRecurring,
    loading: userLoading,
  } = useUserStore();
  const {
    orders,
    fetchOrders,
    createOrderFromRecurring,
    cancelOrdersByRecurringId,
  } = useOrderStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<RecurringForm>({
    defaultValues: {
      serviceType: 'daily',
      addressId: customer?.addresses?.[0]?.id || '',
      houseArea: customer?.addresses?.[0]?.houseArea || 80,
      frequency: 'weekly',
      preferredDay: 1,
      preferredTime: '10:00',
      startDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    },
  });

  useEffect(() => {
    if (user) {
      fetchRecurringServices(user.id);
      fetchOrders({ customerId: user.id });
    }
  }, [user?.id]);

  const myServices = recurringServices.filter(
    (s) => s.customerId === user?.id
  );

  const getRecurringOrders = (recurringId: string) => {
    return orders.filter(
      (o) => o.recurringServiceId === recurringId && o.status !== 'cancelled'
    );
  };

  const onSubmit = async (data: RecurringForm) => {
    if (!user) return;
    try {
      const newService = await createRecurringService({
        customerId: user.id,
        serviceType: data.serviceType,
        addressId: data.addressId,
        houseArea: data.houseArea,
        frequency: data.frequency,
        preferredDay: data.preferredDay,
        preferredTime: data.preferredTime,
        startDate: data.startDate,
      });

      if (newService) {
        await createOrderFromRecurring(newService);
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setShowCreateForm(false);
        reset();
        fetchOrders({ customerId: user.id });
      }, 2000);
    } catch (error) {
      console.error('Create recurring service failed:', error);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('确定要取消这个定期服务吗？已生成的未开始订单也将被取消。')) return;
    setCancellingId(id);
    try {
      await cancelOrdersByRecurringId(id);
      await toggleRecurring(id);
      if (user) {
        fetchRecurringServices(user.id);
        fetchOrders({ customerId: user.id });
      }
    } catch (error) {
      console.error('Cancel recurring service failed:', error);
    }
    setCancellingId(null);
  };

  const getNextOrderDateForService = (service: typeof myServices[0]) => {
    const recurringOrders = getRecurringOrders(service.id);
    const pendingOrders = recurringOrders.filter(
      (o) => o.status === 'pending' || o.status === 'assigned' || o.status === 'accepted'
    );
    if (pendingOrders.length > 0) {
      return formatDate(pendingOrders[0].scheduledTime, 'yyyy-MM-dd HH:mm');
    }
    return formatDate(service.nextOrderDate, 'yyyy-MM-dd');
  };

  const getCompletedCount = (serviceId: string) => {
    return orders.filter(
      (o) =>
        o.recurringServiceId === serviceId &&
        ['completed', 'paid', 'reviewed'].includes(o.status)
    ).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-800">定期服务</h2>
          <p className="text-neutral-500">设置固定上门频次，系统自动续单免去每次预约</p>
        </div>
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            新建定期服务
          </button>
        )}
      </div>

      {success && (
        <div className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6" />
            <div>
              <h3 className="font-bold">定期服务创建成功！</h3>
              <p className="text-primary-100">系统已自动为您生成下一次预约订单</p>
            </div>
          </div>
        </div>
      )}

      {showCreateForm && (
        <div className="card animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-neutral-800">新建定期服务</h3>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-neutral-400 hover:text-neutral-600"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="label">服务类型</label>
              <div className="grid grid-cols-3 gap-4">
                {(['daily', 'deep', 'moving'] as ServiceType[]).map((type) => {
                  const config = SERVICE_CONFIG[type];
                  const isSelected = watch('serviceType') === type;
                  return (
                    <div
                      key={type}
                      onClick={() => setValue('serviceType', type)}
                      className={cn(
                        'p-4 border-2 rounded-xl cursor-pointer transition-all text-center',
                        isSelected
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 hover:border-primary-200'
                      )}
                    >
                      <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center mx-auto mb-2">
                        <ServiceIcon type={type} className="w-6 h-6 text-primary-600" />
                      </div>
                      <h4 className="font-semibold text-neutral-800">{config.name}</h4>
                      <p className="text-sm text-neutral-500">{config.basePrice}{config.unit}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="label">服务频次</label>
              <div className="grid grid-cols-3 gap-4">
                {frequencyOptions.map((option) => {
                  const isSelected = watch('frequency') === option.value;
                  return (
                    <div
                      key={option.value}
                      onClick={() => setValue('frequency', option.value)}
                      className={cn(
                        'p-4 border-2 rounded-xl cursor-pointer transition-all',
                        isSelected
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 hover:border-primary-200'
                      )}
                    >
                      <RefreshCw
                        className={cn(
                          'w-6 h-6 mb-2',
                          isSelected ? 'text-primary-600' : 'text-neutral-400'
                        )}
                      />
                      <h4 className="font-semibold text-neutral-800">{option.label}</h4>
                      <p className="text-sm text-neutral-500">{option.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  服务地址
                </label>
                <select
                  className="input-field"
                  {...register('addressId', { required: '请选择服务地址' })}
                >
                  {customer?.addresses?.map((addr) => (
                    <option key={addr.id} value={addr.id}>
                      {addr.detail}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  开始日期
                </label>
                <input
                  type="date"
                  className="input-field"
                  min={new Date().toISOString().slice(0, 10)}
                  {...register('startDate', { required: '请选择开始日期' })}
                />
              </div>
            </div>

            <div>
              <label className="label">偏好星期</label>
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day, index) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setValue('preferredDay', index + 1)}
                    className={cn(
                      'py-3 rounded-xl text-sm font-medium transition-all',
                      watch('preferredDay') === index + 1
                        ? 'bg-primary-500 text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-primary-50'
                    )}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">偏好时间</label>
              <div className="grid grid-cols-5 gap-2">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setValue('preferredTime', time)}
                    className={cn(
                      'py-3 rounded-xl text-sm font-medium transition-all',
                      watch('preferredTime') === time
                        ? 'bg-primary-500 text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-primary-50'
                    )}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <Settings className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">自动续单说明</p>
                  <p>
                    系统将根据您设置的频次，在服务前自动生成订单并安排保洁员。
                    您可以随时在订单列表中查看或取消自动生成的订单。
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="flex-1 btn-secondary"
              >
                取消
              </button>
              <button type="submit" disabled={userLoading} className="flex-1 btn-primary">
                {userLoading ? '创建中...' : '确认创建'}
              </button>
            </div>
          </form>
        </div>
      )}

      {myServices.length > 0 ? (
        <div className="space-y-4">
          {myServices.map((service) => {
            const config = SERVICE_CONFIG[service.serviceType];
            const address = customer?.addresses?.find(
              (a) => a.id === (service.addressId || service.address?.id)
            );
            const freqLabel = frequencyOptions.find(
              (f) => f.value === service.frequency
            )?.label;
            const completedCount = getCompletedCount(service.id);
            const recurringOrders = getRecurringOrders(service.id);
            const pendingOrders = recurringOrders.filter(
              (o) => o.status === 'pending' || o.status === 'assigned' || o.status === 'accepted'
            );
            const isCancelling = cancellingId === service.id;

            return (
              <div key={service.id} className={cn(
                'card transition-all',
                !service.isActive && 'opacity-60'
              )}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center">
                      <ServiceIcon
                        type={service.serviceType}
                        className="w-7 h-7 text-primary-600"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-neutral-800">
                          {config.name}
                        </h3>
                        <span className="px-3 py-1 bg-primary-100 text-primary-600 rounded-full text-sm font-medium">
                          {freqLabel}
                        </span>
                        {service.isActive ? (
                          <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm font-medium flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            生效中
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-neutral-100 text-neutral-600 rounded-full text-sm font-medium flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            已取消
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-neutral-500 mt-2">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {address?.detail || service.address?.detail}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {service.preferredDay
                            ? weekDays[service.preferredDay - 1]
                            : ''}{' '}
                          {service.preferredTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-3">
                        {service.isActive && (
                          <div className="text-sm">
                            <span className="text-neutral-500">下次服务：</span>
                            <span className="font-medium text-neutral-800">
                              {getNextOrderDateForService(service)}
                            </span>
                          </div>
                        )}
                        <div className="text-sm">
                          <span className="text-neutral-500">已服务：</span>
                          <span className="font-medium text-primary-600">
                            {completedCount}次
                          </span>
                        </div>
                      </div>

                      {pendingOrders.length > 0 && service.isActive && (
                        <div className="mt-3 pt-3 border-t border-neutral-100">
                          <p className="text-xs text-neutral-400 mb-2">待执行预约</p>
                          <div className="flex flex-wrap gap-2">
                            {pendingOrders.map((o) => (
                              <span
                                key={o.id}
                                onClick={() =>
                                  navigate(`/customer/orders/${o.id}`)
                                }
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-50 text-primary-600 rounded-lg text-xs font-medium cursor-pointer hover:bg-primary-100 transition-colors"
                              >
                                <Calendar className="w-3 h-3" />
                                {formatDate(o.scheduledTime, 'MM-dd HH:mm')}
                                <ChevronRight className="w-3 h-3" />
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {service.isActive && (
                      <button
                        onClick={() => handleCancel(service.id)}
                        disabled={isCancelling}
                        className={cn(
                          'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                          isCancelling
                            ? 'bg-neutral-100 text-neutral-400'
                            : 'bg-danger-50 text-danger-600 hover:bg-danger-100'
                        )}
                      >
                        {isCancelling ? '取消中...' : '取消定期服务'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        !showCreateForm && (
          <div className="card text-center py-16">
            <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-10 h-10 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-800 mb-2">
              暂无定期服务
            </h3>
            <p className="text-neutral-500 mb-6">
              设置定期服务，系统将自动为您续单，免去每次预约的麻烦
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary flex items-center gap-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              新建定期服务
            </button>
          </div>
        )
      )}
    </div>
  );
};
