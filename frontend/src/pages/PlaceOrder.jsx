import React, { useContext, useState } from 'react'
import { assets } from '../assets/assets'
import { ShopContext } from '../context/ShopContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const SAVED_ADDRESS_KEY = 'checkoutAddress'

const inputClass = 'w-full border border-gray-300 rounded-md px-3.5 py-3 text-sm placeholder:text-gray-500 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900'

// one bordered group of radio rows, like the shipping and payment boxes in the design
const OptionGroup = ({ children }) => (
  <div className='border border-gray-300 rounded-md overflow-hidden divide-y divide-gray-300'>{children}</div>
)

const OptionRow = ({ selected, onSelect, children, extra }) => (
  <div>
    <label className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer text-sm ${selected ? 'bg-gray-50 ring-1 ring-inset ring-gray-900 rounded-md' : ''}`}>
      <input type='radio' checked={selected} onChange={onSelect} className='w-4 h-4 accent-gray-900' />
      <div className='flex-1 flex items-center justify-between gap-3'>{children}</div>
    </label>
    {selected && extra}
  </div>
)

const PlaceOrder = () => {

  const { navigate, backendUrl, token, cartItems, setCartItems, getCartAmount, products, currency, shippingRates } = useContext(ShopContext);

  const [method,setMethod] = useState('cod');
  const [shippingMethod,setShippingMethod] = useState('inside_dhaka');
  const [showSummary,setShowSummary] = useState(false);
  const [submitting,setSubmitting] = useState(false);

  const savedAddress = (() => {
    try { return JSON.parse(localStorage.getItem(SAVED_ADDRESS_KEY)) } catch { return null }
  })()
  const [saveInfo,setSaveInfo] = useState(!!savedAddress);

  const [formData,setFormData] = useState({
    email:'',
    country:'Bangladesh',
    firstName:'',
    lastName:'',
    street:'',
    city:'',
    zipcode:'',
    phone:'',
    ...savedAddress
  })

  const onChangeHandler = (event) => {
    const name = event.target.name
    const value = event.target.value

    setFormData(data => ({...data,[name]:value}) )
  }

  const formatPrice = (amount) => `${currency}${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // flatten { productId: { size: qty } } into order lines
  const lines = []
  for (const productId in cartItems) {
    const product = products.find(item => item._id === productId)
    if (!product) continue
    for (const size in cartItems[productId]) {
      if (cartItems[productId][size] > 0) {
        lines.push({ product, size, quantity: cartItems[productId][size] })
      }
    }
  }

  const subtotal = getCartAmount()
  const shippingFee = shippingRates[shippingMethod].fee
  const total = subtotal + shippingFee

  const onSubmitHandler = async (event) => {
    event.preventDefault()

    if (!token) {
      toast.error('Please sign in to place your order')
      navigate('/login')
      return
    }

    if (lines.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    try {
      setSubmitting(true)

      if (saveInfo) {
        localStorage.setItem(SAVED_ADDRESS_KEY, JSON.stringify(formData))
      } else {
        localStorage.removeItem(SAVED_ADDRESS_KEY)
      }

      // the server looks up prices and shipping fees itself; we only send what was chosen
      const orderData = {
        address: formData,
        items: lines.map(line => ({ _id: line.product._id, size: line.size, quantity: line.quantity })),
        shippingMethod,
      }

      switch (method) {
        case 'cod': {
          const response = await axios.post(backendUrl + '/api/order/place',orderData,{headers:{token}})
          if (response.data.success) {
            setCartItems({})
            navigate('/orders')
          } else {
            toast.error(response.data.message)
          }
          break;
        }

        case 'stripe': {
          const responseStripe = await axios.post(backendUrl + '/api/order/stripe',orderData, {headers:{token}})
          if (responseStripe.data.success) {
            window.location.replace(responseStripe.data.session_url)
          } else {
            toast.error(responseStripe.data.message)
          }
          break;
        }

        default:
          break;
      }

    } catch (error) {
      console.log(error);
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const summary = (
    <div className='flex flex-col gap-5'>
      {
        lines.map((line) => (
          <div key={line.product._id + line.size} className='flex items-center gap-4'>
            <div className='relative flex-shrink-0'>
              <img src={line.product.image[0]} className='w-16 h-16 object-cover rounded-md border border-gray-200 bg-white' alt={line.product.name} />
              <span className='absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-gray-900 text-white text-[11px] font-semibold flex items-center justify-center'>{line.quantity}</span>
            </div>
            <div className='flex-1 min-w-0'>
              <p className='text-sm font-medium text-gray-900 truncate'>{line.product.name}</p>
              <p className='text-xs text-gray-500 mt-0.5'>{line.size}</p>
            </div>
            <p className='text-sm text-gray-900'>{formatPrice(line.product.price * line.quantity)}</p>
          </div>
        ))
      }

      <div className='flex flex-col gap-2 text-sm pt-2'>
        <div className='flex justify-between'>
          <p className='text-gray-700'>Subtotal</p>
          <p className='text-gray-900'>{formatPrice(subtotal)}</p>
        </div>
        <div className='flex justify-between'>
          <p className='text-gray-700'>Shipping <span className='text-gray-500'>({shippingRates[shippingMethod].label})</span></p>
          <p className='text-gray-900'>{formatPrice(shippingFee)}</p>
        </div>
        <div className='flex justify-between items-baseline pt-3'>
          <p className='text-lg font-semibold text-gray-900'>Total</p>
          <p className='text-lg font-semibold text-gray-900'><span className='text-xs font-normal text-gray-500 mr-2'>BDT</span>{formatPrice(total)}</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className='-mx-4 sm:-mx-[5vw] md:-mx-[7vw] lg:-mx-[9vw] border-t border-gray-200 text-gray-900'>

      {/* Mobile: collapsible order summary */}
      <div className='lg:hidden bg-gray-50 border-b border-gray-200 px-4 sm:px-[5vw]'>
        <button type='button' onClick={()=>setShowSummary(!showSummary)} className='w-full flex items-center justify-between py-4 p-0 border-0 bg-transparent text-sm'>
          <span className='flex items-center gap-2 text-gray-900'>
            {showSummary ? 'Hide order summary' : 'Show order summary'}
            <img src={assets.dropdown_icon} className={`h-2.5 transition-transform ${showSummary ? '-rotate-90' : 'rotate-90'}`} alt='' />
          </span>
          <span className='font-semibold'>{formatPrice(total)}</span>
        </button>
        {showSummary && <div className='pb-6'>{summary}</div>}
      </div>

      <div className='grid lg:grid-cols-2'>

        {/* ------------- Left: checkout form ------------- */}
        <form onSubmit={onSubmitHandler} className='px-4 sm:px-[5vw] lg:px-12 xl:px-16 py-8 lg:py-12 lg:border-r border-gray-200'>
          <div className='w-full max-w-[520px] lg:ml-auto flex flex-col gap-8'>

            {/* Contact */}
            <section className='flex flex-col gap-3'>
              <div className='flex items-baseline justify-between'>
                <h2 className='text-lg font-semibold'>Contact</h2>
                {!token && <button type='button' onClick={()=>navigate('/login')} className='p-0 border-0 bg-transparent text-sm underline text-gray-700 hover:text-black'>Sign in</button>}
              </div>
              <input required onChange={onChangeHandler} name='email' value={formData.email} className={inputClass} type='email' placeholder='Email' />
            </section>

            {/* Delivery */}
            <section className='flex flex-col gap-3'>
              <h2 className='text-lg font-semibold'>Delivery</h2>
              <div className='relative'>
                <label className='absolute left-3.5 top-2 text-[11px] text-gray-500'>Country/Region</label>
                <select name='country' value={formData.country} onChange={onChangeHandler} className={`${inputClass} pt-6 pb-2 appearance-none bg-white`}>
                  <option value='Bangladesh'>Bangladesh</option>
                </select>
              </div>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <input onChange={onChangeHandler} name='firstName' value={formData.firstName} className={inputClass} type='text' placeholder='First name (optional)' />
                <input required onChange={onChangeHandler} name='lastName' value={formData.lastName} className={inputClass} type='text' placeholder='Last name' />
              </div>
              <input required onChange={onChangeHandler} name='street' value={formData.street} className={inputClass} type='text' placeholder='Address' />
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <input required onChange={onChangeHandler} name='city' value={formData.city} className={inputClass} type='text' placeholder='City' />
                <input onChange={onChangeHandler} name='zipcode' value={formData.zipcode} className={inputClass} type='text' inputMode='numeric' placeholder='Postal code (optional)' />
              </div>
              <input required onChange={onChangeHandler} name='phone' value={formData.phone} className={inputClass} type='tel' placeholder='Phone' />
              <label className='flex items-center gap-2 text-sm text-gray-700 cursor-pointer'>
                <input type='checkbox' checked={saveInfo} onChange={()=>setSaveInfo(!saveInfo)} className='w-4 h-4 accent-gray-900' />
                Save this information for next time
              </label>
            </section>

            {/* Shipping method */}
            <section className='flex flex-col gap-3'>
              <h2 className='text-base font-semibold'>Shipping method</h2>
              <OptionGroup>
                {
                  Object.entries(shippingRates).map(([key,rate])=>(
                    <OptionRow key={key} selected={shippingMethod === key} onSelect={()=>setShippingMethod(key)}>
                      <span>{rate.label} Shipping Cost</span>
                      <span className='font-medium'>{formatPrice(rate.fee)}</span>
                    </OptionRow>
                  ))
                }
              </OptionGroup>
            </section>

            {/* Payment */}
            <section className='flex flex-col gap-3'>
              <div>
                <h2 className='text-lg font-semibold'>Payment</h2>
                <p className='text-xs text-gray-500 mt-1'>All transactions are secure and encrypted.</p>
              </div>
              <OptionGroup>
                <OptionRow
                  selected={method === 'cod'}
                  onSelect={()=>setMethod('cod')}
                  extra={<p className='bg-gray-100 text-center text-xs text-gray-600 px-4 py-4'>Pay with cash when your order is delivered.</p>}
                >
                  <span>Cash on Delivery (COD)</span>
                </OptionRow>
                <OptionRow
                  selected={method === 'stripe'}
                  onSelect={()=>setMethod('stripe')}
                  extra={<p className='bg-gray-100 text-center text-xs text-gray-600 px-4 py-4'>You'll be redirected to Stripe to complete your purchase.</p>}
                >
                  <span>Card payment</span>
                  <img src={assets.stripe_logo} className='h-5' alt='Stripe' />
                </OptionRow>
              </OptionGroup>
            </section>

            <button type='submit' disabled={submitting} className='w-full border-0 rounded-md bg-gray-900 hover:bg-black text-white text-sm font-semibold py-4 disabled:opacity-60'>
              {submitting ? 'Processing…' : method === 'cod' ? 'Complete order' : 'Pay now'}
            </button>

          </div>
        </form>

        {/* ------------- Right: order summary (desktop) ------------- */}
        <aside className='hidden lg:block bg-gray-50 px-12 xl:px-16 py-12'>
          <div className='w-full max-w-[440px] sticky top-28'>
            {summary}
          </div>
        </aside>

      </div>
    </div>
  )
}

export default PlaceOrder
