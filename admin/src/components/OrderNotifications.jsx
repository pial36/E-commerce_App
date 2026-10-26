import React, { useCallback, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useLocation, useNavigate } from 'react-router-dom'
import { backendUrl, currency } from '../App'

const LAST_SEEN_KEY = 'ordersLastSeen'
const POLL_MS = 30000
const BASE_TITLE = document.title

const readLastSeen = () => {
  const value = Number(localStorage.getItem(LAST_SEEN_KEY))
  if (Number.isFinite(value) && value > 0) return value
  // first visit: start counting from now instead of flagging every past order
  const now = Date.now()
  localStorage.setItem(LAST_SEEN_KEY, String(now))
  return now
}

const timeAgo = (date) => {
  const minutes = Math.floor((Date.now() - date) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  return `${Math.floor(hours / 24)} d ago`
}

const customerName = (order) => [order.address?.firstName, order.address?.lastName].filter(Boolean).join(' ') || 'A customer'

// Bell in the admin header: polls for orders placed since the admin last
// looked, shows the count as a badge, and toasts when a new one arrives.
const OrderNotifications = () => {

  const [lastSeen,setLastSeen] = useState(readLastSeen)
  const [count,setCount] = useState(0)
  const [orders,setOrders] = useState([])
  const [open,setOpen] = useState(false)
  const knownIds = useRef(null)
  const panelRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  const markAllRead = useCallback(() => {
    const now = Date.now()
    localStorage.setItem(LAST_SEEN_KEY, String(now))
    setLastSeen(now)
    setCount(0)
    setOrders([])
  },[])

  const poll = useCallback(async () => {
    try {
      const response = await axios.post(backendUrl + '/api/order/recent', { since: lastSeen })
      if (!response.data.success) return

      const fresh = response.data.orders
      // toast only for orders that appeared since the previous poll
      if (knownIds.current) {
        fresh.filter(order => !knownIds.current.has(order._id)).forEach(order => {
          toast.info(`New order from ${customerName(order)} · ${currency}${order.amount}`, { toastId: `order-${order._id}` })
        })
      }
      knownIds.current = new Set(fresh.map(order => order._id))
      setCount(response.data.count)
      setOrders(fresh)
    } catch (error) {
      console.log(error)
    }
  },[lastSeen])

  useEffect(()=>{
    knownIds.current = null
    poll()
    const timer = setInterval(poll, POLL_MS)
    window.addEventListener('focus', poll)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', poll)
    }
  },[poll])

  // opening the Orders page counts as reading them
  useEffect(()=>{
    if (location.pathname === '/orders') markAllRead()
  },[location.pathname, markAllRead])

  // unread count in the browser tab title
  useEffect(()=>{
    document.title = count > 0 ? `(${count}) ${BASE_TITLE}` : BASE_TITLE
    return () => { document.title = BASE_TITLE }
  },[count])

  useEffect(()=>{
    if (!open) return
    const onClick = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  },[open])

  const viewOrders = () => {
    setOpen(false)
    navigate('/orders')
  }

  return (
    <div ref={panelRef} className='relative'>
      <button
        onClick={()=>setOpen(!open)}
        aria-label={count > 0 ? `${count} new orders` : 'No new orders'}
        aria-expanded={open}
        className='relative w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors'
      >
        <svg className='w-5 h-5' viewBox='0 0 24 24' fill='currentColor'><path d='M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22zm7-6V11a7 7 0 0 0-5.5-6.84V3.5a1.5 1.5 0 0 0-3 0v.66A7 7 0 0 0 5 11v5l-1.7 1.7A1 1 0 0 0 4 19.4h16a1 1 0 0 0 .7-1.7z'/></svg>
        {
          count > 0 &&
          <span className='absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[11px] font-bold leading-5 text-center ring-2 ring-white'>
            {count > 99 ? '99+' : count}
          </span>
        }
      </button>

      {
        open &&
        <div className='absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden'>
          <div className='flex items-center justify-between px-4 py-3 border-b border-gray-100'>
            <p className='text-sm font-semibold text-gray-900'>New orders</p>
            {count > 0 && <button onClick={markAllRead} className='text-xs text-gray-500 hover:text-gray-900 underline'>Mark all as read</button>}
          </div>

          {
            orders.length === 0
            ? <p className='px-4 py-8 text-center text-sm text-gray-500'>No new orders</p>
            : <ul className='max-h-80 overflow-y-auto divide-y divide-gray-100'>
                {
                  orders.map(order => (
                    <li key={order._id}>
                      <button onClick={viewOrders} className='w-full text-left px-4 py-3 hover:bg-gray-50 flex gap-3'>
                        <span className='mt-1.5 w-2 h-2 rounded-full bg-red-600 flex-shrink-0' />
                        <span className='flex-1 min-w-0'>
                          <span className='block text-sm text-gray-900 truncate'>{customerName(order)} placed an order</span>
                          <span className='block text-xs text-gray-500 mt-0.5'>
                            {currency}{order.amount} · {order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0)} item(s) · {order.paymentMethod} · {timeAgo(order.date)}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))
                }
              </ul>
          }

          <button onClick={viewOrders} className='w-full px-4 py-3 text-sm font-medium text-gray-900 border-t border-gray-100 hover:bg-gray-50'>
            View all orders{count > orders.length ? ` (${count})` : ''}
          </button>
        </div>
      }
    </div>
  )
}

export default OrderNotifications
