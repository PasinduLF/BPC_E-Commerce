/**
 * Convert a string into a URL-friendly slug.
 * Example: "Vitamin C Brightening Serum (30ml)" → "vitamin-c-brightening-serum-30ml"
 *
 * @param {string} text - The text to slugify
 * @returns {string} The slugified string
 */
const slugify = (text = '') =>
    String(text)
        .toLowerCase()
        .trim()
        .replace(/['']/g, '')                   // Remove apostrophes
        .replace(/&/g, 'and')                   // Replace & with 'and'
        .replace(/[^a-z0-9\s-]/g, '')           // Remove non-alphanumeric
        .replace(/[\s_]+/g, '-')                // Spaces/underscores to hyphens
        .replace(/-+/g, '-')                    // Collapse consecutive hyphens
        .replace(/^-|-$/g, '');                 // Trim leading/trailing hyphens

module.exports = slugify;
