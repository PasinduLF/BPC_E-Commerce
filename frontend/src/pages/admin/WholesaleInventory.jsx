import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../context/useAuthStore';
import { Plus, Package, Truck, Wallet, FileText, Trash2, ShoppingCart, Eye, Edit, XCircle } from 'lucide-react';
import { useConfigStore } from '../../context/useConfigStore';

const WholesaleInventory = () => {
    const { userInfo } = useAuthStore();
    const { config } = useConfigStore();
    const currency = config?.currencySymbol || '$';

    const [purchases, setPurchases] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState(null);

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({
        supplierName: '',
        paymentMethod: 'Bank Transfer',
        notes: ''
    });

    // Form State (Invoice level)
    const [showForm, setShowForm] = useState(false);
    const [supplierName, setSupplierName] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
    const [notes, setNotes] = useState('');

    // Form State (Item level)
    const [invoiceItems, setInvoiceItems] = useState([]);
    const [productId, setProductId] = useState('');
    const [variantId, setVariantId] = useState('');
    const [isCustomItem, setIsCustomItem] = useState(false);
    const [customProductName, setCustomProductName] = useState('');
    const [qty, setQty] = useState('');
    const [unitCost, setUnitCost] = useState('');

    const fetchPurchases = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            const { data } = await axios.get('/api/wholesale', config);
            setPurchases(data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const { data } = await axios.get('/api/products');
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
        if ((!isCustomItem && !productId) || (isCustomItem && !customProductName.trim()) || !qty || !unitCost) {
            return alert('Please fill missing item fields');
        }

        const selectedProduct = products.find(p => p._id === productId);
        const selectedVariant = selectedProduct?.variants?.find(v => v._id === variantId);
        const resolvedName = isCustomItem ? customProductName.trim() : selectedProduct?.name;

        const newItem = {
            id: Date.now().toString(), // temporary UI id
            product: isCustomItem ? undefined : productId,
            customProductName: isCustomItem ? resolvedName : undefined,
            productName: resolvedName,
            variantId: isCustomItem ? undefined : (variantId || undefined),
            variantName: isCustomItem ? undefined : (selectedVariant ? `${selectedVariant.name}: ${selectedVariant.value}` : undefined),
            quantityReceived: Number(qty),
            unitCost: Number(unitCost),
            itemTotalCost: Number(qty) * Number(unitCost)
        };

        setInvoiceItems([...invoiceItems, newItem]);
        // Reset item fields
        setProductId('');
        setVariantId('');
        setIsCustomItem(false);
        setCustomProductName('');
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
                '/api/wholesale',
                {
                    supplierName,
                    paymentMethod,
                    notes,
                    items: invoiceItems.map(item => ({
                        product: item.product,
                        customProductName: item.customProductName,
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

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this invoice? The stock received will be deducted.')) {
            try {
                const configHeader = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                await axios.delete(`/api/wholesale/${id}`, configHeader);
                fetchPurchases();
            } catch (error) {
                alert(error.response?.data?.message || 'Failed to delete purchase');
            }
        }
    };

    const openDetailsModal = async (id) => {
        try {
            const configHeader = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            const { data } = await axios.get(`/api/wholesale/${id}`, configHeader);
            setSelectedPurchase(data);
            setDetailsModalOpen(true);
        } catch (error) {
            alert('Failed to load purchase details');
        }
    };

    const openEditModal = (purchase) => {
        setSelectedPurchase(purchase);
        setEditFormData({
            supplierName: purchase.supplierName,
            paymentMethod: purchase.paymentMethod,
            notes: purchase.notes || ''
        });
        setEditModalOpen(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const configHeader = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            await axios.put(`/api/wholesale/${selectedPurchase._id}`, editFormData, configHeader);
            setEditModalOpen(false);
            fetchPurchases();
            alert('Purchase updated successfully');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update purchase');
        }
    };

    const invoiceTotal = invoiceItems.reduce((acc, curr) => acc + curr.itemTotalCost, 0);

    return (
        <div className="space-y-6">

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Wholesale Inventory</h1>
                    <p className="text-secondary text-sm mt-1">Track supplier purchases and costs to calculate true profit.</p>
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
                <div className="bg-surface p-6 rounded-2xl shadow-sm border border-default flex items-center gap-4">
                    <div className="p-4 bg-brand-subtle text-brand rounded-xl"><Package size={24} /></div>
                    <div>
                        <p className="text-sm font-medium text-secondary">Total Purchase Invoices</p>
                        <p className="text-2xl font-bold text-primary">{purchases.length}</p>
                    </div>
                </div>
                <div className="bg-surface p-6 rounded-2xl shadow-sm border border-default flex items-center gap-4">
                    <div className="p-4 bg-success-bg text-success rounded-xl"><Truck size={24} /></div>
                    <div>
                        <p className="text-sm font-medium text-secondary">Total Units Received</p>
                        <p className="text-2xl font-bold text-primary">
                            {purchases.reduce((acc, curr) => acc + (curr.items?.reduce((iAcc, item) => iAcc + item.quantityReceived, 0) || 0), 0)}
                        </p>
                    </div>
                </div>
                <div className="bg-surface p-6 rounded-2xl shadow-sm border border-default flex items-center gap-4">
                    <div className="p-4 bg-warning-bg text-warning rounded-xl"><Wallet size={24} /></div>
                    <div>
                        <p className="text-sm font-medium text-secondary">Total Capital Spent</p>
                        <p className="text-2xl font-bold text-primary">
                            {currency}{purchases.reduce((acc, curr) => acc + curr.totalCost, 0).toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Entry Form */}
            {showForm && (
                <div className="bg-surface rounded-2xl shadow-sm border border-default p-6 sm:p-8 animate-fade-in-up">
                    <h2 className="text-lg font-bold text-primary mb-6 flex items-center gap-2 border-b border-default pb-4">
                        <FileText size={20} className="text-brand" /> New Wholesale Invoice
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left Side - Invoice Metadata & Add Item Form */}
                        <div className="lg:col-span-7 space-y-8">

                            {/* Invoice Details */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-primary uppercase tracking-wider">1. Invoice Details</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-1">Supplier Name</label>
                                        <input
                                            type="text" value={supplierName} onChange={(e) => setSupplierName(e.target.value)}
                                            placeholder="e.g. L'Oreal Wholesale Dist."
                                            className="w-full px-4 py-2 border border-default rounded-lg focus:border-brand focus:ring-1 focus:ring-brand bg-page text-primary outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-1">Payment Method</label>
                                        <select
                                            value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="w-full px-4 py-2 border border-default rounded-lg focus:border-brand focus:ring-1 focus:ring-brand bg-page text-primary outline-none"
                                        >
                                            <option value="Bank Transfer">Bank Transfer</option>
                                            <option value="Cash">Cash</option>
                                        </select>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-primary mb-1">Invoice Notes (Optional)</label>
                                        <textarea
                                            value={notes} onChange={(e) => setNotes(e.target.value)}
                                            rows="2" placeholder="Reference numbers or additional info..."
                                            className="w-full px-4 py-2 border border-default rounded-lg focus:border-brand focus:ring-1 focus:ring-brand bg-page text-primary outline-none"
                                        ></textarea>
                                    </div>
                                </div>
                            </div>

                            {/* Add Item Form */}
                            <div className="space-y-4 p-5 bg-brand-subtle/50 border border-brand/20 rounded-xl">
                                <h3 className="text-sm font-bold text-brand uppercase tracking-wider flex items-center gap-2">
                                    <ShoppingCart size={16} /> 2. Add Line Items
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => { setIsCustomItem(false); setCustomProductName(''); }}
                                        className={`py-2 px-3 rounded-lg border text-xs font-bold transition-colors ${!isCustomItem ? 'bg-surface border-brand text-brand' : 'bg-page border-default text-secondary hover:bg-surface'}`}
                                    >
                                        Catalog Product
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setIsCustomItem(true); setProductId(''); setVariantId(''); }}
                                        className={`py-2 px-3 rounded-lg border text-xs font-bold transition-colors ${isCustomItem ? 'bg-surface border-brand text-brand' : 'bg-page border-default text-secondary hover:bg-surface'}`}
                                    >
                                        Custom Product
                                    </button>
                                </div>

                                {isCustomItem ? (
                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-1">Custom Product Name</label>
                                        <input
                                            type="text"
                                            value={customProductName}
                                            onChange={(e) => setCustomProductName(e.target.value)}
                                            placeholder="e.g. Imported Display Stand"
                                            className="w-full px-4 py-2 border border-default rounded-lg focus:border-brand focus:ring-1 focus:ring-brand bg-surface text-primary outline-none text-sm"
                                        />
                                    </div>
                                ) : (
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Select Product</label>
                                    <select
                                        value={productId}
                                        onChange={(e) => { setProductId(e.target.value); setVariantId(''); }}
                                        className="w-full px-4 py-2 border border-default rounded-lg focus:border-brand focus:ring-1 focus:ring-brand bg-surface text-primary outline-none text-sm"
                                    >
                                        <option value="">-- Choose a product --</option>
                                        {products.map(p => (
                                            <option key={p._id} value={p._id}>{p.name} (Base Stock: {p.stock})</option>
                                        ))}
                                    </select>
                                </div>
                                )}

                                {!isCustomItem && productId && products.find(p => p._id === productId)?.variants?.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-1">Select Variant</label>
                                        <select
                                            value={variantId}
                                            onChange={(e) => setVariantId(e.target.value)}
                                            className="w-full px-4 py-2 border border-default rounded-lg focus:border-brand focus:ring-1 focus:ring-brand bg-surface text-primary outline-none text-sm"
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
                                        <label className="block text-sm font-medium text-primary mb-1">Quantity</label>
                                        <input
                                            type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)}
                                            className="w-full px-4 py-2 border border-default rounded-lg focus:border-brand focus:ring-1 focus:ring-brand bg-surface text-primary outline-none text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-1">Unit Cost ({currency})</label>
                                        <input
                                            type="number" step="0.01" min="0" value={unitCost} onChange={(e) => setUnitCost(e.target.value)}
                                            placeholder="Cost per item"
                                            className="w-full px-4 py-2 border border-default rounded-lg focus:border-brand focus:ring-1 focus:ring-brand bg-surface text-primary outline-none text-sm"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleAddItem}
                                    disabled={(!isCustomItem && !productId) || (isCustomItem && !customProductName.trim()) || !qty || !unitCost}
                                    className="w-full py-2 bg-brand hover:brightness-95 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                                >
                                    + Add Item to Invoice
                                </button>
                            </div>
                        </div>

                        {/* Right Side - Cart/Invoice List */}
                        <div className="lg:col-span-5 flex flex-col h-full bg-page border border-default rounded-xl overflow-hidden">
                            <div className="p-4 bg-surface border-b border-default">
                                <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Invoice Cart ({invoiceItems.length})</h3>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[250px] max-h-[400px]">
                                {invoiceItems.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-tertiary group">
                                        <ShoppingCart size={40} className="mb-2 opacity-30 group-hover:opacity-60 transition-opacity" />
                                        <p className="text-sm">No items added to invoice yet.</p>
                                    </div>
                                ) : (
                                    invoiceItems.map((item, index) => (
                                        <div key={item.id} className="bg-surface border border-default p-3 rounded-lg shadow-sm relative pr-10">
                                            <p className="font-bold text-primary text-sm line-clamp-1">{index + 1}. {item.productName}</p>
                                            {item.variantName && (
                                                <p className="text-xs text-brand font-semibold mb-1">{item.variantName}</p>
                                            )}
                                            <div className="flex justify-between items-end mt-2">
                                                <p className="text-xs text-secondary">
                                                    {item.quantityReceived} x {currency}{item.unitCost.toFixed(2)}
                                                </p>
                                                <p className="font-bold text-primary">{currency}{item.itemTotalCost.toFixed(2)}</p>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveItem(item.id)}
                                                className="absolute top-2 right-2 p-1.5 text-error hover:brightness-90 hover:bg-error-bg rounded"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-5 bg-surface border-t border-default">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="font-bold text-primary">Grand Total:</span>
                                    <span className="text-xl font-black text-success">{currency}{invoiceTotal.toFixed(2)}</span>
                                </div>
                                <button
                                    onClick={submitHandler}
                                    disabled={invoiceItems.length === 0 || !supplierName}
                                    className="w-full py-3 btn-primary font-bold rounded-lg transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm"
                                >
                                    Submit Purchase Batch
                                </button>
                                {(!supplierName && invoiceItems.length > 0) && (
                                    <p className="text-xs text-error mt-2 text-center font-medium">Supplier name is required.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* History Table */}
            <div className="bg-surface rounded-2xl shadow-sm border border-default overflow-hidden text-sm">
                <div className="p-4 border-b border-default bg-page flex justify-between items-center">
                    <h3 className="font-bold text-primary">Recent Purchase Invoices</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-default">
                        <thead className="bg-surface">
                            <tr>
                                <th className="px-6 py-4 text-left font-semibold text-secondary uppercase tracking-wider text-xs">Date</th>
                                <th className="px-6 py-4 text-left font-semibold text-secondary uppercase tracking-wider text-xs">Supplier & Items</th>
                                <th className="px-6 py-4 text-left font-semibold text-secondary uppercase tracking-wider text-xs">Payment Method</th>
                                <th className="px-6 py-4 text-right font-semibold text-secondary uppercase tracking-wider text-xs">Total Units</th>
                                <th className="px-6 py-4 text-right font-semibold text-secondary uppercase tracking-wider text-xs">Total Cost</th>
                                <th className="px-6 py-4 text-center font-semibold text-secondary uppercase tracking-wider text-xs">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-surface divide-y divide-default">
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-8 text-secondary">Loading records...</td></tr>
                            ) : purchases.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-12 text-secondary">No wholesale purchases logged yet.</td></tr>
                            ) : (
                                purchases.map(purchase => (
                                    <tr key={purchase._id} className="hover:bg-page transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-secondary">
                                            {new Date(purchase.purchaseDate).toLocaleDateString()}
                                            <span className="block text-[10px] text-tertiary mt-1">{new Date(purchase.purchaseDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-primary flex items-center gap-2">
                                                {purchase.supplierName}
                                            </span>
                                            <div className="mt-2 space-y-1">
                                                {purchase.items?.slice(0, 3).map((item, idx) => (
                                                    <div key={idx} className="text-xs flex items-center gap-1.5 border-l-2 border-brand/30 pl-2">
                                                        <span className="font-medium text-secondary">{item.product?.name || item.customProductName || 'Custom Product'}</span>
                                                        {item.variantName && <span className="text-brand">({item.variantName})</span>}
                                                        <span className="text-tertiary">- qty: {item.quantityReceived}</span>
                                                    </div>
                                                ))}
                                                {purchase.items?.length > 3 && (
                                                    <span className="text-xs text-tertiary pl-2 block mt-1 italic">...and {purchase.items.length - 3} more items</span>
                                                )}
                                            </div>
                                            {purchase.notes && <p className="text-[10px] text-tertiary mt-2 italic bg-page p-1.5 rounded inline-block">Note: {purchase.notes}</p>}
                                        </td>
                                        <td className="px-6 py-4 text-secondary whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${purchase.paymentMethod === 'Cash' ? 'bg-warning-bg text-warning' : 'bg-info-bg text-info'}`}>
                                                {purchase.paymentMethod}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-primary">
                                            {purchase.items?.reduce((acc, curr) => acc + curr.quantityReceived, 0) || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right font-black text-primary bg-page">
                                            {currency}{purchase.totalCost.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => openDetailsModal(purchase._id)}
                                                    className="text-info hover:bg-info-bg p-1.5 rounded-lg transition-colors border border-transparent"
                                                    title="View Details"
                                                >
                                                    <Eye size={16} />
                                                </button>

                                                <button
                                                    onClick={() => openEditModal(purchase)}
                                                    className="text-success hover:bg-success-bg p-1.5 rounded-lg transition-colors border border-transparent"
                                                    title="Edit Purchase"
                                                >
                                                    <Edit size={16} />
                                                </button>

                                                <button
                                                    onClick={() => handleDelete(purchase._id)}
                                                    className="text-error hover:bg-error-bg p-1.5 rounded-lg transition-colors border border-transparent"
                                                    title="Delete Purchase"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Details Modal */}
            {detailsModalOpen && selectedPurchase && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-surface rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-default flex justify-between items-center bg-page">
                            <h3 className="font-bold text-primary flex items-center gap-2">
                                <FileText size={18} className="text-info" /> Invoice Details
                            </h3>
                            <button onClick={() => setDetailsModalOpen(false)} className="text-tertiary hover:text-primary transition-colors">
                                <XCircle size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4 mb-6 text-sm bg-page p-4 rounded-xl border border-default">
                                <div>
                                    <span className="block text-secondary mb-1">Supplier</span>
                                    <span className="font-bold text-primary">{selectedPurchase.supplierName}</span>
                                </div>
                                <div>
                                    <span className="block text-secondary mb-1">Date</span>
                                    <span className="font-medium text-primary">{new Date(selectedPurchase.purchaseDate).toLocaleString()}</span>
                                </div>
                                <div>
                                    <span className="block text-secondary mb-1">Payment Method</span>
                                    <span className={`px-2 py-1 rounded-md text-xs font-bold inline-block ${selectedPurchase.paymentMethod === 'Cash' ? 'bg-warning-bg text-warning' : 'bg-info-bg text-info'}`}>
                                        {selectedPurchase.paymentMethod}
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-secondary mb-1">Total Cost</span>
                                    <span className="font-black text-success text-lg">{currency}{selectedPurchase.totalCost.toFixed(2)}</span>
                                </div>
                            </div>

                            {selectedPurchase.notes && (
                                <div className="mb-6 p-3 bg-info-bg border border-info/20 rounded-xl text-sm">
                                    <span className="font-bold text-info block mb-1">Notes:</span>
                                    <span className="text-primary">{selectedPurchase.notes}</span>
                                </div>
                            )}

                            <h4 className="font-bold text-primary mb-3 border-b border-default pb-2">Line Items</h4>
                            <div className="space-y-3">
                                {selectedPurchase.items.map((item, index) => (
                                    <div key={item._id} className="flex gap-4 p-3 border border-default rounded-xl hover:bg-page transition-colors">
                                        <div className="bg-page rounded-lg w-12 h-12 flex items-center justify-center overflow-hidden shrink-0">
                                            {item.product?.image || (item.product?.images && item.product.images[0]) ? (
                                                <img src={item.product?.image || item.product.images[0].url} alt={item.product.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Package size={20} className="text-tertiary" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-bold text-primary">{index + 1}. {item.product?.name || item.customProductName || 'Custom Product'}</p>
                                                    {item.variantName && <p className="text-xs text-brand font-semibold">{item.variantName}</p>}
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-black text-primary">{currency}{item.itemTotalCost.toFixed(2)}</p>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center mt-2 text-xs text-secondary bg-surface inline-block px-2 py-1 rounded border border-default">
                                                <span>Qty: <strong className="text-primary">{item.quantityReceived}</strong></span>
                                                <span className="mx-2 text-default">|</span>
                                                <span>Unit Cost: <strong className="text-primary">{currency}{item.unitCost.toFixed(2)}</strong></span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Invoice Modal */}
            {editModalOpen && selectedPurchase && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-default flex justify-between items-center bg-page">
                            <h3 className="font-bold text-primary flex items-center gap-2">
                                <Edit size={18} className="text-success" /> Edit Invoice Metadata
                            </h3>
                            <button onClick={() => setEditModalOpen(false)} className="text-tertiary hover:text-primary transition-colors">
                                <XCircle size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4 overflow-y-auto">
                            <div className="p-3 bg-warning-bg text-warning rounded-lg text-xs font-medium flex gap-2">
                                <span className="font-bold">Note:</span> You can only edit the invoice metadata here (Supplier, Method, Notes). For quantity or cost adjustments, delete this invoice and recreate it to ensure accurate stock ledger history.
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">Supplier Name</label>
                                <input
                                    type="text"
                                    value={editFormData.supplierName}
                                    onChange={(e) => setEditFormData({ ...editFormData, supplierName: e.target.value })}
                                    className="w-full px-4 py-2 border border-default bg-surface text-primary rounded-xl focus:ring-2 focus:ring-brand outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">Payment Method</label>
                                <select
                                    value={editFormData.paymentMethod}
                                    onChange={(e) => setEditFormData({ ...editFormData, paymentMethod: e.target.value })}
                                    className="w-full px-4 py-2 border border-default bg-surface text-primary rounded-xl focus:ring-2 focus:ring-brand outline-none"
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">Notes</label>
                                <textarea
                                    value={editFormData.notes}
                                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                                    rows="3"
                                    className="w-full px-4 py-2 border border-default bg-surface text-primary rounded-xl focus:ring-2 focus:ring-brand outline-none"
                                ></textarea>
                            </div>

                            <div className="pt-4 border-t border-default flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setEditModalOpen(false)} className="px-5 py-2.5 text-secondary bg-page hover:brightness-95 rounded-xl font-medium transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="px-5 py-2.5 bg-success text-white hover:brightness-95 rounded-xl font-medium transition-colors shadow-sm">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default WholesaleInventory;
