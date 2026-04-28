import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'Beauty P&C';
const DEFAULT_DESCRIPTION = 'Shop premium beauty and cosmetics products at Beauty P&C. Discover skincare, makeup, haircare, and exclusive bundle deals with fast delivery and authentic guarantee.';
const DEFAULT_URL = 'https://beautypc.vercel.app';

/**
 * SEO component for managing document head meta tags dynamically.
 *
 * @param {object} props
 * @param {string}  props.title        - Page-specific title (will be appended with site name)
 * @param {string}  [props.description] - Meta description for the page
 * @param {string}  [props.canonical]   - Canonical URL path (e.g. "/shop")
 * @param {string}  [props.ogImage]     - Open Graph image URL
 * @param {string}  [props.ogType]      - Open Graph type (default: "website")
 * @param {string}  [props.keywords]    - Comma-separated keywords
 * @param {boolean} [props.noIndex]     - If true, tells search engines not to index this page
 * @param {object}  [props.structuredData] - JSON-LD structured data object
 * @param {object}  [props.product]     - Product data for Product structured data
 */
const SEO = ({
    title,
    description = DEFAULT_DESCRIPTION,
    canonical,
    ogImage,
    ogType = 'website',
    keywords,
    noIndex = false,
    structuredData,
    product,
}) => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} – Premium Beauty & Cosmetics`;
    const canonicalUrl = canonical ? `${DEFAULT_URL}${canonical}` : DEFAULT_URL;

    // Generate Product structured data automatically if product prop is provided
    const productJsonLd = product ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description || description,
        image: product.image || ogImage,
        brand: product.brand ? {
            '@type': 'Brand',
            name: typeof product.brand === 'string' ? product.brand : product.brand?.name,
        } : undefined,
        offers: {
            '@type': 'Offer',
            price: product.price,
            priceCurrency: product.currency || 'USD',
            availability: product.inStock
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            url: canonicalUrl,
        },
        ...(product.rating && {
            aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: product.rating,
                reviewCount: product.numReviews || 0,
            },
        }),
    } : null;

    const jsonLd = structuredData || productJsonLd;

    return (
        <Helmet>
            {/* Primary Meta Tags */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            {keywords && <meta name="keywords" content={keywords} />}
            <link rel="canonical" href={canonicalUrl} />

            {/* Robots */}
            {noIndex && <meta name="robots" content="noindex, nofollow" />}

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={ogType} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:site_name" content={SITE_NAME} />
            {ogImage && <meta property="og:image" content={ogImage} />}

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            {ogImage && <meta name="twitter:image" content={ogImage} />}

            {/* JSON-LD Structured Data */}
            {jsonLd && (
                <script type="application/ld+json">
                    {JSON.stringify(jsonLd)}
                </script>
            )}
        </Helmet>
    );
};

export default SEO;
