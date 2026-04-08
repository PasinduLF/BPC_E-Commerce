import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import axios from 'axios';
import { Toaster } from 'sonner';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(() => import('./pages/Shop'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const ProductScreen = lazy(() => import('./pages/ProductScreen'));
const Cart = lazy(() => import('./pages/Cart'));
const Login = lazy(() => import('./pages/Login'));
const Shipping = lazy(() => import('./pages/Shipping'));
const Payment = lazy(() => import('./pages/Payment'));
const PlaceOrder = lazy(() => import('./pages/PlaceOrder'));
const OrderScreen = lazy(() => import('./pages/OrderScreen'));
const MyOrders = lazy(() => import('./pages/MyOrders'));
const Profile = lazy(() => import('./pages/Profile'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));

// Admin Components
const AdminLayout = lazy(() => import('./components/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const ProductManage = lazy(() => import('./pages/admin/ProductManage'));
const CategoryManage = lazy(() => import('./pages/admin/CategoryManage'));
const BrandManage = lazy(() => import('./pages/admin/BrandManage'));
const OrderManage = lazy(() => import('./pages/admin/OrderManage'));
const WholesaleInventory = lazy(() => import('./pages/admin/WholesaleInventory'));
const UserManage = lazy(() => import('./pages/admin/UserManage'));
const CustomerCreditDashboard = lazy(() => import('./pages/admin/CustomerCreditDashboard'));
const FinancialDashboard = lazy(() => import('./pages/admin/FinancialDashboard'));
const POSInterface = lazy(() => import('./pages/admin/POSInterface'));
const IncomeExpenseManage = lazy(() => import('./pages/admin/IncomeExpenseManage'));
const SystemSettings = lazy(() => import('./pages/admin/SystemSettings'));
import { useConfigStore } from './context/useConfigStore';
import { useCartStore } from './context/useCartStore';
import { useWishlistStore } from './context/useWishlistStore';
import { useAuthStore } from './context/useAuthStore';

import ScrollToTop from './components/ScrollToTop';

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
          const { data } = await axios.put('/api/users/profile', {
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
      <ScrollToTop />
      <AppShell />
    </BrowserRouter>
  );
}

function AppShell() {
  const location = useLocation();

  return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pb-16 md:pb-0">
          <Suspense fallback={<div className="py-20 text-center text-secondary">Loading...</div>}>
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
                <Route path="customer-credit" element={<CustomerCreditDashboard />} />
                <Route path="financials" element={<FinancialDashboard />} />
                <Route path="pos" element={<POSInterface />} />
                <Route path="income-expense" element={<IncomeExpenseManage />} />
                <Route path="settings" element={<SystemSettings />} />
              </Route>
            </Routes>
          </Suspense>
        </main>
        {!location.pathname.startsWith('/admin') && <Footer />}
        <Toaster richColors position="top-right" />
      </div>
  );
}

export default App
