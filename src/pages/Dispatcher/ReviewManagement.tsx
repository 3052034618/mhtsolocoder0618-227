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
  Phone,
  Gift,
  FileText,
  Sparkles,
  Undo2,
} from 'lucide-react';
import { useOrderStore } from '../../store/useOrderStore';
import { useAuthStore } from '../../store/useAuthStore';
import { StarRating } from '../../components/ui/StarRating';
import { formatDate, cn } from '../../utils';
import { SERVICE_CONFIG, type ReviewFollowUpAction } from '../../types';

type TabType = 'pending' | 'handled';

const FOLLOW_UP_CONFIG: Record<
  ReviewFollowUpAction,
  { label: string; color: string; bgColor: string; icon: React.ComponentType<{ className?: string }> }
> = {
  contact: {
    label: '联系客户',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: Phone,
  },
  reclean: {
    label: '重新清洁',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: Sparkles,
  },
  refund: {
    label: '退款',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    icon: Undo2,
  },
  compensate: {
    label: '补偿',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
    icon: Gift,
  },
  note: {
    label: '备注',
    color: 'text-neutral-600',
    bgColor: 'bg-neutral-100',
    icon: FileText,
  },
  resolve: {
    label: '已解决',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: CheckCircle,
  },
};

const isReviewResolved = (review: {
  handled?: boolean;
  action?: string;
  followUps?: { action: ReviewFollowUpAction }[];
}): boolean => {
  if (review.handled === true) return true;
  if (review.followUps?.some((f) => f.action === 'resolve')) return true;
  return false;
};

const mapLegacyAction = (action: string): ReviewFollowUpAction => {
  switch (action) {
    case 're_service':
      return 'reclean';
    case 'refund':
      return 'refund';
    case 'compensate':
      return 'compensate';
    case 'other':
    default:
      return 'note';
  }
};

export const ReviewManagement: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { orders, fetchOrders, handleBadReview, addReviewFollowUp, loading } = useOrderStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [followUpActionMap, setFollowUpActionMap] = useState<Record<string, ReviewFollowUpAction>>({});
  const [followUpContentMap, setFollowUpContentMap] = useState<Record<string, string>>({});
  const [submittingMap, setSubmittingMap] = useState<Record<string, boolean>>({});
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
        const isHandled = isReviewResolved(targetOrder.review);
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

  const pendingReviews = badReviewOrders.filter((o) => !isReviewResolved(o.review!));
  const handledReviews = badReviewOrders.filter((o) => isReviewResolved(o.review!));

  const displayedOrders = activeTab === 'pending' ? pendingReviews : handledReviews;

  const toggleExpand = (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
    }
  };

  const getFollowUpAction = (orderId: string): ReviewFollowUpAction =>
    followUpActionMap[orderId] || 'contact';

  const setFollowUpAction = (orderId: string, action: ReviewFollowUpAction) => {
    setFollowUpActionMap((prev) => ({ ...prev, [orderId]: action }));
  };

  const getFollowUpContent = (orderId: string): string =>
    followUpContentMap[orderId] || '';

  const setFollowUpContent = (orderId: string, content: string) => {
    setFollowUpContentMap((prev) => ({ ...prev, [orderId]: content }));
  };

  const getSubmitting = (orderId: string): boolean => !!submittingMap[orderId];

  const setSubmitting = (orderId: string, value: boolean) => {
    setSubmittingMap((prev) => ({ ...prev, [orderId]: value }));
  };

  const handleAddFollowUp = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order?.review) return;

    const action = getFollowUpAction(orderId);
    const content = getFollowUpContent(orderId).trim();
    if (!content) return;

    setSubmitting(orderId, true);
    try {
      const operatorId = user?.id || 'd1';
      const operatorName = user?.name || '调度员';
      await addReviewFollowUp(order.review.id, {
        action,
        content,
        operatorId,
        operatorName,
      });
      setFollowUpAction(orderId, 'contact');
      setFollowUpContent(orderId, '');
    } catch (error) {
      console.error('Add follow up failed:', error);
    } finally {
      setSubmitting(orderId, false);
    }
  };

  const buildTimelineEntries = (order: {
    review?: {
      action?: string;
      handlerNote?: string;
      handlerId?: string;
      handled?: boolean;
      handledAt?: string;
      createdAt?: string;
      followUps?: {
        id: string;
        action: ReviewFollowUpAction;
        content: string;
        createdAt: string;
        operatorId: string;
        operatorName: string;
      }[];
    };
  }) => {
    const review = order.review;
    if (!review) return [];

    const entries: {
      id: string;
      action: ReviewFollowUpAction;
      content: string;
      createdAt: string;
      operatorId: string;
      operatorName: string;
      isLegacy?: boolean;
    }[] = [];

    if (review.action || review.handlerNote || review.handled) {
      const legacyAction = review.action ? mapLegacyAction(review.action) : 'resolve';
      entries.push({
        id: 'legacy-handle',
        action: legacyAction,
        content: review.handlerNote || '已处理',
        createdAt: review.handledAt || review.createdAt || new Date().toISOString(),
        operatorId: review.handlerId || 'd1',
        operatorName: '调度员',
        isLegacy: true,
      });
    }

    if (review.followUps && review.followUps.length > 0) {
      entries.push(...review.followUps);
    }

    entries.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return entries;
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
                const isResolved = isReviewResolved(review);
                const timelineEntries = buildTimelineEntries(order);

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
                              isResolved ? 'bg-primary-100' : 'bg-danger-100'
                            )}
                          >
                            {isResolved ? (
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
                          {isResolved ? (
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
                      <div className="px-4 pb-4 border-t border-neutral-100 pt-4 animate-fade-in space-y-4">
                        <div className="bg-neutral-50 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="w-4 h-4 text-neutral-400" />
                            <span className="text-sm font-medium text-neutral-700">
                              客户评价
                            </span>
                          </div>
                          <p className="text-neutral-600">{review.content}</p>
                        </div>

                        {order.cleaner && (
                          <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
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

                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Clock className="w-4 h-4 text-neutral-400" />
                            <span className="text-sm font-medium text-neutral-700">
                              跟进记录
                            </span>
                            <span className="text-xs text-neutral-400">
                              ({timelineEntries.length})
                            </span>
                          </div>

                          {timelineEntries.length > 0 ? (
                            <div className="relative pl-8">
                              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-neutral-200" />
                              <div className="space-y-5">
                                {timelineEntries.map((entry, idx) => {
                                  const config = FOLLOW_UP_CONFIG[entry.action];
                                  const IconComp = config.icon;
                                  const isLast = idx === timelineEntries.length - 1;
                                  return (
                                    <div key={entry.id} className="relative">
                                      <div
                                        className={cn(
                                          'absolute -left-8 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white',
                                          config.bgColor
                                        )}
                                        style={{ top: '2px' }}
                                      >
                                        <IconComp className={cn('w-3.5 h-3.5', config.color)} />
                                      </div>
                                      <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <span className={cn('font-medium text-sm', config.color)}>
                                          {config.label}
                                        </span>
                                        <span className="text-neutral-300 text-xs">|</span>
                                        <span className="text-sm text-neutral-600 flex items-center gap-1">
                                          <User className="w-3.5 h-3.5" />
                                          {entry.operatorName}
                                        </span>
                                        <span className="text-neutral-300 text-xs">|</span>
                                        <span className="text-xs text-neutral-400">
                                          {formatDate(entry.createdAt)}
                                        </span>
                                      </div>
                                      <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">
                                        {entry.content}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <div className="bg-neutral-50 rounded-xl p-4 text-center text-sm text-neutral-400">
                              暂无跟进记录
                            </div>
                          )}
                        </div>

                        <div className="border-t border-neutral-100 pt-4">
                          <div className="text-sm font-medium text-neutral-700 mb-3">
                            追加跟进记录
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="label">操作类型</label>
                              <div className="grid grid-cols-3 gap-2">
                                {(Object.keys(FOLLOW_UP_CONFIG) as ReviewFollowUpAction[]).map(
                                  (actionKey) => {
                                    const config = FOLLOW_UP_CONFIG[actionKey];
                                    const IconComp = config.icon;
                                    const isSelected = getFollowUpAction(order.id) === actionKey;
                                    return (
                                      <div
                                        key={actionKey}
                                        onClick={() => setFollowUpAction(order.id, actionKey)}
                                        className={cn(
                                          'p-2.5 border-2 rounded-xl cursor-pointer transition-all flex items-center gap-2',
                                          isSelected
                                            ? cn('border-current', config.color, 'bg-opacity-5', config.bgColor)
                                            : 'border-neutral-200 hover:border-neutral-300'
                                        )}
                                      >
                                        <IconComp className={cn('w-4 h-4', isSelected ? config.color : 'text-neutral-400')} />
                                        <span className={cn('text-sm font-medium', isSelected ? config.color : 'text-neutral-600')}>
                                          {config.label}
                                        </span>
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            </div>

                            <div>
                              <label className="label">
                                <MessageSquare className="w-4 h-4 inline mr-2" />
                                记录内容
                              </label>
                              <textarea
                                value={getFollowUpContent(order.id)}
                                onChange={(e) => setFollowUpContent(order.id, e.target.value)}
                                placeholder="请输入跟进记录内容..."
                                className="input-field min-h-[90px] resize-none"
                              />
                            </div>

                            <div className="flex gap-3">
                              <button
                                onClick={() => {
                                  setFollowUpAction(order.id, 'contact');
                                  setFollowUpContent(order.id, '');
                                }}
                                className="flex-1 btn-secondary"
                              >
                                清空
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddFollowUp(order.id);
                                }}
                                disabled={getSubmitting(order.id) || !getFollowUpContent(order.id).trim()}
                                className="flex-1 btn-primary flex items-center justify-center gap-2"
                              >
                                {getSubmitting(order.id) ? (
                                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4" />
                                )}
                                追加记录
                              </button>
                            </div>
                          </div>
                        </div>
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
