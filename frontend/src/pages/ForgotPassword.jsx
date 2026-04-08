import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';

const ForgotPassword = () => {
    const [searchParams] = useSearchParams();
    const token = useMemo(() => searchParams.get('token') || '', [searchParams]);

    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [useOtpMode, setUseOtpMode] = useState(!Boolean(token));
    const [otpRequested, setOtpRequested] = useState(false);

    const isResetMode = Boolean(token) || otpRequested;

    const submitForgotPassword = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const { data } = await axios.post('/api/users/forgot-password', { email });
            toast.success(data?.message || 'If the account exists, reset email and OTP have been sent.');
            setUseOtpMode(true);
            setOtpRequested(true);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit password reset request');
        } finally {
            setSubmitting(false);
        }
    };

    const submitResetPassword = async (e) => {
        e.preventDefault();

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters.');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match.');
            return;
        }

        try {
            setSubmitting(true);
            let data;

            if (useOtpMode) {
                if (!email.trim() || !otp.trim()) {
                    toast.error('Email and OTP are required for OTP reset.');
                    setSubmitting(false);
                    return;
                }

                ({ data } = await axios.post('/api/users/reset-password/otp', {
                    email: email.trim(),
                    otp: otp.trim(),
                    password,
                }));
            } else {
                ({ data } = await axios.post('/api/users/reset-password', {
                    token,
                    password,
                }));
            }

            toast.success(data?.message || 'Password reset successful.');
            setOtp('');
            setPassword('');
            setConfirmPassword('');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reset password');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-page flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-surface border border-default rounded-2xl p-8 shadow-sm">
                <h1 className="text-2xl font-bold text-primary mb-2">
                    {isResetMode ? 'Reset Password' : 'Forgot Password'}
                </h1>
                <p className="text-sm text-secondary mb-6">
                    {isResetMode
                        ? 'Set your new account password below using your link or OTP.'
                        : 'Enter your account email and we will send a reset link and OTP.'}
                </p>

                {!isResetMode ? (
                    <form className="space-y-4" onSubmit={submitForgotPassword}>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            className="w-full px-4 py-2 border border-default rounded-lg bg-page text-primary input-focus"
                        />
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-2.5 rounded-lg bg-brand text-on-brand font-semibold hover:brightness-95 disabled:opacity-60"
                        >
                            {submitting ? 'Sending...' : 'Send Reset Link & OTP'}
                        </button>
                    </form>
                ) : (
                    <form className="space-y-4" onSubmit={submitResetPassword}>
                        {token && (
                            <button
                                type="button"
                                onClick={() => setUseOtpMode((prev) => !prev)}
                                className="w-full py-2.5 rounded-lg border border-default text-secondary font-semibold hover:text-brand hover:border-brand"
                            >
                                {useOtpMode ? 'Use Reset Link Token Instead' : 'Use OTP Code Instead'}
                            </button>
                        )}

                        {useOtpMode && (
                            <>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Account email"
                                    className="w-full px-4 py-2 border border-default rounded-lg bg-page text-primary input-focus"
                                />
                                <input
                                    type="text"
                                    required
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="Enter 6-digit OTP"
                                    maxLength={6}
                                    className="w-full px-4 py-2 border border-default rounded-lg bg-page text-primary input-focus"
                                />
                            </>
                        )}

                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="New password"
                            className="w-full px-4 py-2 border border-default rounded-lg bg-page text-primary input-focus"
                        />
                        <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            className="w-full px-4 py-2 border border-default rounded-lg bg-page text-primary input-focus"
                        />
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-2.5 rounded-lg bg-brand text-on-brand font-semibold hover:brightness-95 disabled:opacity-60"
                        >
                            {submitting ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                )}

                <Link to="/login" className="inline-block mt-6 text-sm font-medium text-brand hover:brightness-110">
                    Back to login
                </Link>
            </div>
        </div>
    );
};

export default ForgotPassword;
