import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../../context/useAuthStore';
import { ShoppingCart, CheckCircle, Clock, XCircle, TrendingUp, Edit, Trash2, Printer, FileDown, ReceiptText } from 'lucide-react';
import { useConfigStore } from '../../context/useConfigStore';

const OrderManage = () => {
    const { userInfo } = useAuthStore();
    const { config } = useConfigStore();
    const currency = config?.currencySymbol || '$';

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoadingKey, setActionLoadingKey] = useState('');

    // Edit Modal State
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState(null);
    const [savingEdit, setSavingEdit] = useState(false);
    const [receiptModalOpen, setReceiptModalOpen] = useState(false);
    const [viewingOrder, setViewingOrder] = useState(null);
    const [editFormData, setEditFormData] = useState({
        customerName: '',
        customerPhone: '',
        cashGiven: 0,
        paymentMethod: 'Cash'
    });

    const isOrderBusy = (id) => actionLoadingKey.endsWith(`-${id}`);

    const fetchOrders = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            const { data } = await axios.get('/api/orders', config);
            setOrders(data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [userInfo.token]);

    const updateOrderStatus = async (id, payload, actionType) => {
        const key = `${actionType}-${id}`;
        setActionLoadingKey(key);
        try {
            const configHeader = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            await axios.put(`/api/orders/${id}/status`, payload, configHeader);
            fetchOrders(); // refresh
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update order status');
        } finally {
            setActionLoadingKey('');
        }
    };

    const updateDeliveryStatus = async (id, isDelivered) => {
        await updateOrderStatus(id, {
            deliveryStatus: isDelivered ? 'processing' : 'delivered'
        }, 'delivery');
    };

    const updatePaymentStatus = async (id, isPaid) => {
        await updateOrderStatus(id, {
            paymentStatus: isPaid ? 'unpaid' : 'paid'
        }, 'payment');
    };

    const deleteHandler = async (id) => {
        if (window.confirm('Are you sure you want to delete this order? For POS orders, stock will be refunded.')) {
            setActionLoadingKey(`delete-${id}`);
            try {
                const configHeader = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                await axios.delete(`/api/orders/${id}`, configHeader);
                fetchOrders();
            } catch (error) {
                alert(error.response?.data?.message || 'Failed to delete order');
            } finally {
                setActionLoadingKey('');
            }
        }
    };

    const openEditModal = (order) => {
        setEditingOrder(order);
        setEditFormData({
            customerName: order.customerName || '',
            customerPhone: order.customerPhone || '',
            cashGiven: order.cashGiven || 0,
            paymentMethod: order.paymentMethod || 'Cash'
        });
        setEditModalOpen(true);
    };

    const openReceiptModal = (order) => {
        setViewingOrder(order);
        setReceiptModalOpen(true);
    };

    const closeReceiptModal = () => {
        setReceiptModalOpen(false);
        setViewingOrder(null);
    };

    const handlePrintReceipt = () => {
        const receiptElement = document.getElementById('pos-receipt-print-area');
        if (!receiptElement) return;

        const printWindow = window.open('', '_blank', 'width=420,height=760');
        if (!printWindow) {
            alert('Unable to open print window. Please allow popups for this site.');
            return;
        }

        printWindow.document.write(`
            <html>
                <head>
                    <title>POS Receipt</title>
                    <style>
                        body { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: #111827; padding: 8px; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { font-size: 10px; padding: 4px 0; }
                        th { text-align: left; border-bottom: 1px solid #d1d5db; }
                        .text-right { text-align: right; }
                        .text-center { text-align: center; }
                    </style>
                </head>
                <body>${receiptElement.innerHTML}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    };

    const handleDownloadReceiptPdf = async () => {
        const receiptElement = document.getElementById('pos-receipt-print-area');
        if (!receiptElement || !viewingOrder) return;

        const { default: html2pdf } = await import('html2pdf.js');
        const receiptWidthMm = 80;
        const receiptHeightMm = Math.max((receiptElement.scrollHeight / receiptElement.offsetWidth) * receiptWidthMm, 120);
        const receiptId = viewingOrder.orderNumber || `ORD-${viewingOrder._id.slice(-6).toUpperCase()}`;

        html2pdf()
            .set({
                margin: 0,
                filename: `pos-receipt-${receiptId}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: [receiptWidthMm, Math.max(receiptHeightMm, 240)], orientation: 'portrait' },
                pagebreak: { mode: ['css', 'legacy', 'avoid-all'] },
            })
            .from(receiptElement)
            .save();
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setSavingEdit(true);
        try {
            const configHeader = { headers: { Authorization: `Bearer ${userInfo.token}` } };

            // Recalculate change if cash
            const change = editFormData.paymentMethod === 'Cash'
                ? (Number(editFormData.cashGiven) - editingOrder.itemsPrice)
                : 0;

            await axios.put(`/api/orders/${editingOrder._id}`, {
                ...editFormData,
                changeDue: change
            }, configHeader);

            setEditModalOpen(false);
            fetchOrders();
            alert('Order updated successfully');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update order');
        } finally {
            setSavingEdit(false);
        }
    };

    return (
        <>
            <div className="space-y-6">

                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-primary">Order Management</h1>
                        <p className="text-secondary text-sm mt-1">Review sales, approve payments, and dispatch items.</p>
                    </div>
                </div>

                <div className="bg-surface rounded-2xl shadow-sm border border-default overflow-hidden text-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-default">
                            <thead className="bg-page">
                                <tr>
                                    <th className="px-6 py-4 text-left font-semibold text-secondary uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-4 text-left font-semibold text-secondary uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-4 text-left font-semibold text-secondary uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-right font-semibold text-secondary uppercase tracking-wider">Total Sales</th>
                                    <th className="px-6 py-4 text-right font-semibold text-secondary uppercase tracking-wider">Est. Profit</th>
                                    <th className="px-6 py-4 text-center font-semibold text-secondary uppercase tracking-wider">Payment</th>
                                    <th className="px-6 py-4 text-center font-semibold text-secondary uppercase tracking-wider">Delivery</th>
                                    <th className="px-6 py-4 text-center font-semibold text-secondary uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-surface divide-y divide-default">
                                {loading ? (
                                    <tr><td colSpan="8" className="text-center py-8 text-secondary">Loading orders...</td></tr>
                                ) : orders.length === 0 ? (
                                    <tr><td colSpan="8" className="text-center py-12 text-secondary">No orders found.</td></tr>
                                ) : (
                                    orders.map(order => {
                                        const isPickupOrder = order.fulfillmentType === 'pickup';
                                        // Calculate profit
                                        const totalCost = order.orderItems.reduce((acc, item) => acc + (item.costPrice * item.qty), 0);
                                        const grossProfit = order.itemsPrice - totalCost;

                                        return (
                                            <tr key={order._id} className="hover:bg-page transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-secondary font-mono text-xs">
                                                    {order.orderNumber || `ORD-${order._id.substring(order._id.length - 6).toUpperCase()}`}
                                                    {order.isPOS && <span className="ml-2 bg-brand-subtle text-brand font-bold px-2 py-0.5 rounded text-[10px]">POS</span>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-medium text-primary">
                                                        {order.isPOS ? (order.customerName || 'Walk-in') : (order.user?.name || 'Unknown')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-secondary">
                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-primary">
                                                    {currency}{order.totalPrice.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <span className={`inline-flex items-center gap-1 font-medium ${grossProfit > 0 ? 'text-success' : 'text-tertiary'}`}>
                                                        {grossProfit > 0 && <TrendingUp size={14} />}
                                                        {currency}{grossProfit.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <span className="text-[11px] font-semibold text-secondary">
                                                            {order.paymentMethod}{isPickupOrder ? ' • Pickup' : ''}
                                                        </span>
                                                        {order.isPaid ? (
                                                            <span className="inline-flex items-center justify-center p-1.5 bg-success-bg text-success rounded-lg" title={order.paidAt ? `Paid on ${new Date(order.paidAt).toLocaleDateString()}` : 'Paid'}>
                                                                <CheckCircle size={18} />
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center justify-center p-1.5 bg-error-bg text-error rounded-lg" title="Awaiting Payment">
                                                                <XCircle size={18} />
                                                            </span>
                                                        )}

                                                        {order.paymentMethod === 'Bank Transfer' && order.paymentSlip?.url && (
                                                            <a
                                                                href={order.paymentSlip.url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-brand hover:underline text-xs font-semibold"
                                                            >
                                                                View Slip
                                                            </a>
                                                        )}

                                                        {(order.paymentMethod === 'Cash on Delivery' || (order.paymentMethod === 'Bank Transfer' && order.paymentSlip?.url)) && (
                                                            <button
                                                                onClick={() => updatePaymentStatus(order._id, order.isPaid)}
                                                                disabled={isOrderBusy(order._id)}
                                                                className={`text-xs px-2 py-1 rounded-lg border transition-colors ${order.isPaid
                                                                    ? 'text-error border-error-bg hover:bg-error-bg'
                                                                    : 'text-success border-success-bg hover:bg-success-bg'} disabled:opacity-60 disabled:cursor-not-allowed`}
                                                            >
                                                                {actionLoadingKey === `payment-${order._id}` ? 'Updating...' : (order.isPaid ? 'Mark Unpaid' : (order.paymentMethod === 'Bank Transfer' ? 'Verify Payment' : 'Mark Paid'))}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        {isPickupOrder ? (
                                                            order.isDelivered ? (
                                                                <span className="inline-flex items-center justify-center p-1.5 bg-success-bg text-success rounded-lg" title="Picked up">
                                                                    <CheckCircle size={18} />
                                                                </span>
                                                            ) : order.isReadyForPickup ? (
                                                                <span className="inline-flex items-center justify-center p-1.5 bg-info-bg text-info rounded-lg" title="Ready for pickup">
                                                                    <Clock size={18} />
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center justify-center p-1.5 bg-warning-bg text-warning rounded-lg" title="Preparing pickup">
                                                                    <Clock size={18} />
                                                                </span>
                                                            )
                                                        ) : (
                                                            order.isDelivered ? (
                                                                <span className="inline-flex items-center justify-center p-1.5 bg-success-bg text-success rounded-lg" title="Delivered">
                                                                    <CheckCircle size={18} />
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center justify-center p-1.5 bg-warning-bg text-warning rounded-lg" title="Processing delivery">
                                                                    <Clock size={18} />
                                                                </span>
                                                            )
                                                        )}

                                                        {isPickupOrder ? (
                                                            <>
                                                                <button
                                                                    onClick={() => updateOrderStatus(order._id, { isReadyForPickup: !order.isReadyForPickup }, 'pickup-ready')}
                                                                    disabled={isOrderBusy(order._id) || order.isDelivered}
                                                                    className={`text-xs px-2 py-1 rounded-lg border transition-colors ${order.isReadyForPickup
                                                                        ? 'text-warning border-warning-bg hover:bg-warning-bg'
                                                                        : 'text-info border-info-bg hover:bg-info-bg'} disabled:opacity-60 disabled:cursor-not-allowed`}
                                                                >
                                                                    {actionLoadingKey === `pickup-ready-${order._id}` ? 'Updating...' : (order.isReadyForPickup ? 'Mark Not Ready' : 'Mark Ready')}
                                                                </button>
                                                                <button
                                                                    onClick={() => updateDeliveryStatus(order._id, order.isDelivered)}
                                                                    disabled={isOrderBusy(order._id) || (!order.isReadyForPickup && !order.isDelivered)}
                                                                    className={`text-xs px-2 py-1 rounded-lg border transition-colors ${order.isDelivered
                                                                        ? 'text-warning border-warning-bg hover:bg-warning-bg'
                                                                        : 'text-success border-success-bg hover:bg-success-bg'} disabled:opacity-60 disabled:cursor-not-allowed`}
                                                                >
                                                                    {actionLoadingKey === `delivery-${order._id}` ? 'Updating...' : (order.isDelivered ? 'Mark Not Picked' : 'Mark Picked Up')}
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                onClick={() => updateDeliveryStatus(order._id, order.isDelivered)}
                                                                disabled={isOrderBusy(order._id)}
                                                                className={`text-xs px-2 py-1 rounded-lg border transition-colors ${order.isDelivered
                                                                    ? 'text-warning border-warning-bg hover:bg-warning-bg'
                                                                    : 'text-success border-success-bg hover:bg-success-bg'} disabled:opacity-60 disabled:cursor-not-allowed`}
                                                            >
                                                                {actionLoadingKey === `delivery-${order._id}` ? 'Updating...' : (order.isDelivered ? 'Mark Processing' : 'Mark Delivered')}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Link to={`/order/${order._id}`} className="text-brand hover:bg-brand-subtle px-2 py-1.5 rounded-lg transition-colors border border-transparent">
                                                            Details
                                                        </Link>

                                                        {order.isPOS && (
                                                            <>
                                                                <button
                                                                    onClick={() => openReceiptModal(order)}
                                                                    className="text-brand hover:bg-brand-subtle p-1.5 rounded-lg transition-colors border border-transparent"
                                                                    title="View POS Receipt"
                                                                >
                                                                    <ReceiptText size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => openEditModal(order)}
                                                                    disabled={isOrderBusy(order._id)}
                                                                    className="text-success hover:bg-success-bg p-1.5 rounded-lg transition-colors border border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
                                                                    title="Edit POS Details"
                                                                >
                                                                    <Edit size={16} />
                                                                </button>
                                                            </>
                                                        )}

                                                        <button
                                                            onClick={() => deleteHandler(order._id)}
                                                            disabled={isOrderBusy(order._id)}
                                                            className="text-error hover:bg-error-bg p-1.5 rounded-lg transition-colors border border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
                                                            title="Delete Order"
                                                        >
                                                            {actionLoadingKey === `delete-${order._id}` ? '...' : <Trash2 size={16} />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* Edit POS Order Modal */}
            {editModalOpen && editingOrder && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
                        <div className="px-6 py-4 border-b border-default flex justify-between items-center bg-page">
                            <h3 className="font-bold text-primary flex items-center gap-2">
                                <Edit size={18} className="text-success" /> Edit POS Order
                            </h3>
                            <button onClick={() => setEditModalOpen(false)} className="text-tertiary hover:text-secondary transition-colors">
                                <XCircle size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">Customer Name</label>
                                <input
                                    type="text"
                                    value={editFormData.customerName}
                                    onChange={(e) => setEditFormData({ ...editFormData, customerName: e.target.value })}
                                    className="w-full px-4 py-2 border border-default rounded-xl input-focus bg-page text-primary outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">Customer Phone</label>
                                <input
                                    type="text"
                                    value={editFormData.customerPhone}
                                    onChange={(e) => setEditFormData({ ...editFormData, customerPhone: e.target.value })}
                                    className="w-full px-4 py-2 border border-default rounded-xl input-focus bg-page text-primary outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Payment Method</label>
                                    <select
                                        value={editFormData.paymentMethod}
                                        onChange={(e) => setEditFormData({ ...editFormData, paymentMethod: e.target.value })}
                                        className="w-full px-4 py-2 border border-default rounded-xl input-focus bg-page text-primary outline-none"
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                    </select>
                                </div>

                                {editFormData.paymentMethod === 'Cash' && (
                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-1">Cash Given</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2 text-tertiary">{currency}</span>
                                            <input
                                                type="number" step="0.01"
                                                value={editFormData.cashGiven}
                                                onChange={(e) => setEditFormData({ ...editFormData, cashGiven: e.target.value })}
                                                className="w-full pl-8 pr-4 py-2 border border-default rounded-xl input-focus bg-page text-primary outline-none"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-default flex justify-end gap-3">
                                <button type="button" onClick={() => setEditModalOpen(false)} disabled={savingEdit} className="px-5 py-2.5 text-secondary bg-page hover:bg-surface border border-default rounded-xl font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                                    Cancel
                                </button>
                                <button type="submit" disabled={savingEdit} className="btn-primary px-5 py-2.5 rounded-xl font-medium shadow-sm disabled:opacity-60 disabled:cursor-not-allowed">
                                    {savingEdit ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* POS Receipt Modal */}
            {receiptModalOpen && viewingOrder && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-surface rounded-2xl shadow-xl max-w-sm w-full overflow-hidden animate-fade-in-up max-h-[90vh] flex flex-col">
                        <div className="bg-page p-3 flex justify-between items-center border-b border-default print:hidden">
                            <span className="font-bold text-primary text-sm">POS Receipt</span>
                            <div className="flex gap-2">
                                <button onClick={handleDownloadReceiptPdf} className="p-2 text-secondary hover:bg-surface rounded-lg transition-colors" title="Download PDF">
                                    <FileDown size={18} />
                                </button>
                                <button onClick={handlePrintReceipt} className="p-2 text-secondary hover:bg-surface rounded-lg transition-colors" title="Print Receipt">
                                    <Printer size={18} />
                                </button>
                                <button onClick={closeReceiptModal} className="p-2 text-error hover:bg-error-bg rounded-lg transition-colors" title="Close">
                                    <XCircle size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="p-4 overflow-y-auto font-mono text-[11px] leading-tight text-primary" id="pos-receipt-print-area">
                            <div className="text-center mb-4">
                                <div className="flex items-center justify-center mb-2 gap-2">
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-default to-transparent"></div>
                                    <span className="text-[10px] text-tertiary font-medium tracking-wide">✦</span>
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-default to-transparent"></div>
                                </div>
                                <h2 className="text-lg font-bold text-primary uppercase tracking-[0.2em] mb-1">{config?.businessName || 'Beauty P&C'}</h2>
                                <p className="text-[9px] text-tertiary uppercase tracking-[0.12em] font-light mb-3">Official Receipt</p>
                                <div className="h-px bg-gradient-to-r from-transparent via-default to-transparent mb-3"></div>
                                <p className="text-[10px] text-secondary">Receipt #{viewingOrder.orderNumber || `ORD-${viewingOrder._id.substring(viewingOrder._id.length - 6).toUpperCase()}`}</p>
                            </div>

                            <div className="mb-3 text-[10px] text-secondary space-y-0.5">
                                <div className="flex justify-between gap-3"><span>Date</span> <span className="text-right">{new Date(viewingOrder.createdAt).toLocaleString()}</span></div>
                                <div className="flex justify-between gap-3"><span>Cashier</span> <span>{userInfo?.name || 'Admin'}</span></div>
                                <div className="flex justify-between gap-3"><span>Customer</span> <span className="text-right">{viewingOrder.customerName || 'Walk-in'}{viewingOrder.customerPhone ? `, ${viewingOrder.customerPhone}` : ''}</span></div>
                            </div>

                            <table className="w-full text-[10px] text-left mb-3 table-auto">
                                <thead>
                                    <tr className="border-b border-default">
                                        <th className="pb-1 font-semibold">Item</th>
                                        <th className="pb-1 font-semibold text-center w-10">Qty</th>
                                        <th className="pb-1 font-semibold text-right w-16">Amt</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-dashed divide-default">
                                    {viewingOrder.orderItems.map((item, index) => (
                                        <tr key={index}>
                                            <td className="py-1.5 pr-1 align-top">
                                                <div className="font-medium">{item.name}{item.variantName && <span className="text-tertiary font-normal text-[9px]"> ({item.variantName})</span>}</div>
                                            </td>
                                            <td className="py-1.5 text-center align-top w-10">{item.qty}</td>
                                            <td className="py-1.5 text-right align-top w-16">{currency}{(item.price * item.qty).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="mt-3 pt-2 border-t border-dashed border-default">
                                <div className="space-y-1 text-[10px] text-secondary mb-3">
                                    <div className="flex justify-between">
                                        <span className="text-tertiary">Subtotal</span>
                                        <span className="text-tertiary">{currency}{Number(viewingOrder.itemsPrice || 0).toFixed(2)}</span>
                                    </div>
                                    {Number(viewingOrder.discountAmount || 0) > 0 && (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-warning">Discount ({viewingOrder.discountType === 'percentage' ? `${Number(viewingOrder.discountValue || 0)}%` : `${currency}${Number(viewingOrder.discountValue || 0).toFixed(2)}`})</span>
                                                <span className="text-warning font-medium">-{currency}{Number(viewingOrder.discountAmount || 0).toFixed(2)}</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="bg-page bg-opacity-40 rounded px-2 py-1.5 mb-2">
                                    <div className="flex justify-between font-bold text-[13px] text-primary">
                                        <span>TOTAL</span>
                                        <span>{currency}{Number(viewingOrder.totalPrice || 0).toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="space-y-1 text-[10px] text-secondary">
                                    <div className="flex justify-between">
                                        <span className="text-tertiary">Tender ({viewingOrder.paymentMethod})</span>
                                        <span className="text-tertiary font-medium">{currency}{Number(viewingOrder.paymentMethod === 'Cash' ? viewingOrder.cashGiven : viewingOrder.totalPrice || 0).toFixed(2)}</span>
                                    </div>
                                    {Number(viewingOrder.changeDue || 0) > 0 && (
                                        <div className="flex justify-between font-semibold text-success">
                                            <span>Change Due</span>
                                            <span>{currency}{Number(viewingOrder.changeDue || 0).toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="text-center mt-4 text-[9px] text-secondary space-y-0.5">
                                <p>Thank you for shopping with us!</p>
                                <p className="text-[8px] text-tertiary pt-1">Please note that refunds and exchanges will not be accepted.</p>
                            </div>
                        </div>

                        <div className="bg-page p-4 border-t border-default print:hidden justify-center flex">
                            <button onClick={closeReceiptModal} className="btn-primary w-full max-w-[200px] text-center justify-center">Done</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default OrderManage;
