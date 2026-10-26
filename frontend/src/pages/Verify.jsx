import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import axios from 'axios'
import { GUEST_ORDER_KEY_PREFIX } from './PlaceOrder'


// Stripe sends the customer back here after card payment.
// Signed-in customers go on to My Orders; guests see a confirmation here.
const Verify = () => {

    const { navigate, isLoggedIn, authReady, setCartItems, backendUrl, currency } = useContext(ShopContext)
    const [searchParams] = useSearchParams()
    const [guestResult,setGuestResult] = useState(null)

    const success = searchParams.get('success')
    const orderId = searchParams.get('orderId')

    const verifyPayment = async () => {
        try {
            const keyName = GUEST_ORDER_KEY_PREFIX + orderId
            const guestKey = localStorage.getItem(keyName)

            const response = await axios.post(backendUrl + '/api/order/verifyStripe', {
                success,
                orderId,
                guestKey: guestKey || undefined,
                asGuest: !isLoggedIn,
            })

            if (response.data.success) {
                setCartItems({})
                localStorage.removeItem(keyName)
                if (isLoggedIn) {
                    navigate('/orders')
                } else {
                    setGuestResult({ id: orderId, amount: response.data.amount })
                }
            } else {
                localStorage.removeItem(keyName)
                if (success === 'true') toast.error(response.data.message)
                navigate('/cart')
            }
        } catch (error){
            console.log(error);
            toast.error(error.message)
            
        }
    }

    useEffect(() => {
        // wait until we know whether someone is signed in
        if (authReady && orderId) verifyPayment()
    },[authReady])

    if (!guestResult) {
        return <div className='border-t py-24 text-center text-gray-500'>Confirming your payment…</div>
    }

  return (
    <div className='border-t border-gray-200 py-16 sm:py-24 flex justify-center'>
      <div className='w-full max-w-md text-center flex flex-col items-center gap-4 text-gray-800'>
        <span className='w-14 h-14 rounded-full bg-green-50 text-green-600 flex items-center justify-center'>
          <svg className='w-7 h-7' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round'><path d='M5 12.5 10 17 19 7.5'/></svg>
        </span>
        <h1 className='prata-regular text-3xl'>Thank you!</h1>
        <p className='text-gray-600'>Your payment was received and your order is placed.</p>
        <div className='w-full border border-gray-200 rounded-md divide-y divide-gray-200 text-sm text-left'>
          <div className='flex justify-between px-4 py-3'><span className='text-gray-500'>Order number</span><span className='font-medium'>#{String(guestResult.id).slice(-8).toUpperCase()}</span></div>
          {guestResult.amount !== undefined && <div className='flex justify-between px-4 py-3'><span className='text-gray-500'>Paid</span><span className='font-medium'>{currency}{guestResult.amount}</span></div>}
        </div>
        <p className='text-sm text-gray-500'>Keep your order number for any questions about delivery.</p>
        <button onClick={()=>navigate('/collection')} className='mt-2 border-0 bg-gray-900 hover:bg-black text-white text-sm px-6 py-3 rounded-md'>Continue shopping</button>
      </div>
    </div>
  )
}

export default Verify
