const { z } = require('zod');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');
const nonEmptyString = z.string().trim().min(1);
const optionalString = z.string().trim().optional();
const positiveNumber = z.coerce.number().nonnegative();

const authUserSchema = z.object({
    body: z.object({
        email: z.string().trim().toLowerCase().email(),
        password: z.string().min(1),
    }),
});

const registerUserSchema = z.object({
    body: z.object({
        name: nonEmptyString,
        email: z.string().trim().toLowerCase().email(),
        password: z.string().min(6),
    }),
});

const emailSchema = z.object({
    body: z.object({
        email: z.string().trim().toLowerCase().email(),
    }),
});

const signupOtpSchema = z.object({
    body: z.object({
        name: nonEmptyString,
        email: z.string().trim().toLowerCase().email(),
    }),
});

const verifyOtpSchema = z.object({
    body: z.object({
        email: z.string().trim().toLowerCase().email(),
        otp: z.string().trim().min(4).max(12),
    }),
});

const completeSignupSchema = z.object({
    body: z.object({
        email: z.string().trim().toLowerCase().email(),
        password: z.string().min(6),
    }),
});

const resetPasswordSchema = z.object({
    body: z.object({
        token: nonEmptyString,
        password: z.string().min(6),
    }),
});

const resetPasswordOtpSchema = z.object({
    body: z.object({
        email: z.string().trim().toLowerCase().email(),
        otp: z.string().trim().min(4).max(12),
        password: z.string().min(6),
    }),
});

const orderItemSchema = z.object({
    _id: z.string().optional(),
    product: z.string().optional(),
    bundle: z.string().optional(),
    name: z.string().optional(),
    qty: z.coerce.number().int().positive(),
    image: z.string().optional(),
    price: z.coerce.number().optional(),
    variantId: z.string().optional(),
    variant: z.any().optional(),
    isBundle: z.boolean().optional(),
    bundleProducts: z.array(z.any()).optional(),
}).passthrough();

const shippingAddressSchema = z.object({
    name: nonEmptyString,
    address: nonEmptyString,
    city: nonEmptyString,
    postalCode: nonEmptyString,
    country: nonEmptyString,
    phone: nonEmptyString,
});

const createOrderSchema = z.object({
    body: z.object({
        orderItems: z.array(orderItemSchema).min(1),
        shippingAddress: shippingAddressSchema,
        paymentMethod: z.enum(['Cash on Delivery', 'Bank Transfer', 'Cash']).optional(),
        paymentSlip: z.object({
            url: z.string().url().optional(),
            public_id: z.string().optional(),
        }).optional().nullable(),
        shippingPrice: z.coerce.number().nonnegative().optional(),
        fulfillmentType: z.enum(['delivery', 'pickup']).optional(),
    }),
});

const idParamSchema = z.object({
    params: z.object({ id: objectId }),
});

const updateOrderStatusSchema = z.object({
    params: z.object({ id: objectId }),
    body: z.object({
        status: z.enum(['Pending', 'Processing', 'Payment Verified', 'Ready for Pickup', 'Shipped', 'Delivered', 'Cancelled']).optional(),
        paymentStatus: z.enum(['paid', 'unpaid']).optional(),
        deliveryStatus: z.enum(['delivered', 'processing']).optional(),
        isReadyForPickup: z.boolean().optional(),
    }),
});

const paymentSlipSchema = z.object({
    params: z.object({ id: objectId }),
    body: z.object({
        paymentSlipUrl: z.string().url(),
        paymentSlipPublicId: z.string().optional(),
    }),
});

const variantSchema = z.object({
    _id: z.string().optional(),
    name: nonEmptyString,
    value: nonEmptyString,
    price: z.coerce.number().nonnegative(),
    discountPrice: z.coerce.number().nonnegative().optional(),
    costPrice: z.coerce.number().nonnegative().optional(),
    stock: z.coerce.number().int().nonnegative(),
    image: z.string().optional(),
});

const productSchema = z.object({
    body: z.object({
        name: nonEmptyString.optional(),
        sku: optionalString,
        price: positiveNumber.optional(),
        discountPrice: positiveNumber.optional(),
        costPrice: positiveNumber.optional(),
        description: optionalString,
        descriptionSections: z.record(z.string(), z.string()).optional(),
        images: z.array(z.object({
            public_id: nonEmptyString,
            url: nonEmptyString,
        })).optional(),
        category: z.string().optional().nullable(),
        subcategory: z.string().optional(),
        innerSubcategory: z.string().optional(),
        brand: z.string().optional(),
        stock: z.coerce.number().int().nonnegative().optional(),
        variants: z.array(variantSchema).optional(),
        isFeatured: z.boolean().optional(),
        isActive: z.boolean().optional(),
    }),
});

const createPosOrderSchema = z.object({
    body: z.object({
        orderItems: z.array(orderItemSchema).min(1),
        paymentMethod: z.enum(['Cash', 'Bank Transfer', 'Credit']).optional(),
        customerName: z.string().optional(),
        customerPhone: z.string().optional(),
        cashGiven: z.coerce.number().nonnegative().optional(),
        discountType: z.enum(['none', 'percentage', 'fixed']).optional(),
        discountValue: z.coerce.number().nonnegative().optional(),
        applyCreditAmount: z.coerce.number().nonnegative().optional(),
        note: z.string().optional(),
    }),
});

const customerPaymentSchema = z.object({
    body: z.object({
        customerName: nonEmptyString,
        customerPhone: nonEmptyString,
        amount: z.coerce.number().positive(),
        paymentMethod: z.enum(['Cash', 'Bank Transfer']).optional(),
        note: z.string().optional(),
    }),
});

const financialQuerySchema = z.object({
    query: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        limit: z.coerce.number().int().positive().max(5000).optional(),
    }),
});

module.exports = {
    authUserSchema,
    registerUserSchema,
    emailSchema,
    signupOtpSchema,
    verifyOtpSchema,
    completeSignupSchema,
    resetPasswordSchema,
    resetPasswordOtpSchema,
    createOrderSchema,
    idParamSchema,
    updateOrderStatusSchema,
    paymentSlipSchema,
    productSchema,
    createPosOrderSchema,
    customerPaymentSchema,
    financialQuerySchema,
};
