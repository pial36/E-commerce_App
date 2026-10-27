import React from 'react'
import { useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import { Link } from 'react-router-dom';
import { discountOf, salePrice } from '../pricing';

const TagIcon = () => (
  <svg className='w-3 h-3' viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
    <path d='M21.4 11.6 12.4 2.6A2 2 0 0 0 11 2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 .6 1.4l9 9a2 2 0 0 0 2.8 0l7-7a2 2 0 0 0 0-2.8zM6.5 8A1.5 1.5 0 1 1 8 6.5 1.5 1.5 0 0 1 6.5 8z'/>
  </svg>
)

// discountPercent is optional; with a discount the card shows a "-23%" badge
// on the photo, a "Save ৳350" pill and the sale price next to the old one
const ProductItem = ({id,image,name,price,discountPercent}) => {

    const {currency} = useContext(ShopContext);
    const product = { price, discountPercent }
    const discount = discountOf(product)
    const finalPrice = salePrice(product)

  return (
    <Link className='text-gray-700 cursor-pointer' to={`/product/${id}`}>
        <div className='relative overflow-hidden'>
            <img className='hover:scale-110 trasition ease-in-out' src={image[0]} alt="" />
            {discount > 0 && <span className='absolute top-2 left-2 px-2 py-0.5 rounded bg-rose-500 text-white text-xs font-semibold'>-{discount}%</span>}
        </div>
        <p className='pt-3 pb-1 text-sm'>{name}</p>
        {
          discount > 0 &&
          <span className='inline-flex items-center gap-1 my-1 px-2 py-0.5 rounded bg-green-600 text-white text-[11px] font-semibold'>
            <TagIcon />Save {currency}{price - finalPrice}
          </span>
        }
        <p className='flex flex-wrap items-baseline gap-x-1.5 text-sm font-medium'>
          <span className={discount > 0 ? 'text-base font-semibold text-gray-900' : ''}>{currency}{finalPrice}</span>
          {discount > 0 && <span className='text-xs text-gray-400 line-through'>{currency}{price}</span>}
          {discount > 0 && <span className='text-xs text-rose-500'>-{discount}%</span>}
        </p>

    </Link>
  )
}

export default ProductItem
