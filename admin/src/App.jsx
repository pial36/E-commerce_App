import React, { useCallback, useEffect, useState } from 'react'
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
import { isIdleTooLong, logoutAdminSession, markActivity, refreshAdminSession, setSignedOutHandler } from './session'

export const backendUrl = import.meta.env.VITE_BACKEND_URL
export const currency = '৳'

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart']

const App = () => {

  // the session itself is in httpOnly cookies; this only tracks whether we have one
  const [loggedIn,setLoggedIn] = useState(false)
  const [authReady,setAuthReady] = useState(false)

  const signOut = useCallback((message) => {
    logoutAdminSession()
    setLoggedIn(current => {
      if (current && message) toast.info(message, { toastId: 'signed-out' })
      return false
    })
  },[])

  // On load: ask the API whether this browser still has an admin session
  useEffect(()=>{
    // tokens used to be kept in localStorage; they are no longer used
    localStorage.removeItem('token')
    setSignedOutHandler(()=>signOut('Your session has expired. Please sign in again.'))

    if (isIdleTooLong()) {
      // away longer than the idle limit: end the session instead of resuming it
      logoutAdminSession().finally(()=>setAuthReady(true))
      return
    }
    refreshAdminSession().then((ok)=>{
      setLoggedIn(ok)
      setAuthReady(true)
    })
  },[signOut])

  const onLogin = () => {
    markActivity()
    setLoggedIn(true)
  }

  // sign out after 30 minutes without activity
  useEffect(()=>{
    if (!loggedIn) return

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

    return () => {
      clearInterval(idleTimer)
      ACTIVITY_EVENTS.forEach(event => window.removeEventListener(event, onActivity))
    }
  },[loggedIn, signOut])

  if (!authReady) {
    return <div className='bg-gray-50 min-h-screen' />
  }

  return (
    <div className='bg-gray-50 min-h-screen'>
      <ToastContainer />
      { !loggedIn
      ? <Login onLogin={onLogin} />
      : <>
      <Navbar onLogout={()=>signOut()} />
      <div className='flex w-full'>
       <Sidebar/>
       <div className='w-[70%] mx-auto ml-[max(5vw,25px)] my-8 text-gray-600 text-base'>
           <Routes>
           <Route path="/" element={<Home />} />
             <Route path='/add' element={<Add />} />
             <Route path='/list' element={<List />} />
             <Route path='/orders' element={<Orders />} />
           </Routes>
       </div>
      </div>
     </>
       }

    </div>
  )
}

export default App
