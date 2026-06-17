import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Sparkles, Droplets, Truck, MapPin, Clock, Maximize2, ChevronRight, Check } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useOrderStore } from '../../store/useOrderStore';
import { SERVICE_CONFIG } from '../../types';
import { calculatePrice, cn } from '../../utils';
import type { ServiceType, Customer } from '../../types';

interface OrderForm {
  serviceType: ServiceType;
  addressId: string;
  houseArea: number;
  scheduledDate: string;
  scheduledTime: string;
}

const ServiceIcon: React.FC<{ type: ServiceType; className?: string }> = ({ type, className }) => {
  if (type === 'daily') return <Sparkles className={className} />;
  if (type === 'deep') return <Droplets className={className} />;
  return <Truck className={className} />;
};

const serviceOptions: { type: ServiceType; color: string }[] = [
  { type: 'daily', color: 'primary' },
  { type: 'deep', color: 'blue' },
  { type: 'moving', color: 'accent' },
];

const timeSlots = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
];

export const CreateOrder: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const customer = user as Customer | null;
  const { createOrder, loading } = useOrderStore();
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);

  const defaultServiceType = (location.state as { serviceType?: ServiceType })?.serviceType || 'daily';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm<OrderForm>({
    defaultValues: {
      serviceType: defaultServiceType,
      addressId: customer?.addresses?.[0]?.id || '',
      houseArea: customer?.addresses?.[0]?.houseArea || 80,
      scheduledDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      scheduledTime: '14:00',
    },
  });

  const selectedService = watch('serviceType');
  const selectedAddressId = watch('addressId');
  const selectedArea = watch('houseArea');
  const estimatedPrice = calculatePrice(selectedService, selectedArea);

  const selectedAddress = customer?.addresses?.find((a) => a.id === selectedAddressId);

  const onSubmit = async (data: OrderForm) => {
    if (!user) return;

    try {
      const scheduledTime = `${data.scheduledDate}T${data.scheduledTime}:00`;
      const order = await createOrder({
        serviceType: data.serviceType,
        addressId: data.addressId,
        houseArea: data.houseArea,
        scheduledTime,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate(`/customer/order/${order.id}`);
      }, 2000);
    } catch (error) {
      console.error('Create order failed:', error);
    }
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="card text-center py-16">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-800 mb-2">下单成功！</h2>
          <p className="text-neutral-500 mb-6">调度员将尽快为您安排保洁员，请耐心等待</p>
          <div className="animate-pulse">正在跳转到订单详情...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-center gap-4 mb-4">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300',
                  s <= step
                    ? 'bg-primary-500 text-white'
                    : 'bg-neutral-100 text-neutral-400'
                )}
              >
                {s < step ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={cn(
                    'w-24 h-1 rounded-full transition-all duration-300',
                    s < step ? 'bg-primary-500' : 'bg-neutral-200'
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-center gap-12 text-sm text-neutral-500">
          <span className={step >= 1 ? 'text-primary-600 font-medium' : ''}>选择服务</span>
          <span className={step >= 2 ? 'text-primary-600 font-medium' : ''}>填写信息</span>
          <span className={step >= 3 ? 'text-primary-600 font-medium' : ''}>确认预约</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {step === 1 && (
          <div className="card animate-fade-in">
            <h3 className="text-lg font-bold text-neutral-800 mb-6">选择服务类型</h3>
            <div className="space-y-4">
              {serviceOptions.map((option) => {
                const config = SERVICE_CONFIG[option.type];
                const isSelected = selectedService === option.type;
                const colorClasses = {
                  primary: isSelected
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-neutral-200 hover:border-primary-200',
                  blue: isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-neutral-200 hover:border-blue-200',
                  accent: isSelected
                    ? 'border-accent-500 bg-accent-50'
                    : 'border-neutral-200 hover:border-accent-200',
                };
                const iconColors = {
                  primary: 'bg-primary-100 text-primary-600',
                  blue: 'bg-blue-100 text-blue-600',
                  accent: 'bg-accent-100 text-accent-600',
                };

                return (
                  <div
                    key={option.type}
                    onClick={() => setValue('serviceType', option.type)}
                    className={cn(
                      'p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 flex items-center gap-4',
                      colorClasses[option.color]
                    )}
                  >
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center',
                        iconColors[option.color]
                      )}
                    >
                      <ServiceIcon type={option.type} className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-neutral-800">{config.name}</h4>
                      <p className="text-sm text-neutral-500">
                        {config.basePrice}
                        {config.unit}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="card animate-fade-in">
            <h3 className="text-lg font-bold text-neutral-800 mb-6">填写服务信息</h3>
            <div className="space-y-6">
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
                      {addr.detail}（{addr.houseArea}㎡）
                    </option>
                  ))}
                </select>
                {errors.addressId && (
                  <p className="mt-2 text-sm text-danger-600">{errors.addressId.message}</p>
                )}
              </div>

              <div>
                <label className="label">
                  <Maximize2 className="w-4 h-4 inline mr-2" />
                  房屋面积（㎡）
                </label>
                <input
                  type="range"
                  min="30"
                  max="300"
                  step="10"
                  className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                  {...register('houseArea', {
                    required: '请输入房屋面积',
                    min: { value: 30, message: '最小30㎡' },
                    max: { value: 300, message: '最大300㎡' },
                  })}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-neutral-500">30㎡</span>
                  <span className="text-2xl font-bold text-primary-600">{selectedArea}㎡</span>
                  <span className="text-sm text-neutral-500">300㎡</span>
                </div>
              </div>

              <div>
                <label className="label">
                  <Clock className="w-4 h-4 inline mr-2" />
                  预约日期
                </label>
                <input
                  type="date"
                  className="input-field"
                  min={new Date().toISOString().slice(0, 10)}
                  {...register('scheduledDate', { required: '请选择预约日期' })}
                />
                {errors.scheduledDate && (
                  <p className="mt-2 text-sm text-danger-600">{errors.scheduledDate.message}</p>
                )}
              </div>

              <div>
                <label className="label">选择时间段</label>
                <div className="grid grid-cols-5 gap-2">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setValue('scheduledTime', time)}
                      className={cn(
                        'py-3 rounded-xl text-sm font-medium transition-all duration-200',
                        watch('scheduledTime') === time
                          ? 'bg-primary-500 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-primary-50 hover:text-primary-600'
                      )}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="card animate-fade-in">
            <h3 className="text-lg font-bold text-neutral-800 mb-6">确认预约信息</h3>
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                <span className="text-neutral-500">服务类型</span>
                <span className="font-medium text-neutral-800">
                  {SERVICE_CONFIG[selectedService].name}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                <span className="text-neutral-500">服务地址</span>
                <span className="font-medium text-neutral-800 text-right max-w-[60%]">
                  {selectedAddress?.detail}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                <span className="text-neutral-500">房屋面积</span>
                <span className="font-medium text-neutral-800">{selectedArea}㎡</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                <span className="text-neutral-500">预约时间</span>
                <span className="font-medium text-neutral-800">
                  {watch('scheduledDate')} {watch('scheduledTime')}
                </span>
              </div>
              <div className="flex items-center justify-between py-4 bg-primary-50 rounded-xl px-4 -mx-4">
                <span className="text-neutral-700 font-medium">预估费用</span>
                <span className="text-2xl font-bold text-primary-600">¥{estimatedPrice}</span>
              </div>
            </div>

            <div className="bg-amber-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-amber-700">
                💡 温馨提示：实际费用根据服务时长和清洁难度可能有所调整，最终费用以保洁员实际服务为准。
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-4">
          {step > 1 && (
            <button type="button" onClick={prevStep} className="flex-1 btn-secondary">
              上一步
            </button>
          )}
          {step < 3 ? (
            <button type="button" onClick={nextStep} className="flex-1 btn-primary flex items-center justify-center gap-2">
              下一步
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button type="submit" disabled={loading} className="flex-1 btn-primary">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                '确认下单'
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
