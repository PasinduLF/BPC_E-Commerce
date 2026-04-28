import { useState, useEffect } from 'react';
import SEO from '../components/SEO';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../context/useAuthStore';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [signupStep, setSignupStep] = useState('email');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [signupOtp, setSignupOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [infoMessage, setInfoMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [needsEmailVerification, setNeedsEmailVerification] = useState(false);

    const navigate = useNavigate();
    const { search } = useLocation();
    const { userInfo, setCredentials } = useAuthStore();

    const redirect = new URLSearchParams(search).get('redirect') || '/';

    useEffect(() => {
        if (userInfo) {
            navigate(redirect);
        }
    }, [navigate, userInfo, redirect]);

    const resetSignupState = () => {
        setSignupStep('email');
        setSignupOtp('');
        setPassword('');
        setConfirmPassword('');
        setShowPassword(false);
        setShowConfirmPassword(false);
    };

    const submitHandler = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        setInfoMessage('');
        setNeedsEmailVerification(false);
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            let { data } = {};

            if (isLogin) {
                ({ data } = await axios.post(
                    '/api/users/auth',
                    { email, password },
                    config
                ));

                setCredentials(data);
                navigate(redirect);
            } else {
                if (signupStep === 'email') {
                    ({ data } = await axios.post(
                        '/api/users/signup/send-otp',
                        { name, email },
                        config
                    ));

                    setSignupStep('otp');
                    setInfoMessage(data?.message || 'OTP sent to your email.');
                    toast.success('OTP sent to your email.');
                } else if (signupStep === 'otp') {
                    ({ data } = await axios.post(
                        '/api/users/signup/verify-otp',
                        { email, otp: signupOtp },
                        config
                    ));

                    setSignupStep('password');
                    setInfoMessage(data?.message || 'OTP verified. Set your password to complete signup.');
                    toast.success('OTP verified. Set your password.');
                } else {
                    if (password !== confirmPassword) {
                        setError('Passwords do not match.');
                        setSubmitting(false);
                        return;
                    }

                    ({ data } = await axios.post(
                        '/api/users/signup/complete',
                        { email, password },
                        config
                    ));

                    setInfoMessage(data?.message || 'Account created successfully. Please sign in.');
                    toast.success('Account created successfully. Please sign in.');
                    setIsLogin(true);
                    resetSignupState();
                }
            }
        } catch (err) {
            const apiMessage = err.response?.data?.message || err.message;
            setError(apiMessage);
            setNeedsEmailVerification(Boolean(err.response?.data?.needsEmailVerification));
        } finally {
            setSubmitting(false);
        }
    };

    const resendVerificationHandler = async () => {
        const trimmedEmail = String(email || '').trim();
        if (!trimmedEmail) {
            setError('Please enter your email first to resend verification.');
            return;
        }

        try {
            setSubmitting(true);
            const { data } = await axios.post('/api/users/verify-email/resend', { email: trimmedEmail });
            toast.success(data?.message || 'Verification email sent.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend verification email');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-page flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            <SEO title={isLogin ? 'Sign In' : 'Create Account'} noIndex />

            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[280px] h-[280px] sm:w-[600px] sm:h-[600px] rounded-full bg-brand opacity-20 blur-3xl -z-10"></div>
            <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[220px] h-[220px] sm:w-[400px] sm:h-[400px] rounded-full bg-brand opacity-10 blur-3xl -z-10"></div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-primary tracking-tight">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="mt-2 text-center text-sm text-secondary">
                    {isLogin ? 'Sign in to access your Beauty P&C profile' : 'Join Beauty P&C to discover premium cosmetics'}
                </p>
                {!isLogin && (
                    <div className="mt-4 flex justify-center">
                        <span className="inline-flex items-center rounded-full border border-brand/20 bg-brand-subtle px-3 py-1 text-xs font-bold tracking-wider text-brand">
                            {signupStep === 'email' ? '1/3' : signupStep === 'otp' ? '2/3' : '3/3'}
                        </span>
                    </div>
                )}
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-surface/80 backdrop-blur-xl py-8 px-4 shadow-xl shadow-brand-subtle sm:rounded-2xl sm:px-10 border border-default/40">

                    {error && (
                        <div className="mb-6 p-4 rounded-lg bg-error-bg text-error text-sm border border-error-bg text-center">
                            {error}
                        </div>
                    )}

                    {infoMessage && (
                        <div className="mb-6 p-4 rounded-lg bg-brand-subtle text-brand text-sm border border-brand/20 text-center">
                            {infoMessage}
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
                                        disabled={signupStep !== 'email'}
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
                                    disabled={!isLogin && signupStep !== 'email'}
                                />
                            </div>
                        </div>

                        {!isLogin && signupStep === 'otp' && (
                            <div>
                                <label className="block text-sm font-medium text-primary">OTP Code</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-tertiary">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        className="block w-full pl-10 pr-3 py-2 border border-default rounded-lg input-focus bg-page text-primary text-sm"
                                        placeholder="Enter 6-digit OTP"
                                        value={signupOtp}
                                        onChange={(e) => setSignupOtp(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {(isLogin || signupStep === 'password') && (
                        <div>
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-medium text-primary">Password</label>
                                {isLogin && (
                                    <Link to="/forgot-password" className="font-medium text-sm text-brand hover:brightness-110">
                                        Forgot password?
                                    </Link>
                                )}
                            </div>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-tertiary">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    className="block w-full pl-10 pr-10 py-2 border border-default rounded-lg input-focus bg-page text-primary text-sm"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-tertiary hover:text-brand"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        )}

                        {!isLogin && signupStep === 'password' && (
                            <div>
                                <label className="block text-sm font-medium text-primary">Confirm Password</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-tertiary">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        required
                                        className="block w-full pl-10 pr-10 py-2 border border-default rounded-lg input-focus bg-page text-primary text-sm"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-tertiary hover:text-brand"
                                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 btn-primary rounded-lg shadow-sm text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {submitting
                                ? 'Please wait...'
                                : isLogin
                                    ? 'Sign In'
                                    : signupStep === 'email'
                                        ? 'Send OTP'
                                        : signupStep === 'otp'
                                            ? 'Verify OTP'
                                            : 'Create Account'} <ArrowRight size={18} />
                        </button>

                    </form>

                    {!isLogin && signupStep === 'otp' && (
                        <div className="mt-4 text-center">
                            <button
                                type="button"
                                disabled={submitting}
                                onClick={async () => {
                                    try {
                                        setSubmitting(true);
                                        const { data } = await axios.post('/api/users/signup/send-otp', { name, email });
                                        setInfoMessage(data?.message || 'OTP resent to your email.');
                                        toast.success('OTP resent to your email.');
                                    } catch (err) {
                                        setError(err.response?.data?.message || 'Failed to resend OTP');
                                    } finally {
                                        setSubmitting(false);
                                    }
                                }}
                                className="text-sm font-medium text-brand hover:brightness-110 disabled:opacity-60"
                            >
                                Resend OTP
                            </button>
                        </div>
                    )}

                    {isLogin && needsEmailVerification && (
                        <div className="mt-4 text-center space-y-2">
                            <button
                                type="button"
                                disabled={submitting}
                                onClick={resendVerificationHandler}
                                className="text-sm font-medium text-brand hover:brightness-110 disabled:opacity-60"
                            >
                                Resend verification email
                            </button>
                            <div>
                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={() => navigate(`/verify-email${email ? `?email=${encodeURIComponent(email)}` : ''}`)}
                                    className="text-sm font-medium text-brand hover:brightness-110 disabled:opacity-60"
                                >
                                    Verify with OTP code
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="mt-8 text-center text-sm text-secondary">
                        {isLogin ? (
                            <span>
                                New to Beauty P&C?{' '}
                                <button
                                    disabled={submitting}
                                    onClick={() => {
                                        setIsLogin(false);
                                        resetSignupState();
                                        setError('');
                                        setInfoMessage('');
                                    }}
                                    className="font-medium text-brand hover:brightness-110 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    Create an account
                                </button>
                            </span>
                        ) : (
                            <span>
                                Already have an account?{' '}
                                <button
                                    disabled={submitting}
                                    onClick={() => {
                                        setIsLogin(true);
                                        resetSignupState();
                                        setError('');
                                        setInfoMessage('');
                                    }}
                                    className="font-medium text-brand hover:brightness-110 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                >
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
