import React, { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Add from './pages/Add'
import List from './pages/List'
import Orders from './pages/Orders'
import Login from './components/Login'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getTokenExpiry, isAuthFailure, isIdleTooLong, markActivity } from './session'

export const backendUrl = import.meta.env.VITE_BACKEND_URL
export const currency = '৳'

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart']

const App = () => {

  const [token,setToken] = useState(()=>{
    const stored = localStorage.getItem('token') || ''
    if (!stored) return ''
    // drop sessions that ran out while the panel was closed
    const expiry = getTokenExpiry(stored)
    if (expiry === null || expiry <= Date.now() || isIdleTooLong()) return ''
    return stored
  });

  useEffect(() => {
    localStorage.setItem('token',token)
  },[token])

  const signOut = useCallback((message) => {
    setToken(current => {
      if (current && message) toast.info(message, { toastId: 'signed-out' })
      return ''
    })
  },[])

  const onLogin = (newToken) => {
    markActivity()
    setToken(newToken)
  }

  useEffect(()=>{
    if (!token) return

    // 1. token expiry
    const expiry = getTokenExpiry(token)
    if (expiry === null || expiry <= Date.now()) {
      signOut('Your session has expired. Please sign in again.')
      return
    }
    const expiryTimer = setTimeout(()=>signOut('Your session has expired. Please sign in again.'), expiry - Date.now())

    // 2. inactivity
    markActivity()
    let lastWrite = 0
    const onActivity = () => {
      // throttle localStorage writes to once every 15s
      if (Date.now() - lastWrite > 15000) {
        lastWrite = Date.now()
        markActivity()
      }
    }
    ACTIVITY_EVENTS.forEach(event => window.addEventListener(event, onActivity, { passive: true }))
    const idleTimer = setInterval(()=>{
      if (isIdleTooLong()) signOut('Signed out after 30 minutes of inactivity.')
    }, 30000)

    // 3. the API rejected the token (expired, changed secret, signed out elsewhere)
    const interceptor = axios.interceptors.response.use((response) => {
      if (response.data && response.data.success === false && isAuthFailure(response.data.message)) {
        signOut('Your session has expired. Please sign in again.')
      }
      return response
    })

    return () => {
      clearTimeout(expiryTimer)
      clearInterval(idleTimer)
      ACTIVITY_EVENTS.forEach(event => window.removeEventListener(event, onActivity))
      axios.interceptors.response.eject(interceptor)
    }
  },[token, signOut])


  return (
    <div className='bg-gray-50 min-h-screen'>
      <ToastContainer />
      { token === ""
      ? <Login setToken={onLogin} />
      : <>
      <Navbar token={token} setToken={setToken} />
      <div className='flex w-full'>
       <Sidebar/>
       <div className='w-[70%] mx-auto ml-[max(5vw,25px)] my-8 text-gray-600 text-base'>
           <Routes>
           <Route path="/" element={<Home token={token} />} />
             <Route path='/add' element={<Add token={token}/>} />
             <Route path='/list' element={<List token={token}/>} />
             <Route path='/orders' element={<Orders token={token}/>} />
           </Routes>
       </div>
      </div>
     </>
       }

    </div>
  )
}

export default App
