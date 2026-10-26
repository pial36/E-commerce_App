// A cart line is one product + size + the product image the customer picked
// (the photos of one product can show different colours). Lines are stored
// as cartItems[productId][key], where key is the size for the first image
// ("M") or size::imageIndex for another one ("M::2"). Carts saved before
// image choice existed only have plain size keys, which mean the first image.
const SEPARATOR = '::'

export const makeCartKey = (size, imageIndex = 0) =>
    imageIndex > 0 ? `${size}${SEPARATOR}${imageIndex}` : String(size)

export const parseCartKey = (key) => {
    const [size, index] = String(key).split(SEPARATOR)
    return { size, imageIndex: Number(index) || 0 }
}

// The picture to show for a cart line (falls back to the first image)
export const lineImage = (product, imageIndex) => product.image[imageIndex] || product.image[0]
