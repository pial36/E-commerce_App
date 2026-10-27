// A product's `price` is its regular price. `discountPercent` (0-90) is an
// optional per-product discount; the sale price is rounded to whole taka.
// Keep in sync with frontend/src/pricing.js.

export const MAX_DISCOUNT_PERCENT = 90

export const discountOf = (product) => {
    const percent = Math.round(Number(product?.discountPercent) || 0)
    return percent > 0 && percent <= MAX_DISCOUNT_PERCENT ? percent : 0
}

export const salePrice = (product) => {
    const percent = discountOf(product)
    return percent ? Math.round(product.price * (100 - percent) / 100) : product.price
}

// Validates a discount sent from the admin panel; returns the number or throws
export const parseDiscountPercent = (value) => {
    if (value === undefined || value === null || value === '') return 0
    const percent = Number(value)
    if (!Number.isInteger(percent) || percent < 0 || percent > MAX_DISCOUNT_PERCENT) {
        throw new Error(`Discount must be a whole number from 0 to ${MAX_DISCOUNT_PERCENT}`)
    }
    return percent
}
