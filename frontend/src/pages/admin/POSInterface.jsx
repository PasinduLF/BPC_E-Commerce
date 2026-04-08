import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../context/useAuthStore';
import { Search, Plus, Minus, Trash2, ShoppingBag, CreditCard, Banknote, UserRound, Phone, Printer, XCircle, FileDown } from 'lucide-react';
import { useConfigStore } from '../../context/useConfigStore';

const POSInterface = () => {
    const { userInfo } = useAuthStore();
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    // Cart State
    const [cartItems, setCartItems] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [selectedProductForVariant, setSelectedProductForVariant] = useState(null);

    // New POS Fields
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [cashGiven, setCashGiven] = useState('');
    const [discountType, setDiscountType] = useState('none');
    const [discountValue, setDiscountValue] = useState('');
    const [receiptData, setReceiptData] = useState(null);

    const { config } = useConfigStore();
    const currency = config?.currencySymbol || '$';

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const { data } = await axios.get('/api/products?keyword=' + search);
                setProducts(data.products || data);
                setLoading(false);
            } catch (error) {
                console.error('Failed to load products', error);
                setLoading(false);
            }
        };
        fetchProducts();
    }, [search]);

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

    const addToCart = (product, variant = null) => {
        const checkStock = variant ? variant.stock : product.stock;
        if (checkStock === 0) {
            alert("Out of stock!");
            return;
        }

        const cartId = variant ? `${product._id}-${variant._id}` : product._id;
        const existItem = cartItems.find((x) => x.cartId === cartId);

        if (existItem) {
            if (existItem.qty >= checkStock) {
                alert("Reached maximum stock limit.");
                return;
            }
            setCartItems(cartItems.map((x) => x.cartId === cartId ? { ...existItem, qty: existItem.qty + 1 } : x));
        } else {
            setCartItems([...cartItems, {
                cartId,
                product: product._id,
                name: product.name,
                image: product.images[0]?.url || '',
                price: getEffectivePrice(product, variant),
                qty: 1,
                stock: checkStock,
                variantId: variant ? variant._id : undefined,
                variantName: variant ? `${variant.name}: ${variant.value}` : undefined
            }]);
        }

        setSelectedProductForVariant(null);
    };

    const handleProductClick = (product) => {
        if (product.variants && product.variants.length > 0) {
            setSelectedProductForVariant(product);
        } else {
            addToCart(product);
        }
    };

    const removeFromCart = (id) => {
        setCartItems(cartItems.filter(x => x.cartId !== id));
    };

    const updateQty = (id, newQty) => {
        if (newQty < 1) return;
        const item = cartItems.find(x => x.cartId === id);
        if (newQty > item.stock) {
            alert("Cannot exceed available stock.");
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

    // Validation and Submission
    const placeOrderHandler = async () => {
        if (paymentMethod === 'Cash') {
            const cash = parseFloat(cashGiven) || 0;
            if (cash < totalDue) {
                alert(`Insufficient cash. Due: ${currency}${totalDue.toFixed(2)}, Given: ${currency}${cash.toFixed(2)}`);
                return;
            }
        }

        if (window.confirm(`Process ${paymentMethod} payment of ${currency}${totalDue.toFixed(2)}?`)) {
            try {
                const configHeader = { headers: { Authorization: `Bearer ${userInfo.token}` } };

                const cash = paymentMethod === 'Cash' ? (parseFloat(cashGiven) || 0) : 0;
                const change = paymentMethod === 'Cash' ? (cash - totalDue) : 0;

                const { data } = await axios.post('/api/pos', {
                    orderItems: cartItems.map(x => ({
                        name: x.name,
                        qty: x.qty,
                        image: x.image,
                        price: x.price,
                        product: x.product,
                        variantId: x.variantId,
                        variantName: x.variantName
                    })),
                    paymentMethod,
                    itemsPrice,
                    totalPrice: totalDue,
                    discountType,
                    discountValue: parsedDiscountValue,
                    customerName: customerName.trim(),
                    customerPhone: customerPhone.trim(),
                    cashGiven: cash,
                    changeDue: change
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
                setDiscountType('none');
                setDiscountValue('');
                // Refetch products to update stock numbers visually
                setSearch('');

            } catch (error) {
                alert(error.response?.data?.message || 'Failed to process POS order');
            }
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
            alert('Unable to open print window. Please allow popups for this site.');
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
                <div className="p-4 border-b border-default flex items-center justify-between bg-page relative">
                    <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                        <ShoppingBag size={20} className="text-brand" /> Walk-in Catalog
                    </h2>
                    <div className="relative w-64">
                        <input
                            type="text" placeholder="Search physical stock..."
                            value={search} onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-default rounded-lg text-sm bg-page text-primary input-focus"
                        />
                        <Search size={16} className="absolute left-3 top-2.5 text-tertiary" />
                    </div>
                </div>

                <div className="flex-1 p-4 overflow-y-auto bg-page">
                    {loading ? (
                        <div className="text-center py-10 text-secondary">Loading products...</div>
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
                                                <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
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
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
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
                                                    <Minus size={14} />
                                                </button>
                                                <span className="text-sm font-bold w-6 text-center">{item.qty}</span>
                                                <button onClick={() => updateQty(item.cartId, item.qty + 1)} className="p-1 px-2 text-secondary hover:text-brand transition-colors">
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                            <button onClick={() => removeFromCart(item.cartId)} className="text-tertiary hover:text-error p-1 transition-colors">
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

                    {/* Customer Info (Optional) */}
                    <div className="space-y-3 pb-3 border-b border-default border-dashed">
                        <label className="block text-xs font-bold text-secondary uppercase tracking-wider">Customer Details (Optional)</label>
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
                                    type="text" placeholder="Phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 border border-default rounded-lg text-sm bg-surface text-primary input-focus"
                                />
                            </div>
                        </div>
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
                        </div>
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

                        {paymentMethod === 'Cash' && (
                            <>
                                <div className="flex justify-between items-center text-secondary text-sm">
                                    <span className="font-medium">Cash Given</span>
                                    <div className="relative w-24">
                                        <span className="absolute left-2 top-1 text-tertiary">{currency}</span>
                                        <input
                                            type="number" min="0" step="0.01" value={cashGiven}
                                            onChange={(e) => setCashGiven(e.target.value)}
                                            className="w-full pl-6 pr-2 py-1 text-right border border-success-bg bg-success-bg rounded-md font-bold text-success outline-none input-focus"
                                        />
                                    </div>
                                </div>

                                {cashGiven && (parseFloat(cashGiven) >= totalDue) && (
                                    <div className="flex justify-between items-center text-secondary text-sm pt-2 border-t border-default border-dashed">
                                        <span className="font-bold text-success">Change Due</span>
                                        <span className="font-bold text-success">{currency}{(parseFloat(cashGiven) - totalDue).toFixed(2)}</span>
                                    </div>
                                )}
                            </>
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
                        onClick={placeOrderHandler}
                        disabled={cartItems.length === 0}
                        className="btn-primary w-full py-4 mt-2 text-white rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md font-bold text-lg tracking-wide"
                    >
                        Charge {currency}{totalDue.toFixed(2)}
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
                                    onClick={() => addToCart(selectedProductForVariant, variant)}
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
                                <button onClick={handlePrintInvoice} className="p-2 text-secondary hover:bg-surface rounded-lg transition-colors" title="Print Invoice">
                                    <Printer size={18} />
                                </button>
                                <button onClick={() => setReceiptData(null)} className="p-2 text-error hover:bg-error-bg rounded-lg transition-colors" title="Close">
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
                                        <span className="text-tertiary font-medium">{receiptData.currency}{receiptData.paymentMethod === 'Cash' ? receiptData.cashGiven.toFixed(2) : receiptData.totalPrice.toFixed(2)}</span>
                                    </div>
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
