import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  MapPin,
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { useOrderStore } from '../../store/useOrderStore';
import { useAuthStore } from '../../store/useAuthStore';
import { StarRating } from '../../components/ui/StarRating';
import { formatDate, cn } from '../../utils';
import { SERVICE_CONFIG } from '../../types';

type TabType = 'pending' | 'handled';

export const ReviewManagement: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { orders, fetchOrders, handleBadReview, loading } = useOrderStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<'refund' | 're_service' | 'compensate' | 'other'>('re_service');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [highlightedOrderId, setHighlightedOrderId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    const reviewId = searchParams.get('reviewId');

    if (orderId || reviewId) {
      const targetOrder = orders.find(
        (o) => o.id === orderId || o.review?.id === reviewId
      );
      if (targetOrder && targetOrder.review) {
        const isHandled = targetOrder.review.handled;
        setActiveTab(isHandled ? 'handled' : 'pending');
        setExpandedOrderId(targetOrder.id);
        setHighlightedOrderId(targetOrder.id);

        setTimeout(() => {
          const el = document.getElementById(`review-order-${targetOrder.id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 200);

        setTimeout(() => {
          setHighlightedOrderId(null);
        }, 3000);
      }
    }
  }, [searchParams, orders]);

  const badReviewOrders = orders.filter(
    (o) => o.review && o.review.isBadReview
  );

  const pendingReviews = badReviewOrders.filter((o) => !o.review?.handled);
  const handledReviews = badReviewOrders.filter((o) => o.review?.handled);

  const displayedOrders = activeTab === 'pending' ? pendingReviews : handledReviews;

  const toggleExpand = (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
      const order = orders.find((o) => o.id === orderId);
      if (order?.review?.handled) {
        setSelectedAction('re_service');
        setNote('');
      }
    }
  };

  const handleSubmit = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order?.review) return;

    setSubmitting(true);
    try {
      await handleBadReview({
        reviewId: order.review.id,
        action: selectedAction,
        note,
        handlerId: user?.id || 'd1',
      });
      setExpandedOrderId(null);
      setNote('');
      setSubmitting(false);
    } catch (error) {
      console.error('Handle bad review failed:', error);
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-800">差评处理</h2>
          <p className="text-neutral-500">处理客户差评，提升服务质量</p>
        </div>
        <button
          onClick={() => fetchOrders()}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div
          className={cn(
            'card cursor-pointer transition-all',
            activeTab === 'pending' && 'ring-2 ring-danger-400'
          )}
          onClick={() => setActiveTab('pending')}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-danger-100 flex items-center justify-center">
              <Clock className="w-7 h-7 text-danger-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-danger-600">
                {pendingReviews.length}
              </p>
              <p className="text-neutral-500">待处理差评</p>
            </div>
          </div>
        </div>

        <div
          className={cn(
            'card cursor-pointer transition-all',
            activeTab === 'handled' && 'ring-2 ring-primary-400'
          )}
          onClick={() => setActiveTab('handled')}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-primary-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-primary-600">
                {handledReviews.length}
              </p>
              <p className="text-neutral-500">已处理差评</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card">
        <div className="flex border-b border-neutral-100">
          <button
            className={cn(
              'px-6 py-4 font-medium transition-colors relative',
              activeTab === 'pending'
                ? 'text-danger-600'
                : 'text-neutral-500 hover:text-neutral-700'
            )}
            onClick={() => setActiveTab('pending')}
          >
            待处理
            <span
              className={cn(
                'ml-2 px-2 py-0.5 rounded-full text-xs',
                activeTab === 'pending'
                  ? 'bg-danger-100 text-danger-600'
                  : 'bg-neutral-100 text-neutral-500'
              )}
            >
              {pendingReviews.length}
            </span>
            {activeTab === 'pending' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-danger-500" />
            )}
          </button>
          <button
            className={cn(
              'px-6 py-4 font-medium transition-colors relative',
              activeTab === 'handled'
                ? 'text-primary-600'
                : 'text-neutral-500 hover:text-neutral-700'
            )}
            onClick={() => setActiveTab('handled')}
          >
            已处理
            <span
              className={cn(
                'ml-2 px-2 py-0.5 rounded-full text-xs',
                activeTab === 'handled'
                  ? 'bg-primary-100 text-primary-600'
                  : 'bg-neutral-100 text-neutral-500'
              )}
            >
              {handledReviews.length}
            </span>
            {activeTab === 'handled' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
            )}
          </button>
        </div>

        <div ref={scrollRef} className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-danger-200 border-t-danger-500 rounded-full animate-spin" />
            </div>
          ) : displayedOrders.length > 0 ? (
            <div className="space-y-3">
              {displayedOrders.map((order) => {
                const review = order.review!;
                const isExpanded = expandedOrderId === order.id;
                const isHighlighted = highlightedOrderId === order.id;

                return (
                  <div
                    key={order.id}
                    id={`review-order-${order.id}`}
                    className={cn(
                      'border rounded-xl overflow-hidden transition-all duration-300',
                      isHighlighted
                        ? 'border-primary-400 ring-4 ring-primary-100 bg-primary-50/50'
                        : 'border-neutral-200 hover:border-neutral-300',
                      activeTab === 'pending' && !isHighlighted && 'border-danger-200 hover:border-danger-300'
                    )}
                  >
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => toggleExpand(order.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div
                            className={cn(
                              'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                              review.handled ? 'bg-primary-100' : 'bg-danger-100'
                            )}
                          >
                            {review.handled ? (
                              <CheckCircle className="w-6 h-6 text-primary-600" />
                            ) : (
                              <AlertTriangle className="w-6 h-6 text-danger-600" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-neutral-800">
                                {order.customer.name}
                              </span>
                              <span className="text-sm text-neutral-500">
                                {SERVICE_CONFIG[order.serviceType].name}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-neutral-500 mb-2">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {order.address.detail}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <StarRating value={review.rating} size="sm" readOnly />
                              <span className="text-sm text-neutral-400">
                                {formatDate(review.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {review.handled ? (
                            <span className="px-3 py-1 bg-primary-100 text-primary-600 rounded-full text-sm font-medium">
                              已处理
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-danger-100 text-danger-600 rounded-full text-sm font-medium">
                              待处理
                            </span>
                          )}
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-neutral-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-neutral-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-neutral-100 pt-4 animate-fade-in">
                        <div className="bg-neutral-50 rounded-xl p-4 mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="w-4 h-4 text-neutral-400" />
                            <span className="text-sm font-medium text-neutral-700">
                              客户评价
                            </span>
                          </div>
                          <p className="text-neutral-600">{review.content}</p>
                        </div>

                        {order.cleaner && (
                          <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl mb-4">
                            <img
                              src={order.cleaner.avatar}
                              alt={order.cleaner.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                              <p className="font-medium text-neutral-800">
                                {order.cleaner.name}
                              </p>
                              <div className="flex items-center gap-2">
                                <StarRating
                                  value={order.cleaner.rating}
                                  size="sm"
                                  readOnly
                                />
                                <span className="text-xs text-neutral-500">
                                  {order.cleaner.totalOrders}单
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {review.handled ? (
                          <div className="bg-primary-50 rounded-xl p-4 border border-primary-200">
                            <div className="flex items-center gap-2 mb-3">
                              <CheckCircle className="w-5 h-5 text-primary-600" />
                              <span className="font-medium text-primary-700">
                                处理结果
                              </span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-neutral-500">
                                  处理方式：
                                </span>
                                <span className="text-sm font-medium text-neutral-800">
                                  {review.action === 're_service' && '重新清洁'}
                                  {review.action === 'refund' && '部分退款'}
                                  {review.action === 'compensate' && '致歉补偿'}
                                  {review.action === 'other' && '其他处理'}
                                  {!review.action && '致歉补偿'}
                                </span>
                              </div>
                              <div>
                                <span className="text-sm text-neutral-500">
                                  处理备注：
                                </span>
                                <p className="text-sm text-neutral-700 mt-1">
                                  {review.handlerNote || '无'}
                                </p>
                              </div>
                              {review.handlerId && (
                                <div className="text-xs text-neutral-400">
                                  处理人：调度员
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div>
                              <label className="label">处理方式</label>
                              <div className="grid grid-cols-2 gap-3">
                                {([
                                  {
                                    value: 're_service' as const,
                                    label: '重新清洁',
                                    desc: '安排再次上门清洁',
                                  },
                                  {
                                    value: 'refund' as const,
                                    label: '部分退款',
                                    desc: '退还部分服务费用',
                                  },
                                  {
                                    value: 'compensate' as const,
                                    label: '致歉补偿',
                                    desc: '联系客户致歉补偿',
                                  },
                                  {
                                    value: 'other' as const,
                                    label: '其他处理',
                                    desc: '其他处理方式',
                                  },
                                ]).map((action) => (
                                  <div
                                    key={action.value}
                                    onClick={() => setSelectedAction(action.value)}
                                    className={cn(
                                      'p-3 border-2 rounded-xl cursor-pointer transition-all',
                                      selectedAction === action.value
                                        ? 'border-primary-500 bg-primary-50'
                                        : 'border-neutral-200 hover:border-primary-200'
                                    )}
                                  >
                                    <p className="font-medium text-neutral-800 text-sm">
                                      {action.label}
                                    </p>
                                    <p className="text-xs text-neutral-500 mt-1">
                                      {action.desc}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label className="label">
                                <MessageSquare className="w-4 h-4 inline mr-2" />
                                处理备注
                              </label>
                              <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="请输入处理备注..."
                                className="input-field min-h-[100px] resize-none"
                              />
                            </div>

                            <div className="flex gap-3">
                              <button
                                onClick={() => {
                                  setExpandedOrderId(null);
                                  setNote('');
                                }}
                                className="flex-1 btn-secondary"
                              >
                                取消
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSubmit(order.id);
                                }}
                                disabled={submitting}
                                className="flex-1 btn-primary flex items-center justify-center gap-2"
                              >
                                {submitting ? (
                                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4" />
                                )}
                                提交处理
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {activeTab === 'pending' ? (
                  <CheckCircle className="w-8 h-8 text-green-500" />
                ) : (
                  <XCircle className="w-8 h-8 text-neutral-400" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-neutral-800 mb-2">
                {activeTab === 'pending' ? '暂无待处理差评' : '暂无已处理差评'}
              </h3>
              <p className="text-neutral-500">
                {activeTab === 'pending'
                  ? '太棒了！所有差评都已处理完毕'
                  : '还没有处理过差评记录'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
