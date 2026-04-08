import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [status, setStatus] = useState(token ? 'loading' : 'idle');
    const [message, setMessage] = useState(token ? 'Verifying your email...' : 'Enter your email and OTP code to verify.');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const verify = async () => {
            if (!token) {
                return;
            }

            try {
                const { data } = await axios.get(`/api/users/verify-email?token=${encodeURIComponent(token)}`);
                setStatus('success');
                setMessage(data?.message || 'Email verified successfully.');
            } catch (error) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'Unable to verify email. Please request a new verification email.');
            }
        };

        verify();
    }, [token]);

    const verifyWithOtpHandler = async (e) => {
        e.preventDefault();
        if (!email.trim() || !otp.trim()) {
            toast.error('Email and OTP are required.');
            return;
        }

        try {
            setSubmitting(true);
            const { data } = await axios.post('/api/users/verify-email/otp', {
                email: email.trim(),
                otp: otp.trim(),
            });
            setStatus('success');
            setMessage(data?.message || 'Email verified successfully. You can now sign in.');
            toast.success('Email verified successfully.');
        } catch (error) {
            setStatus('error');
            setMessage(error.response?.data?.message || 'Unable to verify email with OTP.');
            toast.error(error.response?.data?.message || 'Unable to verify email with OTP.');
        } finally {
            setSubmitting(false);
        }
    };

    const resendVerificationHandler = async () => {
        if (!email.trim()) {
            toast.error('Enter your email to resend verification.');
            return;
        }

        try {
            setSubmitting(true);
            const { data } = await axios.post('/api/users/verify-email/resend', { email: email.trim() });
            toast.success(data?.message || 'Verification email sent.');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to resend verification email.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-page flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-surface border border-default rounded-2xl p-8 shadow-sm text-center">
                <h1 className="text-2xl font-bold text-primary mb-3">Email Verification</h1>
                <p className={`text-sm ${status === 'success' ? 'text-green-600' : status === 'error' ? 'text-error' : 'text-secondary'}`}>
                    {message}
                </p>

                <form onSubmit={verifyWithOtpHandler} className="mt-6 space-y-3 text-left">
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
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
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-2.5 rounded-lg bg-brand text-on-brand font-semibold hover:brightness-95 disabled:opacity-60"
                    >
                        {submitting ? 'Verifying...' : 'Verify With OTP'}
                    </button>
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={resendVerificationHandler}
                        className="w-full py-2.5 rounded-lg border border-default text-secondary font-semibold hover:text-brand hover:border-brand disabled:opacity-60"
                    >
                        Resend Email and OTP
                    </button>
                </form>

                <Link
                    to="/login"
                    className="inline-flex mt-6 px-4 py-2 rounded-lg bg-brand text-on-brand font-semibold hover:brightness-95 transition-colors"
                >
                    Go to Login
                </Link>
            </div>
        </div>
    );
};

export default VerifyEmail;
