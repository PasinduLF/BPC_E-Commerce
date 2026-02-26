import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../context/useAuthStore';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const { search } = useLocation();
    const { userInfo, setCredentials } = useAuthStore();

    const redirect = new URLSearchParams(search).get('redirect') || '/';

    useEffect(() => {
        if (userInfo) {
            navigate(redirect);
        }
    }, [navigate, userInfo, redirect]);

    const submitHandler = async (e) => {
        e.preventDefault();
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            let { data } = {};

            if (isLogin) {
                ({ data } = await axios.post(
                    'http://localhost:5000/api/users/auth',
                    { email, password },
                    config
                ));
            } else {
                ({ data } = await axios.post(
                    'http://localhost:5000/api/users',
                    { name, email, password },
                    config
                ));
            }

            setCredentials(data);
            navigate(redirect);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">

            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-pink-200 to-rose-100 opacity-50 blur-3xl -z-10"></div>
            <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-pink-300 to-pink-100 opacity-40 blur-3xl -z-10"></div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600">
                    {isLogin ? 'Sign in to access your Beauty P&C profile' : 'Join Beauty P&C to discover premium cosmetics'}
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white/80 backdrop-blur-xl py-8 px-4 shadow-xl shadow-pink-100/50 sm:rounded-2xl sm:px-10 border border-white/40">

                    {error && (
                        <div className="mb-6 p-4 rounded-lg bg-rose-50 text-rose-600 text-sm border border-rose-100 text-center">
                            {error}
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={submitHandler}>

                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Full Name</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                        <User size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg input-focus bg-slate-50 text-sm"
                                        placeholder="Enter your name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700">Email Address</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg input-focus bg-slate-50 text-sm"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-medium text-slate-700">Password</label>
                                {isLogin && (
                                    <a href="#" className="font-medium text-sm text-pink-600 hover:text-pink-500">
                                        Forgot password?
                                    </a>
                                )}
                            </div>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg input-focus bg-slate-50 text-sm"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all hover:shadow-lg hover:shadow-pink-200"
                        >
                            {isLogin ? 'Sign In' : 'Sign Up'} <ArrowRight size={18} />
                        </button>

                    </form>

                    <div className="mt-8 text-center text-sm text-slate-600">
                        {isLogin ? (
                            <span>
                                New to Beauty P&C?{' '}
                                <button onClick={() => setIsLogin(false)} className="font-medium text-pink-600 hover:text-pink-500 transition-colors">
                                    Create an account
                                </button>
                            </span>
                        ) : (
                            <span>
                                Already have an account?{' '}
                                <button onClick={() => setIsLogin(true)} className="font-medium text-pink-600 hover:text-pink-500 transition-colors">
                                    Sign in instead
                                </button>
                            </span>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Login;
