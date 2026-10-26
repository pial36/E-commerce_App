import React, { useContext, useEffect } from 'react'
import { ShopContext } from '../context/ShopContext'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import axios from 'axios'


const Verify = () => {

    const { navigate, isLoggedIn, setCartItems, backendUrl } = useContext(ShopContext)
    const [searchParams,setSearchParams] = useSearchParams()

    const success = searchParams.get('success')
    const orderId = searchParams.get('orderId')

    const verifyPayment = async () => {
        try {

            if (!isLoggedIn) {
                return null
            }

            const response = await axios.post(backendUrl + '/api/order/verifyStripe', {success,orderId})
            if (response.data.success) {
                setCartItems({})
                navigate('/orders')

            } else {
                navigate('/cart')
            }
        } catch (error){
            console.log(error);
            toast.error(error.message)
            
        }
    }

    useEffect(() => {
        verifyPayment()
    },[isLoggedIn])
  return (
    <div>
      
    </div>
  )
}

export default Verify
