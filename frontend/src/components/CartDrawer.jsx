import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'

const HomeIcon = ({ className }) => (
  <svg className={className} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'>
    <path d='M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z'/>
  </svg>
)

const roundButton = 'p-0 border-0 bg-white text-gray-800 rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.15)] flex items-center justify-center hover:bg-gray-50'

const TrashIcon = ({ className }) => (
  <svg className={className} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.6' strokeLinecap='round' strokeLinejoin='round'>
    <path d='M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6'/>
  </svg>
)

const CartDrawer = () => {

  const { cartOpen, setCartOpen, cartItems, products, currency, updateQuantity, getCartAmount, lastAddedId, navigate } = useContext(ShopContext)
  const [suggestionIndex,setSuggestionIndex] = useState(0)

  const close = () => setCartOpen(false)

  const goTo = (path) => {
    close()
    navigate(path)
  }

  const formatPrice = (amount) => `${currency} ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // flatten { productId: { size: qty } } into rows the drawer can render
  const lines = []
  for (const productId in cartItems) {
    const product = products.find((item) => item._id === productId)
    if (!product) continue
    for (const size in cartItems[productId]) {
      if (cartItems[productId][size] > 0) {
        lines.push({ product, size, quantity: cartItems[productId][size] })
      }
    }
  }

  // "You may also like": same category as the item just added, not already in the cart
  const lastAdded = products.find((item) => item._id === lastAddedId)
  const suggestions = lastAdded
    ? products.filter((item) => item.category === lastAdded.category && !cartItems[item._id]).slice(0, 5)
    : []
  const suggestion = suggestions[Math.min(suggestionIndex, suggestions.length - 1)]

  useEffect(()=>{
    setSuggestionIndex(0)
  },[lastAddedId])

  // lock page scroll and close on Escape while open
  useEffect(()=>{
    if (!cartOpen) return
    const onKey = (e) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  },[cartOpen])

  return (
    <div className={`fixed inset-0 z-[60] ${cartOpen ? '' : 'pointer-events-none'}`} aria-hidden={!cartOpen}>

      {/* Dimmed backdrop */}
      <div onClick={close} className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${cartOpen ? 'opacity-100' : 'opacity-0'}`} />

      {/* Panel */}
      <aside
        role='dialog'
        aria-label='Shopping cart'
        className={`absolute top-0 right-0 h-full w-[85%] sm:w-[400px] bg-white text-gray-800 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${cartOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >

        {/* Back: floats in the strip of page left visible beside the panel */}
        <button onClick={close} aria-label='Back' className={`${roundButton} absolute top-3 -left-[50px] sm:-left-16 w-11 h-11 text-lg transition-opacity duration-300 ${cartOpen ? 'opacity-100' : 'opacity-0'}`}>&#8249;</button>

        {/* Header */}
        <div className='flex items-center justify-between pl-5 pr-3 sm:px-6 h-16 border-b border-gray-200'>
          <p className='text-sm font-semibold tracking-[0.15em]'>SHOPPING CART</p>
          <div className='flex items-center gap-3'>
            <button onClick={()=>goTo('/')} aria-label='Go to home page' className={`${roundButton} w-10 h-10`}>
              <HomeIcon className='w-[18px] h-[18px]' />
            </button>
            <button onClick={close} aria-label='Close cart' className='hidden sm:block p-0 border-0 bg-transparent text-gray-700 hover:text-black text-2xl leading-none'>&times;</button>
          </div>
        </div>

        {/* Items */}
        <div className='flex-1 overflow-y-auto'>
          {
            lines.length === 0
            ? <div className='flex flex-col items-center justify-center text-center gap-4 h-full px-6'>
                <p className='text-gray-500'>Your cart is empty.</p>
                <button onClick={()=>goTo('/collection')} className='border border-black bg-white text-black text-xs tracking-[0.2em] px-6 py-3 hover:bg-black hover:text-white transition-colors'>CONTINUE SHOPPING</button>
              </div>
            : <div className='divide-y divide-gray-100'>
                {
                  lines.map((line)=>(
                    <div key={line.product._id + line.size} className='flex gap-4 px-5 sm:px-6 py-5'>
                      <img onClick={()=>goTo(`/product/${line.product._id}`)} src={line.product.image[0]} className='w-24 h-28 object-cover bg-gray-50 cursor-pointer' alt={line.product.name} />
                      <div className='flex-1 min-w-0'>
                        <p onClick={()=>goTo(`/product/${line.product._id}`)} className='text-sm font-medium truncate cursor-pointer hover:underline'>{line.product.name}</p>
                        <p className='text-xs text-gray-500 mt-1'>Size: {line.size}</p>
                        <p className='text-sm font-semibold mt-1'>{formatPrice(line.product.price)}</p>

                        <div className='flex items-center gap-4 mt-3'>
                          {/* Quantity stepper: minus turns into a bin at 1 */}
                          <div className='flex items-center border border-gray-800 h-9'>
                            <button
                              onClick={()=>updateQuantity(line.product._id, line.size, line.quantity - 1)}
                              aria-label={line.quantity === 1 ? 'Remove item' : 'Decrease quantity'}
                              className='p-0 border-0 bg-transparent w-9 h-full flex items-center justify-center text-gray-800 hover:bg-gray-100'
                            >
                              {line.quantity === 1 ? <TrashIcon className='w-4 h-4' /> : <span className='text-lg leading-none'>&minus;</span>}
                            </button>
                            <span className='w-8 text-center text-sm'>{line.quantity}</span>
                            <button
                              onClick={()=>updateQuantity(line.product._id, line.size, line.quantity + 1)}
                              aria-label='Increase quantity'
                              className='p-0 border-0 bg-transparent w-9 h-full flex items-center justify-center text-gray-800 text-lg leading-none hover:bg-gray-100'
                            >+</button>
                          </div>
                          <button
                            onClick={()=>updateQuantity(line.product._id, line.size, 0)}
                            aria-label='Remove item'
                            className='p-0 border-0 bg-transparent text-gray-500 hover:text-black'
                          >
                            <TrashIcon className='w-5 h-5' />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
          }

          {/* You may also like */}
          {
            lines.length > 0 && suggestion &&
            <div className='mx-6 my-5 border border-gray-200 rounded'>
              <p className='text-center text-sm font-medium py-3 border-b border-gray-200 bg-gray-50'>You may also like</p>
              <div onClick={()=>goTo(`/product/${suggestion._id}`)} className='flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50'>
                <img src={suggestion.image[0]} className='w-16 h-20 object-cover bg-gray-50' alt={suggestion.name} />
                <div className='min-w-0'>
                  <p className='text-sm truncate'>{suggestion.name}</p>
                  <p className='text-sm text-gray-500 mt-1'>{formatPrice(suggestion.price)}</p>
                </div>
              </div>
              {
                suggestions.length > 1 &&
                <div className='flex items-center border-t border-gray-200'>
                  <button onClick={()=>setSuggestionIndex((suggestionIndex - 1 + suggestions.length) % suggestions.length)} aria-label='Previous suggestion' className='p-0 border-0 border-r border-gray-200 bg-transparent w-12 h-10 text-lg text-gray-700 hover:bg-gray-50'>&#8249;</button>
                  <div className='flex-1 flex justify-center gap-2'>
                    {
                      suggestions.map((item,index)=>(
                        <button key={item._id} onClick={()=>setSuggestionIndex(index)} aria-label={`Suggestion ${index + 1}`} className={`p-0 w-2 h-2 rounded-full border border-gray-700 ${index === suggestionIndex ? 'bg-gray-800' : 'bg-transparent'}`} />
                      ))
                    }
                  </div>
                  <button onClick={()=>setSuggestionIndex((suggestionIndex + 1) % suggestions.length)} aria-label='Next suggestion' className='p-0 border-0 border-l border-gray-200 bg-transparent w-12 h-10 text-lg text-gray-700 hover:bg-gray-50'>&#8250;</button>
                </div>
              }
            </div>
          }
        </div>

        {/* Footer */}
        {
          lines.length > 0 &&
          <div className='border-t border-gray-200 px-6 py-5 flex flex-col gap-3'>
            <div className='flex items-center justify-between mb-1'>
              <p className='font-semibold'>Subtotal:</p>
              <p className='font-semibold'>{formatPrice(getCartAmount())}</p>
            </div>
            <p className='text-xs text-gray-500 -mt-2 mb-1'>Shipping calculated at checkout.</p>
            <button onClick={()=>goTo('/cart')} className='border-0 bg-gray-100 text-gray-900 text-xs font-semibold tracking-[0.25em] py-3.5 hover:bg-gray-200 transition-colors'>VIEW CART</button>
            <button onClick={()=>goTo('/place-order')} className='border-0 bg-gray-900 text-white text-xs font-semibold tracking-[0.25em] py-3.5 hover:bg-black transition-colors'>CHECK OUT</button>
          </div>
        }

      </aside>
    </div>
  )
}

export default CartDrawer
