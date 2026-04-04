import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Wishlist from './pages/Wishlist';
import ProductScreen from './pages/ProductScreen';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Shipping from './pages/Shipping';
import Payment from './pages/Payment';
import PlaceOrder from './pages/PlaceOrder';
import OrderScreen from './pages/OrderScreen';
import MyOrders from './pages/MyOrders';
import Profile from './pages/Profile';
import About from './pages/About';
import Contact from './pages/Contact';

// Admin Components
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductManage from './pages/admin/ProductManage';
import CategoryManage from './pages/admin/CategoryManage';
import BrandManage from './pages/admin/BrandManage';
import OrderManage from './pages/admin/OrderManage';
import WholesaleInventory from './pages/admin/WholesaleInventory';
import UserManage from './pages/admin/UserManage';

import FinancialDashboard from './pages/admin/FinancialDashboard';
import POSInterface from './pages/admin/POSInterface';
import IncomeExpenseManage from './pages/admin/IncomeExpenseManage';
import SystemSettings from './pages/admin/SystemSettings';
import { useConfigStore } from './context/useConfigStore';
import { useCartStore } from './context/useCartStore';
import { useWishlistStore } from './context/useWishlistStore';
import { useAuthStore } from './context/useAuthStore';

function App() {
  const { fetchConfig } = useConfigStore();
  const { cartItems } = useCartStore();
  const { wishlistItems } = useWishlistStore();
  const { userInfo } = useAuthStore();

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Background Sync: Push cart and wishlist to the Database when they change
  useEffect(() => {
    if (userInfo) {
      const syncData = async () => {
        try {
          const reqConfig = {
            headers: { Authorization: `Bearer ${userInfo.token}` }
          };
          const { data } = await axios.put('http://localhost:5000/api/users/profile', {
            cart: cartItems,
            wishlist: wishlistItems
          }, reqConfig);

          // Update the root user profile cache so page reloads load the DB values
          localStorage.setItem('userInfo', JSON.stringify(data));
        } catch (error) {
          console.error("Failed to sync cart/wishlist to database", error);
        }
      };

      // Debounce the API call by 500ms to prevent spamming the backend during rapid clicks
      const timeoutId = setTimeout(() => {
        syncData();
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [cartItems, wishlistItems, userInfo]);

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/product/:id" element={<ProductScreen />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/login" element={<Login />} />
            <Route path="/shipping" element={<Shipping />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/placeorder" element={<PlaceOrder />} />
            <Route path="/order/:id" element={<OrderScreen />} />
            <Route path="/my-orders" element={<MyOrders />} />
            <Route path="/profile" element={<Profile />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="products" element={<ProductManage />} />
              <Route path="categories" element={<CategoryManage />} />
              <Route path="brands" element={<BrandManage />} />
              <Route path="orders" element={<OrderManage />} />
              <Route path="wholesale" element={<WholesaleInventory />} />
              <Route path="users" element={<UserManage />} />
              <Route path="financials" element={<FinancialDashboard />} />
              <Route path="pos" element={<POSInterface />} />
              <Route path="income-expense" element={<IncomeExpenseManage />} />
              <Route path="settings" element={<SystemSettings />} />
            </Route>
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App
