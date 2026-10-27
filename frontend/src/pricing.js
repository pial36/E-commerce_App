// A product's `price` is its regular price. `discountPercent` (0-90) is an
// optional per-product discount; the sale price is rounded to whole taka.
// Keep in sync with backend/utils/pricing.js (the server decides what is charged).

export const discountOf = (product) => {
    const percent = Math.round(Number(product?.discountPercent) || 0)
    return percent > 0 && percent <= 90 ? percent : 0
}

export const salePrice = (product) => {
    const percent = discountOf(product)
    return percent ? Math.round(product.price * (100 - percent) / 100) : product.price
}

export const savedAmount = (product) => product.price - salePrice(product)
