import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  MapPin,
  Clock,
  Maximize2,
  Phone,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Camera,
  Star,
  ChevronLeft,
  User,
  Calendar,
  X,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useOrderStore } from '../../store/useOrderStore';
import { useUserStore } from '../../store/useUserStore';
import { OrderTimeline } from '../../components/ui/OrderTimeline';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PhotoCompare } from '../../components/ui/PhotoCompare';
import { StarRating } from '../../components/ui/StarRating';
import { SERVICE_CONFIG } from '../../types';
import { formatDate, cn } from '../../utils';

interface ReviewForm {
  rating: number;
  content: string;
}

const TIME_SLOTS = ['08:00', '10:00', '13:00', '15:00', '17:00'];

export const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { orders, fetchOrders, payOrder, submitReview, submitChangeRequest, loading } = useOrderStore();
  const { cleaners, fetchCleaners } = useUserStore();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState(TIME_SLOTS[0]);
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [countdown, setCountdown] = useState('');

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ReviewForm>({
    defaultValues: {
      rating: 5,
      content: '',
    },
  });

  const order = orders.find((o) => o.id === id);
  const cleaner = order?.cleanerId ? cleaners.find((c) => c.id === order.cleanerId) : undefined;

  useEffect(() => {
    fetchOrders();
    fetchCleaners();
  }, []);

  useEffect(() => {
    if (order?.status !== 'accepted' || !order.scheduledTime) {
      setCountdown('');
      return;
    }
    const updateCountdown = () => {
      const target = new Date(order.scheduledTime).getTime();
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        setCountdown('');
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      let str = '';
      if (d > 0) str += `${d}天`;
      if (h > 0 || d > 0) str += `${h}小时`;
      str += `${m}分${s}秒`;
      setCountdown(str);
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [order?.status, order?.scheduledTime]);

  const canChange = order && ['pending', 'assigned', 'accepted'].includes(order.status) && !order.changeRequest;

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const handlePay = async () => {
    if (!order) return;
    try {
      await payOrder(order.id);
      setPaySuccess(true);
      setTimeout(() => {
        setPaySuccess(false);
        setShowReviewForm(true);
      }, 2000);
    } catch (error) {
      console.error('Pay failed:', error);
    }
  };

  const onSubmitReview = async (data: ReviewForm) => {
    if (!order) return;
    try {
      await submitReview({
        orderId: order.id,
        rating: data.rating,
        content: data.content,
      });
      setReviewSuccess(true);
      setTimeout(() => {
        setReviewSuccess(false);
        setShowReviewForm(false);
      }, 2000);
    } catch (error) {
      console.error('Submit review failed:', error);
    }
  };

  const handleSubmitReschedule = async () => {
    if (!order || !rescheduleDate || !rescheduleTime || !rescheduleReason.trim()) return;
    try {
      await submitChangeRequest(order.id, {
        type: 'reschedule',
        newScheduledTime: `${rescheduleDate}T${rescheduleTime}:00`,
        reason: rescheduleReason.trim(),
      });
      setShowRescheduleModal(false);
      setRescheduleDate('');
      setRescheduleTime(TIME_SLOTS[0]);
      setRescheduleReason('');
    } catch (error) {
      console.error('Submit reschedule failed:', error);
    }
  };

  const handleSubmitCancel = async () => {
    if (!order || !cancelReason.trim()) return;
    try {
      await submitChangeRequest(order.id, {
        type: 'cancel',
        reason: cancelReason.trim(),
      });
      setShowCancelModal(false);
      setCancelReason('');
    } catch (error) {
      console.error('Submit cancel failed:', error);
    }
  };

  const handleContact = () => {
    const phone = cleaner?.phone || '13800138000';
    alert(`正在拨打保洁员电话：${phone}`);
  };

  const handleMessage = () => {
    alert(`正在打开与${cleaner?.name || '保洁员'}的聊天窗口`);
  };

  const getEstimatedArrival = () => {
    if (!order?.scheduledTime) return '准时上门';
    const scheduled = new Date(order.scheduledTime);
    const arrival = new Date(scheduled.getTime() - 10 * 60000);
    const hours = arrival.getHours().toString().padStart(2, '0');
    const mins = arrival.getMinutes().toString().padStart(2, '0');
    return `预计 ${hours}:${mins} 到达`;
  };

  const getServiceProgress = () => {
    if (!order?.actualCheckInTime) return 0;
    const checkIn = new Date(order.actualCheckInTime).getTime();
    const now = Date.now();
    const elapsed = now - checkIn;
    const estimatedTotal = 2.5 * 3600000;
    return Math.min(Math.round((elapsed / estimatedTotal) * 100), 95);
  };

  const statusBanner = useMemo(() => {
    if (!order) return null;
    switch (order.status) {
      case 'pending':
      case 'assigned':
        return {
          bg: 'bg-blue-500',
          text: 'text-white',
          title: '等待保洁员接单',
          subtitle: '我们正在为您匹配合适的保洁员',
          progress: null,
        };
      case 'accepted':
        return {
          bg: 'bg-green-500',
          text: 'text-white',
          title: '保洁员已接单，将准时上门',
          subtitle: countdown ? `距离预约时间还有：${countdown}` : '请保持电话畅通',
          progress: null,
        };
      case 'checked_in':
        return {
          bg: 'bg-purple-500',
          text: 'text-white',
          title: '保洁员已到达，正在准备',
          subtitle: '请协助保洁员确认工作范围',
          progress: null,
        };
      case 'in_progress':
        return {
          bg: 'bg-orange-500',
          text: 'text-white',
          title: '服务进行中',
          subtitle: `已完成约 ${getServiceProgress()}%，预计还需 ${Math.max(0, Math.ceil((100 - getServiceProgress()) / 40))} 小时`,
          progress: getServiceProgress(),
        };
      case 'completed':
        return {
          bg: 'bg-emerald-500',
          text: 'text-white',
          title: '服务已完成，请确认付款',
          subtitle: '感谢您使用我们的服务',
          progress: 100,
        };
      default:
        return null;
    }
  }, [order?.status, order?.actualCheckInTime, countdown]);

  const changeRequestBadge = (cr: NonNullable<typeof order>['changeRequest']) => {
    if (!cr) return null;
    const config = {
      pending: { label: '待审核', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
      approved: { label: '已批准', cls: 'bg-green-100 text-green-700 border-green-200' },
      rejected: { label: '已拒绝', cls: 'bg-red-100 text-red-700 border-red-200' },
    };
    const c = config[cr.status];
    return (
      <div className="mt-4 p-4 rounded-xl border bg-neutral-50">
        <div className="flex items-center gap-2 mb-2">
          <span className={cn('px-2.5 py-1 rounded-lg text-xs font-semibold border', c.cls)}>
            {cr.type === 'reschedule' ? `改期申请 - ${c.label}` : `取消申请 - ${c.label}`}
          </span>
        </div>
        {cr.newScheduledTime && (
          <p className="text-sm text-neutral-600 mb-1">
            <span className="text-neutral-500">新预约时间：</span>
            {formatDate(cr.newScheduledTime)}
          </p>
        )}
        <p className="text-sm text-neutral-600 mb-1">
          <span className="text-neutral-500">申请原因：</span>
          {cr.reason}
        </p>
        {cr.processorNote && (
          <p className="text-sm text-neutral-600">
            <span className="text-neutral-500">处理备注：</span>
            {cr.processorNote}
          </p>
        )}
      </div>
    );
  };

  if (!order) {
    return (
      <div className="card text-center py-16">
        <p className="text-neutral-500">订单不存在</p>
        <button onClick={() => navigate('/customer/orders')} className="btn-primary mt-4">
          返回订单列表
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/customer/orders')}
        className="flex items-center gap-2 text-neutral-600 hover:text-neutral-800 transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
        返回订单列表
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold text-neutral-800">
                    {SERVICE_CONFIG[order.serviceType].name}
                  </h2>
                  <StatusBadge status={order.status} />
                </div>
                <p className="text-sm text-neutral-500">订单号：{order.orderNo}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary-600">¥{order.price}</p>
                <p className="text-sm text-neutral-500">服务费</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-start gap-3 p-4 bg-neutral-50 rounded-xl">
                <MapPin className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-neutral-500 mb-1">服务地址</p>
                  <p className="font-medium text-neutral-800">{order.address.detail}</p>
                  <p className="text-sm text-neutral-500">{order.houseArea}㎡</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-neutral-50 rounded-xl">
                <Clock className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-neutral-500 mb-1">预约时间</p>
                  <p className="font-medium text-neutral-800">{formatDate(order.scheduledTime)}</p>
                  <p className="text-sm text-neutral-500">预计2-3小时</p>
                </div>
              </div>
            </div>

            {order.changeRequest && changeRequestBadge(order.changeRequest)}

            {canChange && (
              <div className="flex justify-end gap-3 mb-6">
                <button
                  onClick={() => setShowRescheduleModal(true)}
                  className="px-4 py-2 border border-primary-200 text-primary-600 rounded-xl font-medium hover:bg-primary-50 transition-colors flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  申请改期
                </button>
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="px-4 py-2 border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  取消订单
                </button>
              </div>
            )}

            {statusBanner && (
              <div className={cn('rounded-2xl p-5 mb-6', statusBanner.bg, statusBanner.text)}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold mb-1">{statusBanner.title}</h3>
                    <p className="text-sm opacity-90">{statusBanner.subtitle}</p>
                  </div>
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    {order.status === 'in_progress' || order.status === 'completed' ? (
                      <Maximize2 className="w-5 h-5" />
                    ) : order.status === 'checked_in' ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </div>
                </div>
                {statusBanner.progress !== null && (
                  <div className="mt-4">
                    <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white rounded-full transition-all duration-500"
                        style={{ width: `${statusBanner.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs opacity-80">
                      <span>0%</span>
                      <span>{statusBanner.progress}%</span>
                      <span>100%</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <OrderTimeline order={order} />
          </div>

          {(['checked_in', 'in_progress', 'completed', 'paid', 'reviewed'].includes(order.status)) && order.photos?.find(p => p.type === 'before') && order.photos?.find(p => p.type === 'after') && (
            <div className="card">
              <h3 className="text-lg font-bold text-neutral-800 mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary-500" />
                清洁前后对比
              </h3>
              <PhotoCompare 
                beforeImage={order.photos.find(p => p.type === 'before')} 
                afterImage={order.photos.find(p => p.type === 'after')} 
              />
            </div>
          )}

          {(['checked_in', 'in_progress'].includes(order.status)) && order.photos?.find(p => p.type === 'before') && !order.photos?.find(p => p.type === 'after') && (
            <div className="card">
              <h3 className="text-lg font-bold text-neutral-800 mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary-500" />
                清洁前照片
              </h3>
              <img
                src={order.photos.find(p => p.type === 'before')!.url}
                alt="清洁前"
                className="w-full rounded-xl"
              />
            </div>
          )}

          {order.review && (
            <div className="card">
              <h3 className="text-lg font-bold text-neutral-800 mb-4">我的评价</h3>
              <div className="flex items-center gap-2 mb-3">
                <StarRating value={order.review.rating} readOnly />
                <span className="text-lg font-bold text-accent-500">{order.review.rating}.0</span>
              </div>
              <p className="text-neutral-600">{order.review.content}</p>
              <p className="text-sm text-neutral-400 mt-2">{formatDate(order.review.createdAt)}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {cleaner && (
            <div className="card">
              <h3 className="text-lg font-bold text-neutral-800 mb-4">保洁员</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                  {cleaner.avatar ? (
                    <img src={cleaner.avatar} alt={cleaner.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-primary-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-neutral-800">{cleaner.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Star className="w-4 h-4 text-accent-500 fill-accent-500" />
                    <span className="font-medium">{cleaner.rating}</span>
                    <span className="text-neutral-400">·</span>
                    <span className="text-sm text-neutral-500">{cleaner.totalOrders}单</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4 p-4 bg-neutral-50 rounded-xl">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-neutral-400" />
                  <span className="text-neutral-500">联系电话：</span>
                  <span className="font-medium text-neutral-800">{cleaner.phone || '138-0000-0000'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-neutral-400" />
                  <span className="text-neutral-500">到达时间：</span>
                  <span className="font-medium text-neutral-800">{getEstimatedArrival()}</span>
                </div>
                {(cleaner.serviceYears || cleaner.serviceArea) && (
                  <div className="flex items-start gap-2 text-sm">
                    <User className="w-4 h-4 text-neutral-400 mt-0.5" />
                    <span className="text-neutral-500">服务信息：</span>
                    <span className="font-medium text-neutral-800">
                      {cleaner.serviceYears ? `${cleaner.serviceYears}年经验` : ''}
                      {cleaner.serviceYears && cleaner.serviceArea ? ' · ' : ''}
                      {cleaner.serviceArea || ''}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleContact}
                  className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 rounded-xl text-neutral-700 font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  联系
                </button>
                <button
                  onClick={handleMessage}
                  className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 rounded-xl text-neutral-700 font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  消息
                </button>
              </div>
            </div>
          )}

          {order.status === 'completed' && !paySuccess && (
            <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-lg font-bold">待支付</h3>
              </div>
              <p className="text-primary-100 mb-4">保洁员已完成服务，请确认付款</p>
              <div className="text-3xl font-bold mb-4">¥{order.price}</div>
              <button
                onClick={handlePay}
                disabled={loading}
                className="w-full py-3 bg-white text-primary-600 font-bold rounded-xl hover:bg-primary-50 transition-colors"
              >
                {loading ? '处理中...' : '立即支付'}
              </button>
            </div>
          )}

          {paySuccess && (
            <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white text-center py-8">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">支付成功！</h3>
              <p className="text-primary-100">请对本次服务进行评价</p>
            </div>
          )}

          {reviewSuccess && (
            <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white text-center py-8">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">评价提交成功！</h3>
              <p className="text-primary-100">感谢您的反馈</p>
            </div>
          )}

          {order.status === 'paid' && !order.review && !showReviewForm && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="w-full py-3 btn-primary"
            >
              去评价
            </button>
          )}

          {showReviewForm && !reviewSuccess && (
            <div className="card">
              <h3 className="text-lg font-bold text-neutral-800 mb-4">评价服务</h3>
              <form onSubmit={handleSubmit(onSubmitReview)} className="space-y-4">
                <div>
                  <label className="label">服务评分</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setValue('rating', star)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={cn(
                            'w-8 h-8',
                            star <= watch('rating')
                              ? 'text-accent-500 fill-accent-500'
                              : 'text-neutral-300'
                          )}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-lg font-bold text-accent-500">
                      {watch('rating')}.0
                    </span>
                  </div>
                </div>
                <div>
                  <label className="label">评价内容</label>
                  <textarea
                    className="input-field min-h-[120px]"
                    placeholder="请分享您的服务体验..."
                    {...register('content', { required: '请填写评价内容' })}
                  />
                  {errors.content && (
                    <p className="mt-2 text-sm text-danger-600">{errors.content.message}</p>
                  )}
                </div>
                {watch('rating') <= 2 && (
                  <div className="bg-danger-50 rounded-xl p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-danger-700">
                        抱歉给您带来不好的体验，我们的调度员会尽快与您联系处理。
                      </p>
                    </div>
                  </div>
                )}
                <button type="submit" disabled={loading} className="w-full btn-primary">
                  {loading ? '提交中...' : '提交评价'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {showRescheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-neutral-100">
              <h3 className="text-lg font-bold text-neutral-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-500" />
                申请改期
              </h3>
              <button
                onClick={() => {
                  setShowRescheduleModal(false);
                  setRescheduleDate('');
                  setRescheduleTime(TIME_SLOTS[0]);
                  setRescheduleReason('');
                }}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label">选择新日期 <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={rescheduleDate}
                  min={getMinDate()}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">选择时间段 <span className="text-red-500">*</span></label>
                <select
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="input-field"
                >
                  {TIME_SLOTS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">改期原因 <span className="text-red-500">*</span></label>
                <textarea
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="请说明改期原因..."
                  className="input-field min-h-[100px] resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-neutral-100">
              <button
                onClick={() => {
                  setShowRescheduleModal(false);
                  setRescheduleDate('');
                  setRescheduleTime(TIME_SLOTS[0]);
                  setRescheduleReason('');
                }}
                className="flex-1 py-2.5 border border-neutral-200 rounded-xl text-neutral-700 font-medium hover:bg-neutral-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmitReschedule}
                disabled={loading || !rescheduleDate || !rescheduleReason.trim()}
                className="flex-1 py-2.5 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? '提交中...' : '提交申请'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-neutral-100">
              <h3 className="text-lg font-bold text-neutral-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                取消订单
              </h3>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-red-50 rounded-xl p-4">
                <p className="text-sm text-red-700">
                  取消订单后将无法恢复，请谨慎操作。如有改期需求建议使用「申请改期」功能。
                </p>
              </div>
              <div>
                <label className="label">取消原因 <span className="text-red-500">*</span></label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="请说明取消订单的原因..."
                  className="input-field min-h-[120px] resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-neutral-100">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                className="flex-1 py-2.5 border border-neutral-200 rounded-xl text-neutral-700 font-medium hover:bg-neutral-50 transition-colors"
              >
                我再想想
              </button>
              <button
                onClick={handleSubmitCancel}
                disabled={loading || !cancelReason.trim()}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? '提交中...' : '确认取消'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
