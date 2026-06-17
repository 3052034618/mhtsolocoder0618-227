import type {
  ApiResponse,
  Order,
  OrderPhoto,
  CreateOrderRequest,
  DispatchOrderRequest,
  SubmitReviewRequest,
  RecurringService,
  OrderChangeRequest,
  ReviewFollowUp,
  ReviewFollowUpAction,
} from '../types';
import { MOCK_ORDERS, MOCK_CLEANERS, MOCK_CUSTOMERS, MOCK_RECURRING_SERVICES } from '../mock';
import { delay, generateId, generateOrderNo, calculatePrice, calculateCommission, getFollowingOrderDate } from '../utils';

let orders = [...MOCK_ORDERS];

export const getOrders = async (
  filters?: Record<string, unknown>
): Promise<ApiResponse<Order[]>> => {
  await delay(500);

  let result = [...orders];

  if (filters) {
    if (filters.customerId) {
      result = result.filter((o) => o.customerId === filters.customerId);
    }
    if (filters.cleanerId) {
      result = result.filter((o) => o.cleanerId === filters.cleanerId);
    }
    if (filters.status) {
      result = result.filter((o) => o.status === filters.status);
    }
    if (filters.date) {
      const dateStr = filters.date as string;
      result = result.filter((o) => o.scheduledTime.startsWith(dateStr));
    }
    if (filters.isBadReview) {
      result = result.filter((o) => o.review?.isBadReview && !o.review?.handled);
    }
  }

  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    code: 200,
    message: '获取成功',
    data: result,
  };
};

export const getOrderById = async (id: string): Promise<ApiResponse<Order>> => {
  await delay(300);

  const order = orders.find((o) => o.id === id);
  if (!order) {
    throw new Error('订单不存在');
  }

  return {
    code: 200,
    message: '获取成功',
    data: order,
  };
};

export const createOrder = async (data: CreateOrderRequest): Promise<ApiResponse<Order>> => {
  await delay(600);

  const customer = MOCK_CUSTOMERS.find((c) => c.addresses.some((a) => a.id === data.addressId));
  if (!customer) {
    throw new Error('客户不存在');
  }

  const address = customer.addresses.find((a) => a.id === data.addressId);
  if (!address) {
    throw new Error('地址不存在');
  }

  const price = calculatePrice(data.serviceType, data.houseArea);
  const now = new Date().toISOString();

  const newOrder: Order = {
    id: generateId(),
    orderNo: generateOrderNo(),
    customerId: customer.id,
    customer,
    serviceType: data.serviceType,
    address,
    houseArea: data.houseArea,
    scheduledTime: data.scheduledTime,
    price,
    status: 'pending',
    photos: [],
    createdAt: now,
    updatedAt: now,
  };

  orders = [newOrder, ...orders];

  return {
    code: 200,
    message: '创建订单成功',
    data: newOrder,
  };
};

export const updateOrderStatus = async (
  orderId: string,
  status: Order['status']
): Promise<ApiResponse<Order>> => {
  await delay(400);

  const index = orders.findIndex((o) => o.id === orderId);
  if (index === -1) {
    throw new Error('订单不存在');
  }

  orders[index] = {
    ...orders[index],
    status,
    updatedAt: new Date().toISOString(),
  };

  return {
    code: 200,
    message: '更新成功',
    data: orders[index],
  };
};

export const dispatchOrder = async (data: DispatchOrderRequest): Promise<ApiResponse<Order>> => {
  await delay(500);

  const index = orders.findIndex((o) => o.id === data.orderId);
  if (index === -1) {
    throw new Error('订单不存在');
  }

  const cleaner = MOCK_CLEANERS.find((c) => c.id === data.cleanerId);
  if (!cleaner) {
    throw new Error('保洁员不存在');
  }

  orders[index] = {
    ...orders[index],
    cleanerId: data.cleanerId,
    cleaner,
    status: 'assigned',
    dispatcherId: 'd1',
    updatedAt: new Date().toISOString(),
  };

  return {
    code: 200,
    message: '派单成功',
    data: orders[index],
  };
};

export const acceptOrder = async (orderId: string): Promise<ApiResponse<Order>> => {
  await delay(400);

  const index = orders.findIndex((o) => o.id === orderId);
  if (index === -1) {
    throw new Error('订单不存在');
  }

  orders[index] = {
    ...orders[index],
    status: 'accepted',
    updatedAt: new Date().toISOString(),
  };

  return {
    code: 200,
    message: '接单成功',
    data: orders[index],
  };
};

export const checkInOrder = async (orderId: string): Promise<ApiResponse<Order>> => {
  await delay(400);

  const index = orders.findIndex((o) => o.id === orderId);
  if (index === -1) {
    throw new Error('订单不存在');
  }

  const now = new Date().toISOString();

  orders[index] = {
    ...orders[index],
    status: 'checked_in',
    actualCheckInTime: now,
    updatedAt: now,
  };

  return {
    code: 200,
    message: '签到成功',
    data: orders[index],
  };
};

export const completeOrder = async (orderId: string): Promise<ApiResponse<Order>> => {
  await delay(400);

  const index = orders.findIndex((o) => o.id === orderId);
  if (index === -1) {
    throw new Error('订单不存在');
  }

  const now = new Date().toISOString();

  orders[index] = {
    ...orders[index],
    status: 'completed',
    actualCompleteTime: now,
    updatedAt: now,
  };

  return {
    code: 200,
    message: '服务完成',
    data: orders[index],
  };
};

export const submitReview = async (data: SubmitReviewRequest): Promise<ApiResponse<Order>> => {
  await delay(500);

  const index = orders.findIndex((o) => o.id === data.orderId);
  if (index === -1) {
    throw new Error('订单不存在');
  }

  const isBadReview = data.rating <= 2;

  orders[index] = {
    ...orders[index],
    status: 'reviewed',
    review: {
      id: generateId(),
      orderId: data.orderId,
      rating: data.rating,
      content: data.content,
      createdAt: new Date().toISOString(),
      isBadReview,
      handled: false,
    },
    updatedAt: new Date().toISOString(),
  };

  const order = orders[index];
  if (order.cleanerId) {
    const cleanerIndex = MOCK_CLEANERS.findIndex((c) => c.id === order.cleanerId);
    if (cleanerIndex !== -1) {
      const cleaner = MOCK_CLEANERS[cleanerIndex];
      const totalRating = cleaner.rating * cleaner.totalOrders + data.rating;
      const newTotalOrders = cleaner.totalOrders + 1;
      MOCK_CLEANERS[cleanerIndex] = {
        ...cleaner,
        rating: Math.round((totalRating / newTotalOrders) * 100) / 100,
        totalOrders: newTotalOrders,
      };
    }
  }

  return {
    code: 200,
    message: '评价成功',
    data: orders[index],
  };
};

export const uploadPhoto = async (
  orderId: string,
  type: 'before' | 'after',
  url: string
): Promise<ApiResponse<OrderPhoto>> => {
  await delay(600);

  const index = orders.findIndex((o) => o.id === orderId);
  if (index === -1) {
    throw new Error('订单不存在');
  }

  const photo: OrderPhoto = {
    id: generateId(),
    type,
    url,
    uploadedAt: new Date().toISOString(),
  };

  orders[index] = {
    ...orders[index],
    photos: [...orders[index].photos, photo],
    status: type === 'before' ? 'in_progress' : orders[index].status,
    updatedAt: new Date().toISOString(),
  };

  return {
    code: 200,
    message: '上传成功',
    data: photo,
  };
};

export const payOrder = async (orderId: string): Promise<ApiResponse<Order>> => {
  await delay(800);

  const index = orders.findIndex((o) => o.id === orderId);
  if (index === -1) {
    throw new Error('订单不存在');
  }

  orders[index] = {
    ...orders[index],
    status: 'paid',
    updatedAt: new Date().toISOString(),
  };

  return {
    code: 200,
    message: '支付成功',
    data: orders[index],
  };
};

export const handleBadReview = async (
  reviewId: string,
  note: string
): Promise<ApiResponse<Order>> => {
  await delay(500);

  const index = orders.findIndex((o) => o.review?.id === reviewId);
  if (index === -1) {
    throw new Error('订单不存在');
  }

  if (!orders[index].review) {
    throw new Error('评价不存在');
  }

  orders[index] = {
    ...orders[index],
    review: {
      ...orders[index].review!,
      handled: true,
      handlerNote: note,
      handlerId: 'd1',
    },
    updatedAt: new Date().toISOString(),
  };

  return {
    code: 200,
    message: '处理成功',
    data: orders[index],
  };
};

export const createRecurringOrder = async (
  recurringService: RecurringService
): Promise<ApiResponse<Order>> => {
  await delay(300);

  const customer = MOCK_CUSTOMERS.find((c) => c.id === recurringService.customerId);
  if (!customer) {
    throw new Error('客户不存在');
  }

  const price = calculatePrice(recurringService.serviceType, recurringService.houseArea);
  const now = new Date().toISOString();
  const scheduledTime = `${recurringService.nextOrderDate}T${recurringService.preferredTime}:00`;

  const newOrder: Order = {
    id: generateId(),
    orderNo: generateOrderNo(),
    customerId: customer.id,
    customer,
    serviceType: recurringService.serviceType,
    address: recurringService.address,
    houseArea: recurringService.houseArea,
    scheduledTime,
    price,
    status: 'pending',
    photos: [],
    recurringServiceId: recurringService.id,
    createdAt: now,
    updatedAt: now,
  };

  orders = [newOrder, ...orders];

  return {
    code: 200,
    message: '自动续单创建成功',
    data: newOrder,
  };
};

export const cancelRecurringOrders = async (
  recurringServiceId: string
): Promise<ApiResponse<null>> => {
  await delay(300);

  orders = orders.map((o) => {
    if (o.recurringServiceId === recurringServiceId && o.status === 'pending') {
      return {
        ...o,
        status: 'cancelled' as const,
        updatedAt: new Date().toISOString(),
      };
    }
    return o;
  });

  return {
    code: 200,
    message: '关联订单已取消',
    data: null,
  };
};

export const generateNextRecurringOrder = async (
  recurringServiceId: string
): Promise<ApiResponse<Order | null>> => {
  await delay(200);

  const rs = MOCK_RECURRING_SERVICES.find((r) => r.id === recurringServiceId);
  if (!rs || !rs.isActive) {
    return { code: 200, message: '定期服务不存在或已取消', data: null };
  }

  const rsOrders = orders
    .filter((o) => o.recurringServiceId === rs.id && o.status !== 'cancelled')
    .sort((a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime());

  if (rsOrders.length > 0) {
    const lastOrder = rsOrders[0];
    const lastDate = lastOrder.scheduledTime.slice(0, 10);
    const pendingExists = rsOrders.some((o) =>
      ['pending', 'assigned', 'accepted', 'checked_in', 'in_progress'].includes(o.status)
    );
    if (pendingExists) {
      return { code: 200, message: '已有待执行订单', data: null };
    }
    const nextDate = getFollowingOrderDate(rs.frequency, lastDate, rs.preferredDay);
    return createRecurringOrderWithDate(rs, nextDate);
  }

  return createRecurringOrderWithDate(rs, rs.nextOrderDate);
};

const createRecurringOrderWithDate = (
  rs: RecurringService,
  orderDate: string
): Promise<ApiResponse<Order>> => {
  return new Promise((resolve) => {
    const customer = MOCK_CUSTOMERS.find((c) => c.id === rs.customerId);
    if (!customer) {
      resolve({ code: 404, message: '客户不存在', data: {} as Order });
      return;
    }

    const price = calculatePrice(rs.serviceType, rs.houseArea);
    const now = new Date().toISOString();
    const scheduledTime = `${orderDate}T${rs.preferredTime || '10:00'}:00`;

    const newOrder: Order = {
      id: generateId(),
      orderNo: generateOrderNo(),
      customerId: customer.id,
      customer,
      serviceType: rs.serviceType,
      address: rs.address,
      houseArea: rs.houseArea,
      scheduledTime,
      price,
      status: 'pending',
      photos: [],
      recurringServiceId: rs.id,
      createdAt: now,
      updatedAt: now,
    };

    orders = [newOrder, ...orders];

    const rsIndex = MOCK_RECURRING_SERVICES.findIndex((r) => r.id === rs.id);
    if (rsIndex !== -1) {
      MOCK_RECURRING_SERVICES[rsIndex] = {
        ...MOCK_RECURRING_SERVICES[rsIndex],
        nextOrderDate: getFollowingOrderDate(rs.frequency, orderDate, rs.preferredDay),
      };
    }

    resolve({
      code: 200,
      message: '自动续单创建成功',
      data: newOrder,
    });
  });
};

export const syncAllRecurringOrders = async (): Promise<ApiResponse<Order[]>> => {
  await delay(300);
  const created: Order[] = [];

  for (const rs of MOCK_RECURRING_SERVICES) {
    if (!rs.isActive) continue;
    const rsOrders = orders.filter(
      (o) => o.recurringServiceId === rs.id && o.status !== 'cancelled'
    );
    const pendingExists = rsOrders.some((o) =>
      ['pending', 'assigned', 'accepted', 'checked_in', 'in_progress'].includes(o.status)
    );
    if (!pendingExists) {
      const result = await generateNextRecurringOrder(rs.id);
      if (result.data) created.push(result.data);
    }
  }

  return { code: 200, message: '同步完成', data: created };
};

export const submitChangeRequest = async (
  orderId: string,
  data: { type: 'reschedule' | 'cancel'; newScheduledTime?: string; reason: string }
): Promise<ApiResponse<Order>> => {
  await delay(500);

  const index = orders.findIndex((o) => o.id === orderId);
  if (index === -1) {
    throw new Error('订单不存在');
  }

  const changeRequest: OrderChangeRequest = {
    id: generateId(),
    type: data.type,
    status: 'pending',
    originalScheduledTime: orders[index].scheduledTime,
    newScheduledTime: data.newScheduledTime,
    reason: data.reason,
    createdAt: new Date().toISOString(),
  };

  orders[index] = {
    ...orders[index],
    changeRequest,
    updatedAt: new Date().toISOString(),
  };

  return { code: 200, message: '变更申请已提交', data: orders[index] };
};

export const processChangeRequest = async (
  orderId: string,
  approve: boolean,
  processorNote: string = ''
): Promise<ApiResponse<Order>> => {
  await delay(300);

  const index = orders.findIndex((o) => o.id === orderId);
  if (index === -1 || !orders[index].changeRequest) {
    throw new Error('变更申请不存在');
  }

  const cr = orders[index].changeRequest!;
  const now = new Date().toISOString();

  if (approve) {
    if (cr.type === 'cancel') {
      orders[index] = {
        ...orders[index],
        status: 'cancelled',
        scheduledTime: cr.newScheduledTime || orders[index].scheduledTime,
        changeRequest: { ...cr, status: 'approved', processedAt: now, processorNote },
        updatedAt: now,
      };
    } else {
      orders[index] = {
        ...orders[index],
        scheduledTime: cr.newScheduledTime || orders[index].scheduledTime,
        changeRequest: { ...cr, status: 'approved', processedAt: now, processorNote },
        updatedAt: now,
      };
    }
  } else {
    orders[index] = {
      ...orders[index],
      changeRequest: { ...cr, status: 'rejected', processedAt: now, processorNote },
      updatedAt: now,
    };
  }

  return { code: 200, message: approve ? '变更已批准' : '变更已拒绝', data: orders[index] };
};

export const addReviewFollowUp = async (
  reviewId: string,
  data: { action: ReviewFollowUpAction; content: string; operatorId: string; operatorName: string }
): Promise<ApiResponse<ReviewFollowUp>> => {
  await delay(300);

  const followUp: ReviewFollowUp = {
    id: generateId(),
    action: data.action,
    content: data.content,
    createdAt: new Date().toISOString(),
    operatorId: data.operatorId,
    operatorName: data.operatorName,
  };

  const index = orders.findIndex((o) => o.review?.id === reviewId);
  if (index !== -1 && orders[index].review) {
    const existingFollowUps = orders[index].review!.followUps || [];
    orders[index] = {
      ...orders[index],
      review: {
        ...orders[index].review!,
        followUps: [...existingFollowUps, followUp],
      },
      updatedAt: new Date().toISOString(),
    };
  }

  return { code: 200, message: '记录已添加', data: followUp };
};

