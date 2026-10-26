import React, { useContext, useState } from 'react'
import { assets } from '../assets/assets'
import { ShopContext } from '../context/ShopContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const SAVED_ADDRESS_KEY = 'checkoutAddress'
// a guest's card order needs its key to be confirmed after Stripe sends them back
export const GUEST_ORDER_KEY_PREFIX = 'guestOrderKey:'

const inputClass = 'w-full border border-gray-300 rounded-md px-3.5 py-3 text-sm placeholder:text-gray-500 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900'

const phoneCountries = [
  { code: 'AU', name: 'Australia', dial: '61' },
  { code: 'BH', name: 'Bahrain', dial: '973' },
  { code: 'BD', name: 'Bangladesh', dial: '880' },
  { code: 'CA', name: 'Canada', dial: '1' },
  { code: 'FR', name: 'France', dial: '33' },
  { code: 'DE', name: 'Germany', dial: '49' },
  { code: 'IN', name: 'India', dial: '91' },
  { code: 'IT', name: 'Italy', dial: '39' },
  { code: 'JP', name: 'Japan', dial: '81' },
  { code: 'KW', name: 'Kuwait', dial: '965' },
  { code: 'MY', name: 'Malaysia', dial: '60' },
  { code: 'NP', name: 'Nepal', dial: '977' },
  { code: 'OM', name: 'Oman', dial: '968' },
  { code: 'PK', name: 'Pakistan', dial: '92' },
  { code: 'QA', name: 'Qatar', dial: '974' },
  { code: 'SA', name: 'Saudi Arabia', dial: '966' },
  { code: 'SG', name: 'Singapore', dial: '65' },
  { code: 'LK', name: 'Sri Lanka', dial: '94' },
  { code: 'AE', name: 'United Arab Emirates', dial: '971' },
  { code: 'GB', name: 'United Kingdom', dial: '44' },
  { code: 'US', name: 'United States', dial: '1' },
]

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Bangladeshi mobile: 01XXXXXXXXX, optionally written with +880 / 880
const BD_MOBILE_PATTERN = /^(?:\+?880|0)?1[3-9]\d{8}$/

const digitsOnly = (value) => value.replace(/[\s-()]/g, '')

const isValidPhone = (number, countryCode) => {
  const digits = digitsOnly(number)
  if (countryCode === 'BD') return BD_MOBILE_PATTERN.test(digits)
  return /^\d{6,14}$/.test(digits.replace(/^0/, ''))
}

// "+880 1712345678" style, without the trunk 0
const formatPhone = (number, countryCode) => {
  const country = phoneCountries.find(item => item.code === countryCode)
  const digits = digitsOnly(number).replace(/^\+?880/, '').replace(/^0/, '')
  return `+${country.dial} ${digits}`
}

const validateCheckout = (form) => {
  const errors = {}
  const contact = form.email.trim()
  if (!contact) errors.email = 'Enter an email or phone number'
  else if (!EMAIL_PATTERN.test(contact) && !BD_MOBILE_PATTERN.test(digitsOnly(contact))) errors.email = 'Enter a valid email or phone number'
  if (!form.lastName.trim()) errors.lastName = 'Enter a last name'
  if (!form.street.trim()) errors.street = 'Enter an address'
  if (!form.city.trim()) errors.city = 'Enter a city'
  if (!form.phone.trim()) errors.phone = 'Enter a phone number'
  else if (!isValidPhone(form.phone, form.phoneCountry)) errors.phone = 'Enter a valid phone number'
  return errors
}

const HelpIcon = ({ text }) => (
  <span title={text} aria-label={text} className='flex items-center px-3 text-gray-500 cursor-help'>
    <svg className='w-[18px] h-[18px]' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.6' strokeLinecap='round'>
      <circle cx='12' cy='12' r='9.5' />
      <path d='M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.7M12 17h.01' />
    </svg>
  </span>
)

// Input whose label sits inside as a placeholder and floats up once there is a value
const FloatingField = ({ label, name, value, onChange, error, type = 'text', inputMode, autoComplete, children }) => (
  <div>
    <div className={`flex items-stretch rounded-md border bg-white ${error ? 'border-red-600 ring-1 ring-red-600' : 'border-gray-300 focus-within:border-gray-900 focus-within:ring-1 focus-within:ring-gray-900'}`}>
      <div className='relative flex-1 min-w-0'>
        <input
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          placeholder=' '
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
          className='peer w-full bg-transparent rounded-md px-3.5 pt-5 pb-1.5 text-sm text-gray-900 outline-none'
        />
        <label
          htmlFor={name}
          className='pointer-events-none absolute left-3.5 top-1.5 translate-y-0 text-[11px] text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm'
        >{label}</label>
      </div>
      {children}
    </div>
    {error && <p id={`${name}-error`} className='text-xs text-red-600 mt-1.5'>{error}</p>}
  </div>
)

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

  const { navigate, backendUrl, isLoggedIn, cartItems, setCartItems, getCartAmount, products, currency, shippingRates } = useContext(ShopContext);

  const [method,setMethod] = useState('cod');
  const [shippingMethod,setShippingMethod] = useState('inside_dhaka');
  const [showSummary,setShowSummary] = useState(false);
  const [submitting,setSubmitting] = useState(false);
  // set after a guest's cash-on-delivery order, to show the confirmation
  const [placedOrder,setPlacedOrder] = useState(null);

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
    phoneCountry:'BD',
    ...savedAddress
  })
  const [errors,setErrors] = useState({})

  const onChangeHandler = (event) => {
    const name = event.target.name
    const value = event.target.value

    setFormData(data => ({...data,[name]:value}) )
    if (errors[name]) setErrors(prev => ({...prev,[name]:undefined}))
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

    const formErrors = validateCheckout(formData)
    setErrors(formErrors)
    const firstInvalid = Object.keys(formErrors).find(key => formErrors[key])
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus()
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
        address: { ...formData, email: formData.email.trim(), phone: formatPhone(formData.phone, formData.phoneCountry) },
        items: lines.map(line => ({ _id: line.product._id, size: line.size, quantity: line.quantity })),
        shippingMethod,
        // tells the API this is a guest order rather than an expired session
        asGuest: !isLoggedIn,
      }

      switch (method) {
        case 'cod': {
          const response = await axios.post(backendUrl + '/api/order/place',orderData)
          if (response.data.success) {
            setCartItems({})
            if (isLoggedIn) {
              navigate('/orders')
            } else {
              setPlacedOrder({ id: response.data.orderId, amount: response.data.amount, contact: formData.email.trim() })
              window.scrollTo(0, 0)
            }
          } else {
            toast.error(response.data.message)
          }
          break;
        }

        case 'stripe': {
          const responseStripe = await axios.post(backendUrl + '/api/order/stripe',orderData)
          if (responseStripe.data.success) {
            if (responseStripe.data.guestKey) {
              localStorage.setItem(GUEST_ORDER_KEY_PREFIX + responseStripe.data.orderId, responseStripe.data.guestKey)
            }
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

  if (placedOrder) {
    return (
      <div className='border-t border-gray-200 py-16 sm:py-24 flex justify-center'>
        <div className='w-full max-w-md text-center flex flex-col items-center gap-4 text-gray-800'>
          <span className='w-14 h-14 rounded-full bg-green-50 text-green-600 flex items-center justify-center'>
            <svg className='w-7 h-7' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round'><path d='M5 12.5 10 17 19 7.5'/></svg>
          </span>
          <h1 className='prata-regular text-3xl'>Thank you!</h1>
          <p className='text-gray-600'>Your order has been placed.</p>
          <div className='w-full border border-gray-200 rounded-md divide-y divide-gray-200 text-sm text-left'>
            <div className='flex justify-between px-4 py-3'><span className='text-gray-500'>Order number</span><span className='font-medium'>#{String(placedOrder.id).slice(-8).toUpperCase()}</span></div>
            <div className='flex justify-between px-4 py-3'><span className='text-gray-500'>Total (cash on delivery)</span><span className='font-medium'>{formatPrice(placedOrder.amount)}</span></div>
          </div>
          <p className='text-sm text-gray-500'>We'll contact you at <b className='text-gray-800'>{placedOrder.contact}</b> to confirm delivery. Keep your order number for any questions.</p>
          <div className='flex flex-col sm:flex-row gap-3 mt-2'>
            <button onClick={()=>navigate('/collection')} className='border-0 bg-gray-900 hover:bg-black text-white text-sm px-6 py-3 rounded-md'>Continue shopping</button>
            <button onClick={()=>navigate('/login')} className='border border-gray-300 bg-white text-gray-800 text-sm px-6 py-3 rounded-md hover:border-gray-900'>Create an account</button>
          </div>
        </div>
      </div>
    )
  }

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
        <form noValidate onSubmit={onSubmitHandler} className='px-4 sm:px-[5vw] lg:px-12 xl:px-16 py-8 lg:py-12 lg:border-r border-gray-200'>
          <div className='w-full max-w-[520px] lg:ml-auto flex flex-col gap-8'>

            {/* Contact */}
            <section className='flex flex-col gap-3'>
              <div className='flex items-baseline justify-between'>
                <h2 className='text-lg font-semibold'>Contact</h2>
                {!isLoggedIn && <button type='button' onClick={()=>navigate('/login')} className='p-0 border-0 bg-transparent text-sm underline text-gray-700 hover:text-black'>Sign in</button>}
              </div>
              {!isLoggedIn && <p className='-mt-1 text-xs text-gray-500'>Checking out as a guest. No account needed — or sign in to see this order in your account.</p>}
              <FloatingField label='Email or mobile phone number' name='email' value={formData.email} onChange={onChangeHandler} error={errors.email} inputMode='email' autoComplete='email'>
                <HelpIcon text='In case we need to contact you about your order' />
              </FloatingField>
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
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 items-start'>
                <FloatingField label='First name (optional)' name='firstName' value={formData.firstName} onChange={onChangeHandler} autoComplete='given-name' />
                <FloatingField label='Last name' name='lastName' value={formData.lastName} onChange={onChangeHandler} error={errors.lastName} autoComplete='family-name' />
              </div>
              <FloatingField label='Address' name='street' value={formData.street} onChange={onChangeHandler} error={errors.street} autoComplete='street-address' />
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 items-start'>
                <FloatingField label='City' name='city' value={formData.city} onChange={onChangeHandler} error={errors.city} autoComplete='address-level2' />
                <FloatingField label='Postal code (optional)' name='zipcode' value={formData.zipcode} onChange={onChangeHandler} inputMode='numeric' autoComplete='postal-code' />
              </div>
              <FloatingField label='Phone' name='phone' value={formData.phone} onChange={onChangeHandler} error={errors.phone} type='tel' inputMode='tel' autoComplete='tel-national'>
                <HelpIcon text='In case we need to contact you about your order' />
                {/* Country calling code: a transparent native select over a short "+880" label */}
                <div className='relative flex items-center gap-1 px-3 bg-gray-100 border-l border-gray-300 rounded-r-md text-sm text-gray-800'>
                  <span>+{phoneCountries.find(item => item.code === formData.phoneCountry)?.dial}</span>
                  <img src={assets.dropdown_icon} className='h-2.5 rotate-90 opacity-60' alt='' />
                  <select
                    name='phoneCountry'
                    value={formData.phoneCountry}
                    onChange={onChangeHandler}
                    aria-label='Country calling code'
                    className='absolute inset-0 opacity-0 cursor-pointer'
                  >
                    {phoneCountries.map(item => <option key={item.code} value={item.code}>{item.name} (+{item.dial})</option>)}
                  </select>
                </div>
              </FloatingField>
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
