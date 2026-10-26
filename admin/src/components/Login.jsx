import axios from 'axios'
import React, { useState } from 'react'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'

const inputClass = 'rounded-md w-full px-3.5 py-2.5 border border-gray-300 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900'

const Login = ({setToken}) => {

    const [email,SetEmail] = useState('')
    const [password,setPassword] = useState('')
    const [submitting,setSubmitting] = useState(false)


    const onSubmitHandler = async (e) => {
        try {
            e.preventDefault();
            setSubmitting(true)
            const response = await axios.post(backendUrl + '/api/user/admin',{email,password})
            if (response.data.success) {
                setToken(response.data.token)
            }else{
                toast.error(response.data.message)
            }


        } catch (error) {
            console.log(error);
            toast.error(error.message)

        } finally {
            setSubmitting(false)
        }
    }


  return (
    <div className='min-h-screen flex items-center justify-center w-full px-4'>
        <div className='w-full max-w-sm bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-gray-100 rounded-xl px-8 py-10'>
            <div className='flex flex-col items-center text-center mb-8'>
                <img src={assets.logo} className='h-24 w-auto mb-6' alt='Velariq Fashion' />
                <h1 className='text-xl font-semibold text-gray-900 tracking-wide'>Admin Panel</h1>
                <p className='text-sm text-gray-500 mt-1'>Sign in to manage your store</p>
            </div>
            <form onSubmit={onSubmitHandler} className='flex flex-col gap-4'>
                <div>
                    <label htmlFor='admin-email' className='block text-sm font-medium text-gray-700 mb-1.5'>Email address</label>
                    <input id='admin-email' onChange={(e)=>SetEmail(e.target.value)} value={email} className={inputClass} type="email" autoComplete='username' placeholder='your@email.com' required />
                </div>
                <div>
                    <label htmlFor='admin-password' className='block text-sm font-medium text-gray-700 mb-1.5'>Password</label>
                    <input id='admin-password' onChange={(e)=>setPassword(e.target.value)} value={password} className={inputClass} type="password" autoComplete='current-password' placeholder='Enter your password' required />
                </div>
                <button disabled={submitting} className='mt-2 w-full py-2.5 px-4 rounded-md bg-gray-900 hover:bg-black text-white text-sm font-medium tracking-wide disabled:opacity-60' type='submit'>
                    {submitting ? 'Signing in…' : 'Sign in'}
                </button>
            </form>
        </div>
    </div>
  )
}

export default Login
