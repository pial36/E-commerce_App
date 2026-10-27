// Meta (Facebook) Pixel for the store.
//
// The pixel ID comes from VITE_META_PIXEL_ID at build time (set it in
// Hostinger's frontend environment variables, then rebuild). Without it the
// pixel script is never loaded and every call below does nothing.
//
// Standard events sent: PageView (every route change), ViewContent,
// AddToCart, InitiateCheckout and Purchase, with prices in BDT.

const PIXEL_ID = (import.meta.env.VITE_META_PIXEL_ID || '').trim()
const CURRENCY = 'BDT'

let started = false

export const pixelEnabled = () => Boolean(PIXEL_ID)

// Meta's standard loader, written out so fbq queues calls until fbevents.js loads
const loadPixel = () => {
    if (window.fbq) return
    const fbq = function (...args) {
        fbq.callMethod ? fbq.callMethod(...args) : fbq.queue.push(args)
    }
    window.fbq = fbq
    window._fbq = fbq
    fbq.push = fbq
    fbq.loaded = true
    fbq.version = '2.0'
    fbq.queue = []

    const script = document.createElement('script')
    script.async = true
    script.src = 'https://connect.facebook.net/en_US/fbevents.js'
    document.head.appendChild(script)
}

const startPixel = () => {
    if (!PIXEL_ID) return false
    if (!started) {
        loadPixel()
        window.fbq('init', PIXEL_ID)
        started = true
    }
    return true
}

const track = (event, params, eventId) => {
    if (!startPixel()) return
    window.fbq('track', event, params, eventId ? { eventID: String(eventId) } : undefined)
}

export const trackPageView = () => track('PageView')

export const trackViewContent = (product) => track('ViewContent', {
    content_ids: [product._id],
    content_name: product.name,
    content_category: product.category,
    content_type: 'product',
    value: product.price,
    currency: CURRENCY,
})

export const trackAddToCart = (product, quantity = 1) => track('AddToCart', {
    content_ids: [product._id],
    content_name: product.name,
    content_type: 'product',
    contents: [{ id: product._id, quantity }],
    value: product.price * quantity,
    currency: CURRENCY,
})

// lines: [{ product, quantity }]
const contentsOf = (lines) => ({
    content_ids: [...new Set(lines.map(line => line.product._id))],
    content_type: 'product',
    contents: lines.map(line => ({ id: line.product._id, quantity: line.quantity, item_price: line.product.price })),
    num_items: lines.reduce((sum, line) => sum + line.quantity, 0),
})

export const trackInitiateCheckout = (lines, value) => track('InitiateCheckout', {
    ...contentsOf(lines),
    value,
    currency: CURRENCY,
})

// orderId doubles as the event ID so a later server-side (Conversions API)
// Purchase for the same order is counted once
export const trackPurchase = ({ orderId, value, lines = [] }) => track('Purchase', {
    ...(lines.length ? contentsOf(lines) : { content_type: 'product' }),
    value,
    currency: CURRENCY,
}, orderId)
