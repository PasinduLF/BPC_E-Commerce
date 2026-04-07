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
    const [submitting, setSubmitting] = useState(false);

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
        setSubmitting(true);
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
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-page flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">

            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[600px] h-[600px] rounded-full bg-brand opacity-20 blur-3xl -z-10"></div>
            <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[400px] h-[400px] rounded-full bg-brand opacity-10 blur-3xl -z-10"></div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-primary tracking-tight">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="mt-2 text-center text-sm text-secondary">
                    {isLogin ? 'Sign in to access your Beauty P&C profile' : 'Join Beauty P&C to discover premium cosmetics'}
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-surface/80 backdrop-blur-xl py-8 px-4 shadow-xl shadow-brand-subtle sm:rounded-2xl sm:px-10 border border-default/40">

                    {error && (
                        <div className="mb-6 p-4 rounded-lg bg-error-bg text-error text-sm border border-error-bg text-center">
                            {error}
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={submitHandler}>

                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-primary">Full Name</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-tertiary">
                                        <User size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        className="block w-full pl-10 pr-3 py-2 border border-default rounded-lg input-focus bg-page text-primary text-sm"
                                        placeholder="Enter your name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-primary">Email Address</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-tertiary">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="block w-full pl-10 pr-3 py-2 border border-default rounded-lg input-focus bg-page text-primary text-sm"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-medium text-primary">Password</label>
                                {isLogin && (
                                    <a href="#" className="font-medium text-sm text-brand hover:brightness-110">
                                        Forgot password?
                                    </a>
                                )}
                            </div>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-tertiary">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="block w-full pl-10 pr-3 py-2 border border-default rounded-lg input-focus bg-page text-primary text-sm"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 btn-primary rounded-lg shadow-sm text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Please wait...' : (isLogin ? 'Sign In' : 'Sign Up')} <ArrowRight size={18} />
                        </button>

                    </form>

                    <div className="mt-8 text-center text-sm text-secondary">
                        {isLogin ? (
                            <span>
                                New to Beauty P&C?{' '}
                                <button disabled={submitting} onClick={() => setIsLogin(false)} className="font-medium text-brand hover:brightness-110 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                                    Create an account
                                </button>
                            </span>
                        ) : (
                            <span>
                                Already have an account?{' '}
                                <button disabled={submitting} onClick={() => setIsLogin(true)} className="font-medium text-brand hover:brightness-110 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
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
