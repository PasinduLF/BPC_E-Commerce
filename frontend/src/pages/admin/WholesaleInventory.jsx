import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../context/useAuthStore';
import { Plus, Package, Truck, Wallet, FileText, Trash2, ShoppingCart } from 'lucide-react';

const WholesaleInventory = () => {
    const { userInfo } = useAuthStore();
    const [purchases, setPurchases] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form State (Invoice level)
    const [showForm, setShowForm] = useState(false);
    const [supplierName, setSupplierName] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
    const [notes, setNotes] = useState('');

    // Form State (Item level)
    const [invoiceItems, setInvoiceItems] = useState([]);
    const [productId, setProductId] = useState('');
    const [variantId, setVariantId] = useState('');
    const [qty, setQty] = useState('');
    const [unitCost, setUnitCost] = useState('');

    const fetchPurchases = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            const { data } = await axios.get('http://localhost:5000/api/wholesale', config);
            setPurchases(data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const { data } = await axios.get('http://localhost:5000/api/products');
            setProducts(data.products || data);
        } catch (error) {
            console.error('Failed to load products for dropdown', error);
        }
    };

    useEffect(() => {
        fetchPurchases();
        fetchProducts();
    }, [userInfo.token]);

    const handleAddItem = () => {
        if (!productId || !qty || !unitCost) return alert('Please fill missing item fields');

        const selectedProduct = products.find(p => p._id === productId);
        const selectedVariant = selectedProduct?.variants?.find(v => v._id === variantId);

        const newItem = {
            id: Date.now().toString(), // temporary UI id
            product: productId,
            productName: selectedProduct?.name,
            variantId: variantId || undefined,
            variantName: selectedVariant ? `${selectedVariant.name}: ${selectedVariant.value}` : undefined,
            quantityReceived: Number(qty),
            unitCost: Number(unitCost),
            itemTotalCost: Number(qty) * Number(unitCost)
        };

        setInvoiceItems([...invoiceItems, newItem]);
        // Reset item fields
        setProductId('');
        setVariantId('');
        setQty('');
        setUnitCost('');
    };

    const handleRemoveItem = (id) => {
        setInvoiceItems(invoiceItems.filter(i => i.id !== id));
    };

    const submitHandler = async (e) => {
        e.preventDefault();
        if (invoiceItems.length === 0) return alert('Please add at least one item to the invoice.');
        if (!supplierName) return alert('Please provide a supplier name.');

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            await axios.post(
                'http://localhost:5000/api/wholesale',
                {
                    supplierName,
                    paymentMethod,
                    notes,
                    items: invoiceItems.map(item => ({
                        product: item.product,
                        variantId: item.variantId,
                        variantName: item.variantName,
                        quantityReceived: item.quantityReceived,
                        unitCost: item.unitCost
                    }))
                },
                config
            );

            // Reset form & refresh list
            setShowForm(false);
            setSupplierName('');
            setPaymentMethod('Bank Transfer');
            setNotes('');
            setInvoiceItems([]);
            fetchPurchases();

        } catch (error) {
            alert(error.response?.data?.message || 'Failed to record purchase');
        }
    };

    const invoiceTotal = invoiceItems.reduce((acc, curr) => acc + curr.itemTotalCost, 0);

    return (
        <div className="space-y-6">

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Wholesale Inventory</h1>
                    <p className="text-slate-500 text-sm mt-1">Track supplier purchases and costs to calculate true profit.</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn-primary flex items-center gap-2"
                >
                    {showForm ? 'Cancel Entry' : <><Plus size={18} /> Log Purchase Batch</>}
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-4 bg-pink-50 text-pink-600 rounded-xl"><Package size={24} /></div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Total Purchase Invoices</p>
                        <p className="text-2xl font-bold text-slate-800">{purchases.length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl"><Truck size={24} /></div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Total Units Received</p>
                        <p className="text-2xl font-bold text-slate-800">
                            {purchases.reduce((acc, curr) => acc + (curr.items?.reduce((iAcc, item) => iAcc + item.quantityReceived, 0) || 0), 0)}
                        </p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-4 bg-amber-50 text-amber-600 rounded-xl"><Wallet size={24} /></div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Total Capital Spent</p>
                        <p className="text-2xl font-bold text-slate-800">
                            ${purchases.reduce((acc, curr) => acc + curr.totalCost, 0).toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Entry Form */}
            {showForm && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 animate-fade-in-up">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                        <FileText size={20} className="text-pink-500" /> New Wholesale Invoice
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left Side - Invoice Metadata & Add Item Form */}
                        <div className="lg:col-span-7 space-y-8">

                            {/* Invoice Details */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">1. Invoice Details</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Supplier Name</label>
                                        <input
                                            type="text" value={supplierName} onChange={(e) => setSupplierName(e.target.value)}
                                            placeholder="e.g. L'Oreal Wholesale Dist."
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg input-focus bg-slate-50 text-slate-700"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                                        <select
                                            value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg input-focus bg-slate-50 text-slate-700"
                                        >
                                            <option value="Bank Transfer">Bank Transfer</option>
                                            <option value="Cash">Cash</option>
                                        </select>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Invoice Notes (Optional)</label>
                                        <textarea
                                            value={notes} onChange={(e) => setNotes(e.target.value)}
                                            rows="2" placeholder="Reference numbers or additional info..."
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg input-focus bg-slate-50 text-slate-700"
                                        ></textarea>
                                    </div>
                                </div>
                            </div>

                            {/* Add Item Form */}
                            <div className="space-y-4 p-5 bg-pink-50/50 border border-pink-100 rounded-xl">
                                <h3 className="text-sm font-bold text-pink-700 uppercase tracking-wider flex items-center gap-2">
                                    <ShoppingCart size={16} /> 2. Add Line Items
                                </h3>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Product</label>
                                    <select
                                        value={productId}
                                        onChange={(e) => { setProductId(e.target.value); setVariantId(''); }}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-500 bg-white text-slate-700"
                                    >
                                        <option value="">-- Choose a product --</option>
                                        {products.map(p => (
                                            <option key={p._id} value={p._id}>{p.name} (Base Stock: {p.stock})</option>
                                        ))}
                                    </select>
                                </div>

                                {productId && products.find(p => p._id === productId)?.variants?.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Select Variant</label>
                                        <select
                                            value={variantId}
                                            onChange={(e) => setVariantId(e.target.value)}
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-500 bg-white text-slate-700"
                                        >
                                            <option value="">-- Choose a variant --</option>
                                            {products.find(p => p._id === productId)?.variants.map(v => (
                                                <option key={v._id} value={v._id}>
                                                    {v.name}: {v.value} (Stock: {v.stock})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                                        <input
                                            type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)}
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-500 bg-white text-slate-700"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Unit Cost ($)</label>
                                        <input
                                            type="number" step="0.01" min="0" value={unitCost} onChange={(e) => setUnitCost(e.target.value)}
                                            placeholder="Cost per item"
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-500 bg-white text-slate-700"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleAddItem}
                                    disabled={!productId || !qty || !unitCost}
                                    className="w-full py-2 bg-pink-100 hover:bg-pink-200 text-pink-700 font-bold rounded-lg transition-colors disabled:opacity-50"
                                >
                                    + Add Item to Invoice
                                </button>
                            </div>
                        </div>

                        {/* Right Side - Cart/Invoice List */}
                        <div className="lg:col-span-5 flex flex-col h-full bg-slate-50 border border-slate-100 rounded-xl overflow-hidden">
                            <div className="p-4 bg-slate-100 border-b border-slate-200">
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Invoice Cart ({invoiceItems.length})</h3>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[250px] max-h-[400px]">
                                {invoiceItems.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 group">
                                        <ShoppingCart size={40} className="mb-2 opacity-30 group-hover:opacity-60 transition-opacity" />
                                        <p className="text-sm">No items added to invoice yet.</p>
                                    </div>
                                ) : (
                                    invoiceItems.map((item, index) => (
                                        <div key={item.id} className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm relative pr-10">
                                            <p className="font-bold text-slate-800 text-sm line-clamp-1">{index + 1}. {item.productName}</p>
                                            {item.variantName && (
                                                <p className="text-xs text-pink-600 font-semibold mb-1">{item.variantName}</p>
                                            )}
                                            <div className="flex justify-between items-end mt-2">
                                                <p className="text-xs text-slate-500">
                                                    {item.quantityReceived} x ${item.unitCost.toFixed(2)}
                                                </p>
                                                <p className="font-bold text-slate-900">${item.itemTotalCost.toFixed(2)}</p>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveItem(item.id)}
                                                className="absolute top-2 right-2 p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-5 bg-white border-t border-slate-200">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="font-bold text-slate-600">Grand Total:</span>
                                    <span className="text-xl font-black text-emerald-600">${invoiceTotal.toFixed(2)}</span>
                                </div>
                                <button
                                    onClick={submitHandler}
                                    disabled={invoiceItems.length === 0 || !supplierName}
                                    className="w-full py-3 bg-slate-900 hover:bg-pink-600 text-white font-bold rounded-lg transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm"
                                >
                                    Submit Purchase Batch
                                </button>
                                {(!supplierName && invoiceItems.length > 0) && (
                                    <p className="text-xs text-rose-500 mt-2 text-center font-medium">Supplier name is required.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* History Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden text-sm">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700">Recent Purchase Invoices</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-white">
                            <tr>
                                <th className="px-6 py-4 text-left font-semibold text-slate-400 uppercase tracking-wider text-xs">Date</th>
                                <th className="px-6 py-4 text-left font-semibold text-slate-400 uppercase tracking-wider text-xs">Supplier & Items</th>
                                <th className="px-6 py-4 text-left font-semibold text-slate-400 uppercase tracking-wider text-xs">Payment Method</th>
                                <th className="px-6 py-4 text-right font-semibold text-slate-400 uppercase tracking-wider text-xs">Total Units</th>
                                <th className="px-6 py-4 text-right font-semibold text-slate-400 uppercase tracking-wider text-xs">Total Cost ($)</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-8 text-slate-500">Loading records...</td></tr>
                            ) : purchases.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-12 text-slate-500">No wholesale purchases logged yet.</td></tr>
                            ) : (
                                purchases.map(purchase => (
                                    <tr key={purchase._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                                            {new Date(purchase.purchaseDate).toLocaleDateString()}
                                            <span className="block text-[10px] text-slate-300 mt-1">{new Date(purchase.purchaseDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-slate-800 flex items-center gap-2">
                                                {purchase.supplierName}
                                            </span>
                                            <div className="mt-2 space-y-1">
                                                {purchase.items?.slice(0, 3).map((item, idx) => (
                                                    <div key={idx} className="text-xs flex items-center gap-1.5 border-l-2 border-pink-200 pl-2">
                                                        <span className="font-medium text-slate-700">{item.product?.name || 'Deleted Product'}</span>
                                                        {item.variantName && <span className="text-pink-600">({item.variantName})</span>}
                                                        <span className="text-slate-400">- qty: {item.quantityReceived}</span>
                                                    </div>
                                                ))}
                                                {purchase.items?.length > 3 && (
                                                    <span className="text-xs text-slate-400 pl-2 block mt-1 italic">...and {purchase.items.length - 3} more items</span>
                                                )}
                                            </div>
                                            {purchase.notes && <p className="text-[10px] text-slate-400 mt-2 italic bg-slate-100 p-1.5 rounded inline-block">Note: {purchase.notes}</p>}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${purchase.paymentMethod === 'Cash' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {purchase.paymentMethod}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-slate-600">
                                            {purchase.items?.reduce((acc, curr) => acc + curr.quantityReceived, 0) || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right font-black text-slate-900 bg-slate-50/50">
                                            ${purchase.totalCost.toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default WholesaleInventory;
