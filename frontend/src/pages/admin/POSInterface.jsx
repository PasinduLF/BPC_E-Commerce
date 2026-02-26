import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../context/useAuthStore';
import { Search, Plus, Minus, Trash2, ShoppingBag, CreditCard, Banknote } from 'lucide-react';

const POSInterface = () => {
    const { userInfo } = useAuthStore();
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    // Cart State
    const [cartItems, setCartItems] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [selectedProductForVariant, setSelectedProductForVariant] = useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const { data } = await axios.get('http://localhost:5000/api/products?keyword=' + search);
                setProducts(data.products || data);
                setLoading(false);
            } catch (error) {
                console.error('Failed to load products', error);
                setLoading(false);
            }
        };
        fetchProducts();
    }, [search]);

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
                price: product.price + (variant ? variant.price || 0 : 0),
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

    const placeOrderHandler = async () => {
        if (cartItems.length === 0) return;

        if (window.confirm(`Process ${paymentMethod} payment of $${itemsPrice.toFixed(2)}?`)) {
            try {
                const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                await axios.post('http://localhost:5000/api/pos', {
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
                    totalPrice: itemsPrice
                }, config);

                alert("Point of Sale transaction complete. Stock updated natively.");
                setCartItems([]);
                // Refetch products to update stock numbers visually
                setSearch('');

            } catch (error) {
                alert(error.response?.data?.message || 'Failed to process POS order');
            }
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">

            {/* Product Catalog Side */}
            <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 relative">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <ShoppingBag size={20} className="text-pink-500" /> Walk-in Catalog
                    </h2>
                    <div className="relative w-64">
                        <input
                            type="text" placeholder="Search physical stock..."
                            value={search} onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm input-focus"
                        />
                        <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                    </div>
                </div>

                <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50">
                    {loading ? (
                        <div className="text-center py-10 text-slate-500">Loading products...</div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                            {products.map(product => {
                                const totalStock = (product.variants && product.variants.length > 0)
                                    ? product.variants.reduce((sum, v) => sum + v.stock, 0)
                                    : product.stock;
                                return (
                                    <div
                                        key={product._id}
                                        onClick={() => handleProductClick(product)}
                                        className={`bg-white p-4 rounded-xl shadow-sm border ${totalStock > 0 ? 'border-slate-100 cursor-pointer hover:border-pink-300 hover:shadow-md transition-all' : 'border-rose-100 opacity-60 cursor-not-allowed'}`}
                                    >
                                        <div className="aspect-square bg-slate-100 rounded-lg mb-3 overflow-hidden">
                                            {product.images[0] ? (
                                                <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">No Img</div>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-slate-800 text-sm line-clamp-1">{product.name}</h3>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-pink-600 font-bold text-sm">${product.price.toFixed(2)}</span>
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${totalStock > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
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
            <div className="w-full lg:w-[400px] flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-shrink-0">
                <div className="p-4 border-b border-slate-100 bg-pink-50 text-pink-900">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        Current Ticket
                    </h2>
                </div>

                <div className="flex-1 p-4 overflow-y-auto">
                    {cartItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <ShoppingBag size={48} className="mb-4 text-slate-200" />
                            <p>Ticket is empty. Add products from the catalog.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cartItems.map((item) => (
                                <div key={item.cartId} className="flex gap-3 pb-4 border-b border-slate-100 last:border-0">
                                    <div className="w-16 h-16 rounded-md bg-slate-100 flex-shrink-0 overflow-hidden">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{item.name}</h4>
                                        {item.variantName && (
                                            <div className="text-[10px] uppercase font-bold text-pink-500 tracking-wider">
                                                {item.variantName}
                                            </div>
                                        )}
                                        <div className="text-pink-600 font-medium text-sm mb-2 mt-0.5">${item.price.toFixed(2)}</div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg">
                                                <button onClick={() => updateQty(item.cartId, item.qty - 1)} className="p-1 px-2 text-slate-500 hover:text-pink-600 transition-colors">
                                                    <Minus size={14} />
                                                </button>
                                                <span className="text-sm font-bold w-6 text-center">{item.qty}</span>
                                                <button onClick={() => updateQty(item.cartId, item.qty + 1)} className="p-1 px-2 text-slate-500 hover:text-pink-600 transition-colors">
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                            <button onClick={() => removeFromCart(item.cartId)} className="text-slate-400 hover:text-rose-500 p-1 transition-colors">
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
                <div className="p-5 border-t border-slate-100 bg-slate-50">

                    <div className="flex justify-between items-center mb-4 text-slate-600">
                        <span className="font-medium">Subtotal ({cartItems.reduce((a, c) => a + c.qty, 0)} items)</span>
                        <span className="font-bold text-slate-900 text-lg">${itemsPrice.toFixed(2)}</span>
                    </div>

                    <div className="space-y-3 mb-4">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Payment Method</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setPaymentMethod('Cash')}
                                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border transition-all text-sm font-medium ${paymentMethod === 'Cash' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                <Banknote size={18} /> Cash
                            </button>
                            <button
                                onClick={() => setPaymentMethod('Bank Transfer')}
                                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border transition-all text-sm font-medium ${paymentMethod === 'Bank Transfer' ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                <CreditCard size={18} /> Bank
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={placeOrderHandler}
                        disabled={cartItems.length === 0}
                        className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                        Charge ${itemsPrice.toFixed(2)}
                    </button>
                </div>

            </div>

            {/* Variant Modal */}
            {selectedProductForVariant && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-2xl p-6 shadow-xl max-w-md w-full animate-fade-in-up">
                        <div className="flex justify-between flex-wrap gap-2 mb-4">
                            <h3 className="font-bold text-slate-900 text-lg">Select Option for {selectedProductForVariant.name}</h3>
                        </div>
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                            {selectedProductForVariant.variants.map(variant => (
                                <button
                                    key={variant._id}
                                    onClick={() => addToCart(selectedProductForVariant, variant)}
                                    disabled={variant.stock === 0}
                                    className={`w-full flex items-center justify-between p-4 border rounded-xl text-left transition-colors ${variant.stock > 0 ? 'border-slate-200 hover:border-pink-400 hover:bg-pink-50' : 'border-rose-100 bg-rose-50 opacity-60 cursor-not-allowed'}`}
                                >
                                    <div>
                                        <div className="font-bold text-slate-800">{variant.name}: {variant.value}</div>
                                        <div className="text-sm text-slate-500 mt-1">Available: {variant.stock}</div>
                                    </div>
                                    <div className="font-bold text-pink-600">
                                        +${(variant.price || 0).toFixed(2)}
                                    </div>
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setSelectedProductForVariant(null)} className="w-full mt-6 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-bold transition-all">Cancel</button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default POSInterface;
