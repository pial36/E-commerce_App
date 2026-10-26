import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';

// Steps on this page:
//   Login / Sign Up  -> the usual forms
//   Verify           -> enter the 6-digit code emailed after sign-up (or at login for unverified accounts)
//   Forgot           -> ask for a reset code
//   Reset            -> enter the code and a new password
const TITLES = {
  'Login': 'Login',
  'Sign Up': 'Sign Up',
  'Verify': 'Verify Email',
  'Forgot': 'Forgot Password',
  'Reset': 'Reset Password',
}

const RESEND_SECONDS = 60

const inputClass = 'w-full px-3 py-2 border border-gray-800'
const linkClass = 'p-0 border-0 bg-transparent cursor-pointer text-sm text-gray-800 hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-default'

const Login = () => {

  const [currentstate, setCurrentState] = useState('Login');
  const { isLoggedIn, setUser, navigate, backendUrl} = useContext(ShopContext);

  const [name,setName] = useState('')
  const [password,setPassword] = useState('')
  const [email,setEmail] = useState('')
  const [code,setCode] = useState('')
  const [newPassword,setNewPassword] = useState('')
  const [submitting,setSubmitting] = useState(false)
  const [resendIn,setResendIn] = useState(0)

  // countdown for the "Resend code" link
  useEffect(()=>{
    if (resendIn <= 0) return
    const timer = setTimeout(()=>setResendIn(resendIn - 1), 1000)
    return () => clearTimeout(timer)
  },[resendIn])

  // the API has set the session cookies; remember who is signed in
  const signIn = (user) => {
    setUser(user)
  }

  const goTo = (state) => {
    setCode('')
    setCurrentState(state)
  }

  // after sign-up, or login with an unverified email: show the code step
  const startVerification = (verifiedEmail) => {
    if (verifiedEmail) setEmail(verifiedEmail)
    setResendIn(RESEND_SECONDS)
    goTo('Verify')
  }

  const post = (path, body) => axios.post(backendUrl + path, body).then(response => response.data)

  const onSumbitHandler = async (event) => {
    event.preventDefault();
    try {
      setSubmitting(true)

      if (currentstate === 'Sign Up') {
        const data = await post('/api/user/register',{name,email,password})
        if (!data.success) return toast.error(data.message)
        toast.success(`We sent a 6-digit code to ${data.email}`)
        startVerification(data.email)

      } else if (currentstate === 'Login') {
        const data = await post('/api/user/login',{email,password})
        if (!data.success) return toast.error(data.message)
        if (data.needsVerification) {
          toast.info(`Please confirm your email. We sent a code to ${data.email}`)
          startVerification(data.email)
        } else {
          signIn(data.user)
        }

      } else if (currentstate === 'Verify') {
        const data = await post('/api/user/verify-email',{email,code})
        if (!data.success) return toast.error(data.message)
        toast.success('Email confirmed. Welcome to Velariq Fashion!')
        signIn(data.user)

      } else if (currentstate === 'Forgot') {
        const data = await post('/api/user/forgot-password',{email})
        if (!data.success) return toast.error(data.message)
        toast.success(data.message)
        setResendIn(RESEND_SECONDS)
        goTo('Reset')

      } else if (currentstate === 'Reset') {
        const data = await post('/api/user/reset-password',{email,code,password:newPassword})
        if (!data.success) return toast.error(data.message)
        toast.success('Your password has been updated')
        setNewPassword('')
        signIn(data.user)
      }

    } catch (error) {
      console.log(error);
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const resendCode = async () => {
    try {
      const data = currentstate === 'Verify'
        ? await post('/api/user/resend-verification',{email})
        : await post('/api/user/forgot-password',{email})
      if (!data.success) return toast.error(data.message)
      toast.success('A new code has been sent')
      setResendIn(RESEND_SECONDS)
    } catch (error) {
      console.log(error);
      toast.error(error.message)
    }
  }

  useEffect(()=> {
    if (isLoggedIn) {
      navigate('/')
    }
  },[isLoggedIn])

  const codeInput = (
    <input
      onChange={(e)=>setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
      value={code}
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="\d{6}"
      title="Enter the 6-digit code"
      className={`${inputClass} text-center text-2xl tracking-[0.5em] font-medium`}
      placeholder='______'
      required
      autoFocus
    />
  )

  const resendLink = (
    <button type='button' onClick={resendCode} disabled={resendIn > 0} className={linkClass}>
      {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
    </button>
  )

  const buttonLabel = {
    'Login': 'Sign In',
    'Sign Up': 'Sign Up',
    'Verify': 'Verify',
    'Forgot': 'Send Code',
    'Reset': 'Reset Password',
  }[currentstate]

  return (
    <form onSubmit={onSumbitHandler} className='flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800'>
        <div className='inline-flex items-center gap-2 mb-2 mt-10'>
            <p className='prata-regular text-3xl'>{TITLES[currentstate]}</p>
            <hr className='border-none h-[1.5px] w-8 bg-gray-800' />
        </div>

        {
          (currentstate === 'Login' || currentstate === 'Sign Up') && <>
            {currentstate === 'Sign Up' && <input onChange={(e)=>setName(e.target.value)} value={name} type="text" autoComplete='name' className={inputClass} placeholder='Name' required/>}
            <input onChange={(e)=>setEmail(e.target.value)} value={email} type="email" autoComplete='email' className={inputClass} placeholder='Email' required/>
            <input onChange={(e)=>setPassword(e.target.value)} value={password} type="password" autoComplete={currentstate === 'Sign Up' ? 'new-password' : 'current-password'} className={inputClass} placeholder='Password' required/>
            {currentstate === 'Sign Up' /* && <p className='w-full text-xs text-gray-500 -mt-2'>Use a real email address. We'll send a code to confirm it, and it's where password resets go.</p> */}
            <div className='w-full flex justify-between text-sm mt-[-8px]'>
                <button type='button' onClick={()=>goTo('Forgot')} className={linkClass}>Forgot Your Password?</button>
                {
                  currentstate === 'Login'
                  ? <button type='button' onClick={()=>goTo('Sign Up')} className={linkClass}>Create account</button>
                  : <button type='button' onClick={()=>goTo('Login')} className={linkClass}>Login Here</button>
                }
            </div>
          </>
        }

        {
          currentstate === 'Verify' && <>
            <p className='w-full text-sm text-gray-600 text-center'>Enter the 6-digit code we sent to <b className='text-gray-900'>{email}</b>. It expires in 10 minutes.</p>
            {codeInput}
            <div className='w-full flex justify-between'>
              {resendLink}
              <button type='button' onClick={()=>goTo('Login')} className={linkClass}>Back to login</button>
            </div>
          </>
        }

        {
          currentstate === 'Forgot' && <>
            <p className='w-full text-sm text-gray-600 text-center'>Enter your account email and we'll send you a 6-digit code to reset your password.</p>
            <input onChange={(e)=>setEmail(e.target.value)} value={email} type="email" autoComplete='email' className={inputClass} placeholder='Email' required/>
            <div className='w-full flex justify-end'>
              <button type='button' onClick={()=>goTo('Login')} className={linkClass}>Back to login</button>
            </div>
          </>
        }

        {
          currentstate === 'Reset' && <>
            <p className='w-full text-sm text-gray-600 text-center'>If an account exists for <b className='text-gray-900'>{email}</b>, we sent it a 6-digit code. Enter it with your new password.</p>
            {codeInput}
            <input onChange={(e)=>setNewPassword(e.target.value)} value={newPassword} type="password" autoComplete='new-password' className={inputClass} placeholder='New password' required/>
            <p className='w-full text-xs text-gray-500 -mt-2'>At least 8 characters with an uppercase letter, a lowercase letter, a number and a special character (@$!%*?&).</p>
            <div className='w-full flex justify-between'>
              {resendLink}
              <button type='button' onClick={()=>goTo('Login')} className={linkClass}>Back to login</button>
            </div>
          </>
        }

        <button disabled={submitting} className='bg-black text-white font-light px-8 py-2 mt-4 disabled:opacity-60'>{submitting ? 'Please wait…' : buttonLabel}</button>
    </form>
  )
}

export default Login
