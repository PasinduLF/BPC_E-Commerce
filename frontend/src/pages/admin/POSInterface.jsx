import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../context/useAuthStore';
import { Search, Plus, Minus, Trash2, ShoppingBag, CreditCard, Banknote, UserRound, Phone, Printer, XCircle, FileDown } from 'lucide-react';
import { useConfigStore } from '../../context/useConfigStore';
import { toast } from 'sonner';
import StatusLegend from '../../components/admin/StatusLegend';

const POSInterface = () => {
    const FALLBACK_PRODUCT_IMAGE = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%20200%20200%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22%23f5f5f4%22/%3E%3Cpath%20d%3D%22M0%20140h200v60H0z%22%20fill%3D%22%23e7e5e4%22/%3E%3Ccircle%20cx%3D%2268%22%20cy%3D%2275%22%20r%3D%2214%22%20fill%3D%22%23d6d3d1%22/%3E%3Cpath%20d%3D%22M44%20150l30-34%2022%2026%2020-22%2036%2034H44z%22%20fill%3D%22%23d6d3d1%22/%3E%3C/svg%3E';

    const getProductImageUrl = (product) => {
        const imageUrl = product?.images?.[0]?.url;
        return !imageUrl || imageUrl.includes('via.placeholder.com') ? FALLBACK_PRODUCT_IMAGE : imageUrl;
    };

    const { userInfo } = useAuthStore();
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [customItemName, setCustomItemName] = useState('');
    const [customItemPrice, setCustomItemPrice] = useState('');
    const [customItemCost, setCustomItemCost] = useState('');
    const [quickAddQty, setQuickAddQty] = useState(1);
    const [previewModalOpen, setPreviewModalOpen] = useState(false);

    // Cart State
    const [cartItems, setCartItems] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [selectedProductForVariant, setSelectedProductForVariant] = useState(null);

    // New POS Fields
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [cashGiven, setCashGiven] = useState('');
    const [applyCreditAmount, setApplyCreditAmount] = useState('0');
    const [discountType, setDiscountType] = useState('none');
    const [discountValue, setDiscountValue] = useState('');
    const [receiptData, setReceiptData] = useState(null);
    const [customerAccount, setCustomerAccount] = useState(null);
    const [loadingAccount, setLoadingAccount] = useState(false);
    const [accountMessage, setAccountMessage] = useState('');
    const [recordPaymentAmount, setRecordPaymentAmount] = useState('');
    const [recordingPayment, setRecordingPayment] = useState(false);

    const { config } = useConfigStore();
    const currency = config?.currencySymbol || '$';

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const pageSize = 48;
                const keyword = encodeURIComponent(search || '');

                const firstResponse = await axios.get(`/api/products?keyword=${keyword}&pageSize=${pageSize}&pageNumber=1`);
                const firstPageProducts = firstResponse.data?.products || [];
                const totalPages = Number(firstResponse.data?.pages || 1);

                if (totalPages <= 1) {
                    setProducts(firstPageProducts);
                    return;
                }

                const pageRequests = [];
                for (let currentPage = 2; currentPage <= totalPages; currentPage += 1) {
                    pageRequests.push(
                        axios.get(`/api/products?keyword=${keyword}&pageSize=${pageSize}&pageNumber=${currentPage}`)
                    );
                }

                const remainingResponses = await Promise.all(pageRequests);
                const remainingProducts = remainingResponses.flatMap((response) => response.data?.products || []);

                setProducts([...firstPageProducts, ...remainingProducts]);
            } catch (error) {
                console.error('Failed to load products', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [search]);

    const loadCustomerAccount = async (phoneInput = customerPhone) => {
        const phone = String(phoneInput || '').trim();
        if (!phone) {
            setCustomerAccount(null);
            setAccountMessage('');
            return;
        }

        setLoadingAccount(true);
        setAccountMessage('');
        try {
            const configHeader = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            const { data } = await axios.get(`/api/pos/customer-account?phone=${encodeURIComponent(phone)}`, configHeader);
            setCustomerAccount(data);
            if (!data) {
                setAccountMessage('No existing account found for this phone. A new account will be created on first credit transaction.');
                return;
            }

            setCustomerName(data.customerName || phoneInput || '');
            setApplyCreditAmount(String(Number(data.creditBalance || 0).toFixed(2)));
            setAccountMessage('Customer account loaded. Name and available credit have been filled automatically.');
        } catch (error) {
            setAccountMessage(error.response?.data?.message || 'Failed to load customer account');
            setCustomerAccount(null);
        } finally {
            setLoadingAccount(false);
        }
    };

    const recordCustomerPayment = async () => {
        const name = customerName.trim();
        const phone = customerPhone.trim();
        const amount = Math.max(Number(recordPaymentAmount) || 0, 0);

        if (!name || !phone) {
            toast.error('Customer name and phone are required to record a payment.');
            return;
        }
        if (amount <= 0) {
            toast.error('Enter a payment amount greater than zero.');
            return;
        }

        setRecordingPayment(true);
        try {
            const configHeader = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            const { data } = await axios.post('/api/pos/customer-account/payment', {
                customerName: name,
                customerPhone: phone,
                amount,
                paymentMethod: paymentMethod === 'Credit' ? 'Cash' : paymentMethod,
                note: 'Recorded from POS credit manager',
            }, configHeader);

            setCustomerAccount(data);
            setRecordPaymentAmount('');
            setAccountMessage('Payment recorded successfully.');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to record payment');
        } finally {
            setRecordingPayment(false);
        }
    };

    const getEffectivePrice = (product, variant = null) => {
        if (variant) {
            const variantDiscount = Number(variant.discountPrice || 0);
            const variantBase = Number(variant.price || 0);
            return variantDiscount > 0 && variantDiscount < variantBase ? variantDiscount : variantBase;
        }

        const baseDiscount = Number(product.discountPrice || 0);
        const basePrice = Number(product.price || 0);
        return baseDiscount > 0 && baseDiscount < basePrice ? baseDiscount : basePrice;
    };

    const addToCart = (product, variant = null, qtyToAdd = 1) => {
        const safeQtyToAdd = Math.max(Number(qtyToAdd) || 1, 1);
        const checkStock = variant ? variant.stock : product.stock;
        if (checkStock === 0) {
            toast.error('Out of stock!');
            return;
        }

        const cartId = variant ? `${product._id}-${variant._id}` : product._id;
        const existItem = cartItems.find((x) => x.cartId === cartId);

        if (existItem) {
            if (existItem.qty + safeQtyToAdd > checkStock) {
                toast.error('Reached maximum stock limit.');
                return;
            }
            setCartItems(cartItems.map((x) => x.cartId === cartId ? { ...existItem, qty: existItem.qty + safeQtyToAdd } : x));
        } else {
            setCartItems([...cartItems, {
                cartId,
                product: product._id,
                name: product.name,
                image: getProductImageUrl(product),
                price: getEffectivePrice(product, variant),
                costPrice: Number(variant ? (variant.costPrice ?? product.costPrice ?? 0) : (product.costPrice ?? 0)),
                qty: Math.min(safeQtyToAdd, checkStock),
                stock: checkStock,
                variantId: variant ? variant._id : undefined,
                variantName: variant ? `${variant.name}: ${variant.value}` : undefined
            }]);
        }

        setSelectedProductForVariant(null);
    };

    const addCustomItemToCart = () => {
        const name = String(customItemName || '').trim();
        const price = Number(customItemPrice);
        const costPrice = Number(customItemCost || customItemPrice || 0);

        if (!name) {
            toast.error('Custom product name is required');
            return;
        }

        if (!Number.isFinite(price) || price < 0) {
            toast.error('Enter a valid custom product price');
            return;
        }

        const cartId = `custom-${Date.now()}`;
        setCartItems([
            ...cartItems,
            {
                cartId,
                product: undefined,
                name,
                image: '',
                price,
                costPrice: Number.isFinite(costPrice) && costPrice >= 0 ? costPrice : price,
                qty: 1,
                stock: 99999,
                variantId: undefined,
                variantName: undefined,
            },
        ]);

        setCustomItemName('');
        setCustomItemPrice('');
        setCustomItemCost('');
    };

    const handleProductClick = (product) => {
        if (product.variants && product.variants.length > 0) {
            setSelectedProductForVariant(product);
        } else {
            addToCart(product, null, quickAddQty);
        }
    };

    const removeFromCart = (id) => {
        setCartItems(cartItems.filter(x => x.cartId !== id));
    };

    const updateQty = (id, newQty) => {
        if (newQty < 1) return;
        const item = cartItems.find(x => x.cartId === id);
        if (newQty > item.stock) {
            toast.error('Cannot exceed available stock.');
            return;
        }
        setCartItems(cartItems.map(x => x.cartId === id ? { ...x, qty: newQty } : x));
    };

    const itemsPrice = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);

    const parsedDiscountValue = Math.max(Number(discountValue) || 0, 0);
    const rawDiscount = discountType === 'percentage'
        ? itemsPrice * (parsedDiscountValue / 100)
        : discountType === 'fixed'
            ? parsedDiscountValue
            : 0;
    const discountAmount = Math.min(rawDiscount, itemsPrice);
    const totalDue = Math.max(itemsPrice - discountAmount, 0);
    const currentCreditBalance = Number(customerAccount?.creditBalance || 0);
    const currentOutstandingBalance = Number(customerAccount?.outstandingBalance || 0);
    const requestedApplyCredit = Math.max(Number(applyCreditAmount) || 0, 0);
    const appliedCredit = Math.min(requestedApplyCredit, currentCreditBalance, totalDue);
    const dueAfterCredit = Math.max(totalDue - appliedCredit, 0);
    const paidNowAmount = Math.max(Number(cashGiven) || 0, 0);
    const outstandingToAdd = Math.max(dueAfterCredit - paidNowAmount, 0);
    const advanceToAdd = Math.max(paidNowAmount - dueAfterCredit, 0);

    // Validation and Submission
    const placeOrderHandler = async () => {
        const trimmedName = customerName.trim();
        const trimmedPhone = customerPhone.trim();
        const usingCreditFlow = paymentMethod === 'Credit' || appliedCredit > 0 || paidNowAmount !== dueAfterCredit;

        if (usingCreditFlow && (!trimmedName || !trimmedPhone)) {
            toast.error('Customer name and phone are required for credit and advance-balance operations.');
            return;
        }

        if (paymentMethod === 'Cash' && paymentMethod !== 'Credit' && !usingCreditFlow && paidNowAmount < dueAfterCredit) {
            toast.error(`Insufficient cash. Due: ${currency}${dueAfterCredit.toFixed(2)}, Given: ${currency}${paidNowAmount.toFixed(2)}`);
            return;
        }

        try {
            const configHeader = { headers: { Authorization: `Bearer ${userInfo.token}` } };

            const { data } = await axios.post('/api/pos', {
                orderItems: cartItems.map(x => ({
                    name: x.name,
                    qty: x.qty,
                    image: x.image,
                    price: x.price,
                    product: x.product,
                    costPrice: x.costPrice,
                    variantId: x.variantId,
                    variantName: x.variantName
                })),
                paymentMethod,
                itemsPrice,
                totalPrice: totalDue,
                discountType,
                discountValue: parsedDiscountValue,
                customerName: trimmedName,
                customerPhone: trimmedPhone,
                cashGiven: paidNowAmount,
                applyCreditAmount: appliedCredit,
            }, configHeader);

            // Set receipt data from response
            setReceiptData({
                ...data,
                businessName: config?.businessName || 'Beauty P&C',
                contactPhone: config?.contactPhone || '',
                contactEmail: config?.contactEmail || '',
                currency
            });

            setCartItems([]);
            setCustomerName('');
            setCustomerPhone('');
            setCashGiven('');
            setApplyCreditAmount('0');
            setCustomerAccount(null);
            setRecordPaymentAmount('');
            setDiscountType('none');
            setDiscountValue('');
            setPreviewModalOpen(false);
            // Refetch products to update stock numbers visually
            setSearch('');
            toast.success('POS order processed successfully.');

        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to process POS order');
        }
    };

    const handlePrintInvoice = () => {
        const receiptElement = document.getElementById('receipt-print-area');
        if (!receiptElement) {
            window.print();
            return;
        }

        const printWindow = window.open('', '_blank', 'width=420,height=760');
        if (!printWindow) {
            toast.error('Unable to open print window. Please allow popups for this site.');
            return;
        }

        printWindow.document.write(`
            <html>
                <head>
                    <title>POS Invoice</title>
                    <style>
                        body { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: #111827; padding: 16px; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { font-size: 12px; padding: 6px 0; }
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

    const handleDownloadPdf = async () => {
        const receiptElement = document.getElementById('receipt-print-area');
        if (!receiptElement) return;

        const { default: html2pdf } = await import('html2pdf.js');

        const filename = `pos-invoice-${receiptData?.orderNumber || (receiptData?._id ? `ORD-${receiptData._id.slice(-6).toUpperCase()}` : 'receipt')}.pdf`;
        const receiptWidthMm = 80;
        const receiptHeightMm = Math.max(
            (receiptElement.scrollHeight / receiptElement.offsetWidth) * receiptWidthMm,
            120
        );

        html2pdf()
            .set({
                margin: 0,
                filename,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: [receiptWidthMm, Math.max(receiptHeightMm, 240)], orientation: 'portrait' },
                pagebreak: { mode: ['css', 'legacy', 'avoid-all'] },
            })
            .from(receiptElement)
            .save();
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">

            {/* Product Catalog Side */}
            <div className="flex-1 flex flex-col bg-surface rounded-2xl shadow-sm border border-default overflow-hidden">
                <div className="p-4 border-b border-default flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-page relative">
                    <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                        <ShoppingBag size={20} className="text-brand" /> Walk-in Catalog
                    </h2>
                    <div className="relative w-full sm:w-64">
                        <input
                            type="text" placeholder="Search physical stock..."
                            value={search} onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-default rounded-lg text-sm bg-page text-primary input-focus"
                        />
                        <Search size={16} className="absolute left-3 top-2.5 text-tertiary" />
                    </div>
                </div>

                <div className="px-4 py-3 border-b border-default bg-surface">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <input
                            type="text"
                            value={customItemName}
                            onChange={(e) => setCustomItemName(e.target.value)}
                            placeholder="Custom product name"
                            className="px-3 py-2 border border-default rounded-lg text-sm bg-page text-primary input-focus"
                        />
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={customItemPrice}
                            onChange={(e) => setCustomItemPrice(e.target.value)}
                            placeholder={`Sell price (${currency})`}
                            className="px-3 py-2 border border-default rounded-lg text-sm bg-page text-primary input-focus"
                        />
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={customItemCost}
                            onChange={(e) => setCustomItemCost(e.target.value)}
                            placeholder={`Cost (${currency}) optional`}
                            className="px-3 py-2 border border-default rounded-lg text-sm bg-page text-primary input-focus"
                        />
                        <button
                            type="button"
                            onClick={addCustomItemToCart}
                            className="btn-primary py-2 rounded-lg text-sm font-semibold"
                        >
                            Add Custom Product
                        </button>
                    </div>
                    <div className="mt-3 flex items-center flex-wrap gap-2">
                        <span className="text-xs text-secondary font-bold uppercase tracking-wide">Quick Qty</span>
                        {[1, 2, 3, 4, 5, 10].map((qtyValue) => (
                            <button
                                key={qtyValue}
                                type="button"
                                onClick={() => setQuickAddQty(qtyValue)}
                                className={`px-2.5 py-1 text-xs rounded-lg border ${quickAddQty === qtyValue ? 'bg-brand-subtle border-brand text-brand' : 'bg-page border-default text-secondary hover:border-brand hover:text-brand'}`}
                            >
                                {qtyValue}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="px-4 py-3 border-b border-default bg-surface">
                    <StatusLegend />
                </div>

                <div className="flex-1 p-4 overflow-y-auto bg-page">
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                            {Array.from({ length: 8 }).map((_, idx) => (
                                <div key={idx} className="bg-surface p-4 rounded-xl border border-default space-y-2">
                                    <div className="skeleton aspect-square rounded-lg" />
                                    <div className="skeleton h-4 w-3/4" />
                                    <div className="skeleton h-4 w-1/3" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                            {products.map(product => {
                                const totalStock = (product.variants && product.variants.length > 0)
                                    ? product.variants.reduce((sum, v) => sum + v.stock, 0)
                                    : product.stock;
                                const displayPrice = (product.variants && product.variants.length > 0)
                                    ? Math.min(...product.variants.map((v) => getEffectivePrice(product, v)))
                                    : getEffectivePrice(product);
                                return (
                                    <div
                                        key={product._id}
                                        onClick={() => handleProductClick(product)}
                                        className={`bg-surface p-4 rounded-xl shadow-sm border ${totalStock > 0 ? 'border-default cursor-pointer hover:border-brand hover:shadow-md transition-all' : 'border-error-bg opacity-60 cursor-not-allowed'}`}
                                    >
                                        <div className="aspect-square bg-page rounded-lg mb-3 overflow-hidden">
                                            {product.images[0] ? (
                                                <img src={getProductImageUrl(product)} alt={product.name || 'Product image'} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs text-tertiary">No Img</div>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-primary text-sm leading-snug break-words">{product.name}</h3>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-brand font-bold text-sm">
                                                {(product.variants && product.variants.length > 0) ? 'From ' : ''}{currency}{displayPrice.toFixed(2)}
                                            </span>
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${totalStock > 0 ? 'bg-success-bg text-success' : 'bg-error-bg text-error'}`}>
                                                {totalStock > 0 ? `Qty: ${totalStock}` : 'Out'}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Cart Side */}
            <div className="w-full lg:w-[400px] flex flex-col bg-surface rounded-2xl shadow-sm border border-default overflow-hidden flex-shrink-0">
                <div className="p-4 border-b border-default bg-brand-subtle text-brand">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        Current Ticket
                    </h2>
                </div>

                <div className="flex-1 p-4 overflow-y-auto">
                    {cartItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-tertiary">
                            <ShoppingBag size={48} className="mb-4 text-tertiary opacity-50" />
                            <p>Ticket is empty. Add products from the catalog.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cartItems.map((item) => (
                                <div key={item.cartId} className="flex gap-3 pb-4 border-b border-default last:border-0">
                                    <div className="w-16 h-16 rounded-md bg-page flex-shrink-0 overflow-hidden">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[10px] text-tertiary">Custom</div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-primary text-sm line-clamp-1">{item.name}</h4>
                                        {item.variantName && (
                                            <div className="text-[10px] uppercase font-bold text-brand tracking-wider">
                                                {item.variantName}
                                            </div>
                                        )}
                                        <div className="text-brand font-medium text-sm mb-2 mt-0.5">{currency}{item.price.toFixed(2)}</div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center bg-page border border-default rounded-lg text-primary">
                                                <button onClick={() => updateQty(item.cartId, item.qty - 1)} className="p-1 px-2 text-secondary hover:text-brand transition-colors">
                                                    <span className="sr-only">Decrease quantity</span>
                                                    <Minus size={14} />
                                                </button>
                                                <span className="text-sm font-bold w-6 text-center">{item.qty}</span>
                                                <button onClick={() => updateQty(item.cartId, item.qty + 1)} className="p-1 px-2 text-secondary hover:text-brand transition-colors">
                                                    <span className="sr-only">Increase quantity</span>
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                            <button onClick={() => removeFromCart(item.cartId)} aria-label={`Remove ${item.name} from cart`} className="touch-target text-tertiary hover:text-error p-1 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Checkout Actions */}
                <div className="p-4 sm:p-5 border-t border-default bg-page flex flex-col gap-4 overflow-y-auto max-h-[50vh]">

                    {/* Customer Info */}
                    <div className="space-y-3 pb-3 border-b border-default border-dashed">
                        <label className="block text-xs font-bold text-secondary uppercase tracking-wider">Customer Details</label>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="relative">
                                <UserRound size={14} className="absolute left-3 top-2.5 text-tertiary" />
                                <input
                                    type="text" placeholder="Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 border border-default rounded-lg text-sm bg-surface text-primary input-focus"
                                />
                            </div>
                            <div className="relative">
                                <Phone size={14} className="absolute left-3 top-2.5 text-tertiary" />
                                <input
                                    type="text" placeholder="Phone" value={customerPhone} onChange={(e) => { setCustomerPhone(e.target.value); setCustomerAccount(null); setAccountMessage(''); }} onBlur={() => customerPhone.trim() && loadCustomerAccount(customerPhone)}
                                    className="w-full pl-8 pr-3 py-2 border border-default rounded-lg text-sm bg-surface text-primary input-focus"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 items-center">
                            <button
                                type="button"
                                onClick={() => loadCustomerAccount()}
                                disabled={!customerPhone.trim() || loadingAccount}
                                className="text-xs px-3 py-1.5 rounded-lg border border-default bg-surface hover:bg-page text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loadingAccount ? 'Checking...' : 'Check Credit Account'}
                            </button>
                            {accountMessage && <span className="text-[11px] text-secondary">{accountMessage}</span>}
                        </div>

                        {customerAccount && (
                            <div className="bg-page border border-default rounded-lg p-3 text-xs text-secondary space-y-1">
                                <p><span className="font-semibold text-primary">Account:</span> {customerAccount.customerName} ({customerAccount.customerPhone})</p>
                                <p><span className="font-semibold text-success">Credit Balance:</span> {currency}{Number(customerAccount.creditBalance || 0).toFixed(2)}</p>
                                <p><span className="font-semibold text-warning">Outstanding Balance:</span> {currency}{Number(customerAccount.outstandingBalance || 0).toFixed(2)}</p>
                            </div>
                        )}
                    </div>

                    {/* Payment Settings */}
                    <div className="space-y-3">
                        <label className="block text-xs font-bold text-secondary uppercase tracking-wider">Payment Method</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => { setPaymentMethod('Cash'); setCashGiven(''); }}
                                className={`flex items-center justify-center gap-2 py-2 px-4 rounded-xl border transition-all text-sm font-medium ${paymentMethod === 'Cash' ? 'bg-success-bg border-success text-success shadow-sm' : 'bg-surface border-default text-secondary hover:bg-page'}`}
                            >
                                <Banknote size={16} /> Cash
                            </button>
                            <button
                                onClick={() => setPaymentMethod('Bank Transfer')}
                                className={`flex items-center justify-center gap-2 py-2 px-4 rounded-xl border transition-all text-sm font-medium ${paymentMethod === 'Bank Transfer' ? 'bg-brand-subtle border-brand text-brand shadow-sm' : 'bg-surface border-default text-secondary hover:bg-page'}`}
                            >
                                <CreditCard size={16} /> Bank
                            </button>
                            <button
                                onClick={() => setPaymentMethod('Credit')}
                                className={`col-span-2 flex items-center justify-center gap-2 py-2 px-4 rounded-xl border transition-all text-sm font-medium ${paymentMethod === 'Credit' ? 'bg-warning-bg border-warning text-warning shadow-sm' : 'bg-surface border-default text-secondary hover:bg-page'}`}
                            >
                                <CreditCard size={16} /> Credit Sale (Pay Later)
                            </button>
                        </div>
                    </div>

                    {/* Credit Usage Controls */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-secondary uppercase tracking-wider">Use Existing Customer Credit</label>
                        <div className="relative">
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={applyCreditAmount}
                                onChange={(e) => setApplyCreditAmount(e.target.value)}
                                className="w-full px-3 py-2 border border-default rounded-lg text-sm bg-surface text-primary input-focus"
                                placeholder="0.00"
                            />
                            <span className="absolute right-3 top-2 text-xs text-tertiary">{currency}</span>
                        </div>
                        <p className="text-[11px] text-tertiary">Available credit: {currency}{currentCreditBalance.toFixed(2)} | Applied: {currency}{appliedCredit.toFixed(2)}</p>
                    </div>

                    {/* Discount Controls */}
                    <div className="space-y-3 pt-1">
                        <label className="block text-xs font-bold text-secondary uppercase tracking-wider">Discount</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => { setDiscountType('none'); setDiscountValue(''); }}
                                className={`py-2 px-3 rounded-lg border text-xs font-bold transition-colors ${discountType === 'none' ? 'bg-brand-subtle border-brand text-brand' : 'bg-surface border-default text-secondary hover:bg-page'}`}
                            >
                                None
                            </button>
                            <button
                                onClick={() => setDiscountType('percentage')}
                                className={`py-2 px-3 rounded-lg border text-xs font-bold transition-colors ${discountType === 'percentage' ? 'bg-brand-subtle border-brand text-brand' : 'bg-surface border-default text-secondary hover:bg-page'}`}
                            >
                                Percent
                            </button>
                            <button
                                onClick={() => setDiscountType('fixed')}
                                className={`py-2 px-3 rounded-lg border text-xs font-bold transition-colors ${discountType === 'fixed' ? 'bg-brand-subtle border-brand text-brand' : 'bg-surface border-default text-secondary hover:bg-page'}`}
                            >
                                Fixed
                            </button>
                        </div>
                        {discountType !== 'none' && (
                            <div className="relative">
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={discountValue}
                                    onChange={(e) => setDiscountValue(e.target.value)}
                                    placeholder={discountType === 'percentage' ? 'Enter discount %' : 'Enter discount amount'}
                                    className="w-full px-3 py-2 border border-default rounded-lg text-sm bg-surface text-primary input-focus"
                                />
                                <span className="absolute right-3 top-2 text-xs text-tertiary">
                                    {discountType === 'percentage' ? '%' : currency}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Final Totals & Cash Calculation */}
                    <div className="bg-surface rounded-xl border border-default p-4 space-y-3 shadow-sm text-primary">
                        <div className="flex justify-between items-center text-secondary text-sm">
                            <span className="font-medium">Subtotal ({cartItems.reduce((a, c) => a + c.qty, 0)} items)</span>
                            <span className="font-bold text-primary">{currency}{itemsPrice.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between items-center text-secondary text-sm">
                            <span className="font-medium">Applied Credit</span>
                            <span className="font-bold text-info">-{currency}{appliedCredit.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between items-center text-secondary text-sm">
                            <span className="font-medium">Due After Credit</span>
                            <span className="font-bold text-primary">{currency}{dueAfterCredit.toFixed(2)}</span>
                        </div>

                        {(paymentMethod === 'Cash' || paymentMethod === 'Credit') && (
                            <>
                                <div className="flex justify-between items-center text-secondary text-sm">
                                    <span className="font-medium">Paid Now</span>
                                    <div className="relative w-24">
                                        <span className="absolute left-2 top-1 text-tertiary">{currency}</span>
                                        <input
                                            type="number" min="0" step="0.01" value={cashGiven}
                                            onChange={(e) => setCashGiven(e.target.value)}
                                            className="w-full pl-6 pr-2 py-1 text-right border border-success-bg bg-success-bg rounded-md font-bold text-success outline-none input-focus"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {paymentMethod === 'Bank Transfer' && (
                            <div className="flex justify-between items-center text-secondary text-sm">
                                <span className="font-medium">Paid Now (Bank)</span>
                                <span className="font-bold text-primary">{currency}{dueAfterCredit.toFixed(2)}</span>
                            </div>
                        )}

                        <div className="flex justify-between items-center text-secondary text-sm pt-2 border-t border-default border-dashed">
                            <span className="font-bold text-warning">Outstanding To Add</span>
                            <span className="font-bold text-warning">{currency}{outstandingToAdd.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between items-center text-secondary text-sm">
                            <span className="font-bold text-success">Credit To Add</span>
                            <span className="font-bold text-success">{currency}{advanceToAdd.toFixed(2)}</span>
                        </div>

                        {(currentOutstandingBalance > 0 || customerAccount) && (
                            <div className="pt-2 border-t border-default border-dashed space-y-2">
                                <label className="block text-xs font-bold text-secondary uppercase tracking-wider">Record Customer Payment (for previous dues)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="Amount"
                                        value={recordPaymentAmount}
                                        onChange={(e) => setRecordPaymentAmount(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-default rounded-lg text-sm bg-surface text-primary input-focus"
                                    />
                                    <button
                                        type="button"
                                        onClick={recordCustomerPayment}
                                        disabled={recordingPayment || !recordPaymentAmount}
                                        className="px-3 py-2 text-xs rounded-lg border border-default bg-surface hover:bg-page text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {recordingPayment ? 'Saving...' : 'Record'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {discountAmount > 0 && (
                            <div className="flex justify-between items-center text-secondary text-sm">
                                <span className="font-medium">Discount</span>
                                <span className="font-bold text-error">-{currency}{discountAmount.toFixed(2)}</span>
                            </div>
                        )}

                        <div className="flex justify-between items-center text-primary pt-2 border-t border-default">
                            <span className="font-bold text-lg">Total</span>
                            <span className="font-black text-xl text-brand">{currency}{totalDue.toFixed(2)}</span>
                        </div>
                    </div>

                    <button
                        onClick={() => setPreviewModalOpen(true)}
                        disabled={cartItems.length === 0}
                        className="btn-primary w-full py-4 mt-2 text-white rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md font-bold text-lg tracking-wide"
                    >
                        Preview Receipt ({currency}{totalDue.toFixed(2)})
                    </button>
                </div>

            </div>

            {/* Variant Modal */}
            {selectedProductForVariant && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-surface rounded-2xl p-6 shadow-xl max-w-md w-full animate-fade-in-up">
                        <div className="flex justify-between flex-wrap gap-2 mb-4">
                            <h3 className="font-bold text-primary text-lg">Select Option for {selectedProductForVariant.name}</h3>
                        </div>
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                            {selectedProductForVariant.variants.map(variant => (
                                <button
                                    key={variant._id}
                                    onClick={() => addToCart(selectedProductForVariant, variant, quickAddQty)}
                                    disabled={variant.stock === 0}
                                    className={`w-full flex items-center justify-between p-4 border rounded-xl text-left transition-colors ${variant.stock > 0 ? 'border-default hover:border-brand hover:bg-brand-subtle text-primary' : 'border-error-bg bg-error-bg opacity-60 cursor-not-allowed'}`}
                                >
                                    <div>
                                        <div className="font-bold text-primary">{variant.name}: {variant.value}</div>
                                        <div className="text-sm text-secondary mt-1">Available: {variant.stock}</div>
                                    </div>
                                    <div className="font-bold text-brand">
                                        {currency}{getEffectivePrice(selectedProductForVariant, variant).toFixed(2)}
                                    </div>
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setSelectedProductForVariant(null)} className="w-full mt-6 py-3 border border-default text-secondary rounded-xl hover:bg-page font-bold transition-all">Cancel</button>
                    </div>
                </div>
            )}

            {previewModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="px-5 py-4 border-b border-default bg-page flex items-center justify-between">
                            <h3 className="font-bold text-primary">Receipt Preview</h3>
                            <button onClick={() => setPreviewModalOpen(false)} className="text-tertiary hover:text-secondary">
                                <XCircle size={20} />
                            </button>
                        </div>
                        <div className="p-5 space-y-3 text-sm">
                            <div className="flex justify-between"><span className="text-secondary">Customer</span><span className="font-semibold text-primary">{customerName || 'Walk-in'}</span></div>
                            <div className="flex justify-between"><span className="text-secondary">Payment Method</span><span className="font-semibold text-primary">{paymentMethod}</span></div>
                            <div className="flex justify-between"><span className="text-secondary">Items</span><span className="font-semibold text-primary">{cartItems.reduce((a, c) => a + c.qty, 0)}</span></div>
                            <div className="border-t border-default pt-3 space-y-2">
                                <div className="flex justify-between"><span className="text-secondary">Subtotal</span><span>{currency}{itemsPrice.toFixed(2)}</span></div>
                                <div className="flex justify-between"><span className="text-secondary">Discount</span><span>-{currency}{discountAmount.toFixed(2)}</span></div>
                                <div className="flex justify-between"><span className="text-secondary">Applied Credit</span><span>-{currency}{appliedCredit.toFixed(2)}</span></div>
                                <div className="flex justify-between text-base font-bold text-primary"><span>Total</span><span>{currency}{totalDue.toFixed(2)}</span></div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-default bg-page flex gap-2 justify-end">
                            <button onClick={() => setPreviewModalOpen(false)} className="px-4 py-2 rounded-lg border border-default text-secondary hover:text-primary">Cancel</button>
                            <button onClick={placeOrderHandler} className="btn-primary px-4 py-2 rounded-lg">Confirm & Charge</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Printable Receipt Modal */}
            {receiptData && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-surface rounded-2xl shadow-xl max-w-sm w-full animate-fade-in-up overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Receipt Header Actions */}
                        <div className="bg-page p-3 flex justify-between items-center border-b border-default print:hidden">
                            <span className="font-bold text-primary text-sm">Transaction Complete</span>
                            <div className="flex gap-2">
                                <button onClick={handleDownloadPdf} className="p-2 text-secondary hover:bg-surface rounded-lg transition-colors" title="Download PDF">
                                    <FileDown size={18} />
                                </button>
                                <button onClick={handlePrintInvoice} aria-label="Print invoice" className="p-2 text-secondary hover:bg-surface rounded-lg transition-colors" title="Print Invoice">
                                    <Printer size={18} />
                                </button>
                                <button onClick={() => setReceiptData(null)} aria-label="Close receipt" className="p-2 text-error hover:bg-error-bg rounded-lg transition-colors" title="Close">
                                    <XCircle size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Printable Area */}
                        <div className="p-4 overflow-y-auto font-mono text-[11px] leading-tight text-primary" id="receipt-print-area">
                            <div className="text-center mb-4">
                                <div className="flex items-center justify-center mb-2 gap-2">
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-default to-transparent"></div>
                                    <span className="text-[10px] text-tertiary font-medium tracking-wide">✦</span>
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-default to-transparent"></div>
                                </div>
                                <h2 className="text-lg font-bold text-primary uppercase tracking-[0.2em] mb-1">{receiptData.businessName}</h2>
                                <p className="text-[9px] text-tertiary uppercase tracking-[0.12em] font-light mb-2">Official Receipt</p>
                                {(receiptData.contactPhone || receiptData.contactEmail) && (
                                    <p className="text-[9px] text-tertiary mb-3">{receiptData.contactPhone} {receiptData.contactPhone && receiptData.contactEmail && '•'} {receiptData.contactEmail}</p>
                                )}
                                <div className="h-px bg-gradient-to-r from-transparent via-default to-transparent mb-3"></div>
                                <p className="text-[10px] text-secondary">Receipt #{receiptData.orderNumber || `ORD-${receiptData._id.substring(receiptData._id.length - 6).toUpperCase()}`}</p>
                            </div>

                            <div className="border-b border-dashed border-default pb-2 mb-3 text-[10px] text-secondary space-y-0.5">
                                <div className="flex justify-between"><span className="text-tertiary">Date</span> <span className="text-right">{new Date(receiptData.createdAt).toLocaleString()}</span></div>
                                <div className="flex justify-between"><span className="text-tertiary">Cashier</span> <span>{userInfo.name.split(' ')[0]}</span></div>
                                {(receiptData.customerName || receiptData.customerPhone) && (
                                    <div className="flex justify-between"><span className="text-tertiary">Customer</span> <span className="text-right">{receiptData.customerName || 'Walk-in'}{receiptData.customerPhone ? `, ${receiptData.customerPhone}` : ''}</span></div>
                                )}
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
                                    {receiptData.orderItems.map((item, index) => (
                                        <tr key={index}>
                                            <td className="py-1.5 pr-1">
                                                <div className="font-medium">{item.name}{item.variantName && <span className="text-tertiary font-normal text-[9px]"> ({item.variantName})</span>}</div>
                                            </td>
                                            <td className="py-1.5 text-center align-top w-10">{item.qty}</td>
                                            <td className="py-1.5 text-right align-top w-16">{receiptData.currency}{(item.price * item.qty).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="mt-3 pt-2 border-t border-default">
                                <div className="space-y-1 text-[11px] text-secondary mb-2">
                                    <div className="flex justify-between">
                                        <span className="text-tertiary">Subtotal</span>
                                        <span className="text-tertiary">{receiptData.currency}{receiptData.itemsPrice.toFixed(2)}</span>
                                    </div>
                                    {Number(receiptData.discountAmount || 0) > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-warning">Discount ({receiptData.discountType === 'percentage'
                                                ? `${Number(receiptData.discountValue || 0)}%`
                                                : `${receiptData.currency}${Number(receiptData.discountValue || 0).toFixed(2)}`})</span>
                                            <span className="text-warning font-medium">-{receiptData.currency}{Number(receiptData.discountAmount || 0).toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-page bg-opacity-40 rounded px-2 py-1.5 mb-2">
                                    <div className="flex justify-between font-bold text-[13px] text-primary">
                                        <span>TOTAL</span>
                                        <span>{receiptData.currency}{receiptData.totalPrice.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="space-y-1 text-[10px] text-secondary">
                                    <div className="flex justify-between">
                                        <span className="text-tertiary">Tender ({receiptData.paymentMethod})</span>
                                        <span className="text-tertiary font-medium">{receiptData.currency}{Number(receiptData.paidNowAmount || receiptData.cashGiven || 0).toFixed(2)}</span>
                                    </div>
                                    {Number(receiptData.appliedCreditAmount || 0) > 0 && (
                                        <div className="flex justify-between font-semibold text-info">
                                            <span>Credit Used</span>
                                            <span>-{receiptData.currency}{Number(receiptData.appliedCreditAmount || 0).toFixed(2)}</span>
                                        </div>
                                    )}
                                    {Number(receiptData.outstandingAddedAmount || 0) > 0 && (
                                        <div className="flex justify-between font-semibold text-warning">
                                            <span>Outstanding Added</span>
                                            <span>{receiptData.currency}{Number(receiptData.outstandingAddedAmount || 0).toFixed(2)}</span>
                                        </div>
                                    )}
                                    {Number(receiptData.creditAddedAmount || 0) > 0 && (
                                        <div className="flex justify-between font-semibold text-success">
                                            <span>Credit Added</span>
                                            <span>{receiptData.currency}{Number(receiptData.creditAddedAmount || 0).toFixed(2)}</span>
                                        </div>
                                    )}
                                    {receiptData.paymentMethod === 'Cash' && receiptData.changeDue > 0 && (
                                        <div className="flex justify-between font-semibold text-success">
                                            <span>Change Due</span>
                                            <span>{receiptData.currency}{receiptData.changeDue.toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="text-center mt-4 text-[9px] text-secondary space-y-0.5">
                                <p>Thank you for shopping with us!</p>
                                <p className="text-[8px] text-tertiary pt-1">Please note that refunds and exchanges will not be accepted.</p>
                            </div>
                        </div>

                        {/* Print isolation styles - injects CSS strictly for printing this specific modal */}
                        <style dangerouslySetInnerHTML={{
                            __html: `
                            @media print {
                                body > *:not(.fixed) { display: none !important; }
                                .fixed { position: absolute !important; inset: 0 !important; background: white !important; align-items: flex-start !important; padding: 0 !important; }
                                .fixed > div { box-shadow: none !important; max-width: 100% !important; border: none !important; margin: 0 !important; border-radius: 0 !important; }
                                .print\\:hidden { display: none !important; }
                            }
                        `}} />

                        <div className="bg-page p-4 border-t border-default print:hidden justify-center flex">
                            <button onClick={() => setReceiptData(null)} className="btn-primary w-full max-w-[200px] text-center justify-center">Done</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default POSInterface;
