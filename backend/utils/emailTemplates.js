const escapeHtml = (value = '') =>
    String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#39;');

const money = (value) => `P${Number(value || 0).toFixed(2)}`;

const baseTemplate = ({ title, intro, bodyLines = [], ctaLabel, ctaUrl, footerNote }) => {
    const safeTitle = escapeHtml(title);
    const safeIntro = escapeHtml(intro);
    const safeFooter = escapeHtml(footerNote || 'Thank you for choosing Beauty P&C.');

    const bodyHtml = bodyLines
        .filter(Boolean)
        .map((line) => `<p style="margin:0 0 10px;color:#374151;line-height:1.6;">${escapeHtml(line)}</p>`)
        .join('');

    const ctaHtml = ctaLabel && ctaUrl
        ? `<p style="margin:20px 0 0;"><a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:#1f6f5f;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600;">${escapeHtml(ctaLabel)}</a></p>`
        : '';

    return {
        html: `
            <div style="background:#f3f4f6;padding:24px 12px;font-family:Arial,sans-serif;">
                <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
                    <div style="background:#111827;padding:18px 24px;">
                        <h1 style="margin:0;color:#ffffff;font-size:20px;">Beauty P&C</h1>
                    </div>
                    <div style="padding:24px;">
                        <h2 style="margin:0 0 12px;font-size:20px;color:#111827;">${safeTitle}</h2>
                        <p style="margin:0 0 14px;color:#374151;line-height:1.6;">${safeIntro}</p>
                        ${bodyHtml}
                        ${ctaHtml}
                    </div>
                    <div style="background:#f9fafb;padding:16px 24px;border-top:1px solid #e5e7eb;">
                        <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.5;">${safeFooter}</p>
                    </div>
                </div>
            </div>
        `,
        text: [title, intro, ...bodyLines.filter(Boolean), ctaLabel && ctaUrl ? `${ctaLabel}: ${ctaUrl}` : '', footerNote || 'Thank you for choosing Beauty P&C.']
            .filter(Boolean)
            .join('\n'),
    };
};

const templates = {
    verifyEmail: ({ name, verifyUrl, otpCode }) => ({
        subject: 'Verify your Beauty P&C account',
        ...baseTemplate({
            title: 'Verify Your Email Address',
            intro: `Hi ${name || 'Customer'}, please verify your email to activate your account.`,
            bodyLines: [
                'For security, this verification link will expire soon.',
                otpCode ? `OTP Code: ${otpCode}` : '',
                'You can use either the button link or the OTP code in the verification page.',
            ],
            ctaLabel: 'Verify Email',
            ctaUrl: verifyUrl,
        }),
    }),

    registrationSuccess: ({ name }) => ({
        subject: 'Welcome to Beauty P&C',
        ...baseTemplate({
            title: 'Registration Successful',
            intro: `Hi ${name || 'Customer'}, your account is now active.`,
            bodyLines: ['You can now place orders, track deliveries, and review products.'],
        }),
    }),

    forgotPassword: ({ name, resetUrl, otpCode }) => ({
        subject: 'Reset your Beauty P&C password',
        ...baseTemplate({
            title: 'Password Reset Request',
            intro: `Hi ${name || 'Customer'}, we received a request to reset your password.`,
            bodyLines: [
                'If you made this request, use the button below to set a new password. If not, you can ignore this email.',
                otpCode ? `OTP Code: ${otpCode}` : '',
                'You can use either the reset link or this OTP code in the forgot password page.',
            ],
            ctaLabel: 'Reset Password',
            ctaUrl: resetUrl,
            footerNote: 'If you did not request this reset, no action is needed.',
        }),
    }),

    orderPlaced: ({ name, orderNumber, totalPrice, fulfillmentType }) => ({
        subject: `Order received: ${orderNumber}`,
        ...baseTemplate({
            title: 'Order Placed Successfully',
            intro: `Hi ${name || 'Customer'}, your order ${orderNumber} has been placed.`,
            bodyLines: [
                `Total: ${money(totalPrice)}`,
                `Fulfillment: ${fulfillmentType === 'pickup' ? 'Store Pickup' : 'Delivery'}`,
                'We will notify you as your order progresses.',
            ],
        }),
    }),

    adminOrderReceived: ({ orderNumber, customerName, customerEmail, totalPrice, fulfillmentType }) => ({
        subject: `New order received: ${orderNumber}`,
        ...baseTemplate({
            title: 'New Customer Order',
            intro: `A new order ${orderNumber} has been received.`,
            bodyLines: [
                `Customer: ${customerName || 'N/A'}`,
                `Email: ${customerEmail || 'N/A'}`,
                `Total: ${money(totalPrice)}`,
                `Fulfillment: ${fulfillmentType === 'pickup' ? 'Store Pickup' : 'Delivery'}`,
            ],
            footerNote: 'Admin notification from Beauty P&C order system.',
        }),
    }),

    paymentVerified: ({ name, orderNumber }) => ({
        subject: `Payment verified for ${orderNumber}`,
        ...baseTemplate({
            title: 'Payment Verified',
            intro: `Hi ${name || 'Customer'}, we verified your payment for order ${orderNumber}.`,
            bodyLines: ['Your order is now being prepared for delivery or pickup.'],
        }),
    }),

    orderDelivered: ({ name, orderNumber }) => ({
        subject: `Order delivered: ${orderNumber}`,
        ...baseTemplate({
            title: 'Order Delivered',
            intro: `Hi ${name || 'Customer'}, your order ${orderNumber} has been delivered.`,
            bodyLines: ['Thank you for shopping with Beauty P&C.'],
        }),
    }),

    pickupReady: ({ name, orderNumber, pickupStore }) => ({
        subject: `Pickup ready: ${orderNumber}`,
        ...baseTemplate({
            title: 'Your Pickup Order Is Ready',
            intro: `Hi ${name || 'Customer'}, your order ${orderNumber} is ready for pickup.`,
            bodyLines: [
                `Store: ${pickupStore?.storeName || 'Beauty P&C Store'}`,
                `Address: ${pickupStore?.address || ''} ${pickupStore?.city || ''}`.trim(),
                pickupStore?.phone ? `Phone: ${pickupStore.phone}` : '',
            ],
        }),
    }),

    reviewGiven: ({ name, productName }) => ({
        subject: 'Thanks for your review',
        ...baseTemplate({
            title: 'Review Submitted',
            intro: `Hi ${name || 'Customer'}, thank you for reviewing ${productName}.`,
            bodyLines: ['Your feedback helps other customers shop with confidence.'],
        }),
    }),
};

module.exports = { templates };
