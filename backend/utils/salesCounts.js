const Order = require('../models/Order');

const isCompletedSalesOrder = (order) => {
    const status = String(order?.status || '').toLowerCase();
    return status !== 'cancelled' && Boolean(order?.isPaid || order?.isDelivered || order?.isPOS);
};

const normalizeId = (value) => String(value || '');

const loadCompletedOrders = async () => {
    return Order.find({
        status: { $ne: 'Cancelled' },
        $or: [{ isPaid: true }, { isDelivered: true }, { isPOS: true }],
    })
        .select('orderItems isPaid isDelivered isPOS status')
        .lean();
};

const tallyProductSoldCounts = async (productIds = []) => {
    const map = new Map(productIds.map((id) => [normalizeId(id), 0]));
    const idSet = new Set(productIds.map(normalizeId));

    if (idSet.size === 0) {
        return map;
    }

    const orders = await loadCompletedOrders();

    for (const order of orders) {
        if (!isCompletedSalesOrder(order)) continue;

        for (const item of order.orderItems || []) {
            const orderItemQty = Number(item?.qty || 0);
            if (orderItemQty <= 0) continue;

            const directProductId = normalizeId(item?.product);
            if (directProductId && idSet.has(directProductId)) {
                map.set(directProductId, (map.get(directProductId) || 0) + orderItemQty);
            }

            if (item?.isBundle && Array.isArray(item.bundleProducts)) {
                for (const bundleProduct of item.bundleProducts) {
                    const bundleProductId = normalizeId(bundleProduct?.product?._id || bundleProduct?.product);
                    if (!bundleProductId || !idSet.has(bundleProductId)) continue;

                    const componentQty = Number(bundleProduct?.qty || 1) * orderItemQty;
                    map.set(bundleProductId, (map.get(bundleProductId) || 0) + componentQty);
                }
            }
        }
    }

    return map;
};

const tallyBundleSoldCounts = async (bundleIds = []) => {
    const map = new Map(bundleIds.map((id) => [normalizeId(id), 0]));
    const idSet = new Set(bundleIds.map(normalizeId));

    if (idSet.size === 0) {
        return map;
    }

    const orders = await loadCompletedOrders();

    for (const order of orders) {
        if (!isCompletedSalesOrder(order)) continue;

        for (const item of order.orderItems || []) {
            if (!item?.isBundle) continue;

            const bundleId = normalizeId(item.bundle);
            if (!bundleId || !idSet.has(bundleId)) continue;

            const orderItemQty = Number(item?.qty || 0);
            if (orderItemQty <= 0) continue;

            map.set(bundleId, (map.get(bundleId) || 0) + orderItemQty);
        }
    }

    return map;
};

module.exports = {
    tallyProductSoldCounts,
    tallyBundleSoldCounts,
};
