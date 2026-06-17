import React, { useEffect, useState } from 'react';
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

export const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { orders, fetchOrders, payOrder, submitReview, loading } = useOrderStore();
  const { cleaners, fetchCleaners } = useUserStore();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

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

            <OrderTimeline order={order} />
          </div>

          {order.photos?.find(p => p.type === 'before') && order.photos?.find(p => p.type === 'after') && (
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

          {order.photos?.find(p => p.type === 'before') && !order.photos?.find(p => p.type === 'after') && (
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
                <div>
                  <h4 className="font-bold text-neutral-800">{cleaner.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Star className="w-4 h-4 text-accent-500 fill-accent-500" />
                    <span className="font-medium">{cleaner.rating}</span>
                    <span className="text-neutral-400">·</span>
                    <span className="text-sm text-neutral-500">{cleaner.totalOrders}单</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 rounded-xl text-neutral-700 font-medium transition-colors flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4" />
                  联系
                </button>
                <button className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 rounded-xl text-neutral-700 font-medium transition-colors flex items-center justify-center gap-2">
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
    </div>
  );
};
