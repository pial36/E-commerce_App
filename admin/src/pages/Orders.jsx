import React from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import {toast} from 'react-toastify'
import { assets } from '../assets/assets'
const Orders = () => {

  const [orders, setOrders] = useState([])

  const fetchAllOrders = async () => {

    try {
      const response = await axios.post(backendUrl + '/api/order/list',{})
      if (response.data.success) {
        setOrders(response.data.orders)
      } else {
        toast.error(response.data.message )
      }
      
    } catch (error) {
      toast.error(error.message)
    }
  }

  const statusHandler = async (event, orderId) => {
    try {
      const response = await axios.post(backendUrl + '/api/order/status', {orderId, status:event.target.value})
      if (response.data.success) {
      await fetchAllOrders()
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const deleteOrder = async (order) => {
    const customer = [order.address.firstName, order.address.lastName].filter(Boolean).join(' ')
    if (!window.confirm(`Delete the order from ${customer || 'this customer'} (${currency}${order.amount})? This cannot be undone.`)) return
    try {
      const response = await axios.post(backendUrl + '/api/order/delete', {orderId: order._id})
      if (response.data.success) {
        toast.success(response.data.message)
        await fetchAllOrders()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  // Download every order as an Excel sheet, one row per order
  const exportToExcel = async () => {
    if (orders.length === 0) {
      toast.info('There are no orders to export')
      return
    }
    // loaded on demand so the spreadsheet library isn't in the main bundle
    const XLSX = await import('xlsx')

    const rows = orders.map((order) => {
      const itemsTotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      return {
        'Order ID': order._id,
        'Date': new Date(order.date).toLocaleString(),
        'Customer': [order.address.firstName, order.address.lastName].filter(Boolean).join(' '),
        'Email / Contact': order.address.email || '',
        'Phone': order.address.phone || '',
        'Address': order.address.street || '',
        'City': order.address.city || '',
        'Postal code': order.address.zipcode || '',
        'Country': order.address.country || '',
        'Items': order.items.map(item => `${item.name} (${item.size}) x ${item.quantity}`).join('; '),
        'Item count': order.items.reduce((sum, item) => sum + item.quantity, 0),
        'Items total': itemsTotal,
        'Shipping method': order.shipping?.label || '',
        'Shipping fee': order.shipping?.fee ?? order.amount - itemsTotal,
        'Order total': order.amount,
        'Payment method': order.paymentMethod,
        'Payment': order.payment ? 'Done' : 'Pending',
        'Status': order.status,
      }
    })

    const sheet = XLSX.utils.json_to_sheet(rows)
    sheet['!cols'] = Object.keys(rows[0]).map(key => ({ wch: Math.min(Math.max(key.length, ...rows.map(row => String(row[key]).length)) + 2, 60) }))
    const book = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(book, sheet, 'Orders')
    XLSX.writeFile(book, `velariq-orders-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }


  useEffect(() => {
    fetchAllOrders();
  },[])

  return (
    <div>
      <div className='flex flex-wrap items-center justify-between gap-3 mb-2'>
        <h3 className='text-lg font-semibold text-gray-800'>Orders <span className='text-sm font-normal text-gray-500'>({orders.length})</span></h3>
        <button onClick={exportToExcel} className='flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-gray-900 text-white hover:bg-black'>
          <svg className='w-4 h-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'><path d='M12 3v12M7 10l5 5 5-5M5 21h14'/></svg>
          Export to Excel
        </button>
      </div>
      <div>
        {

          orders.map((order,index) => (
            <div className='grid grid-cols-1 sm:grid-cols-[0.5fr_2fr_1fr] lg:grid-cols-[0.5fr_2fr_1fr_1fr_1fr] gap-3 items-start border-2 border-gray-200 p-5 md:p-8 my-3 md:my-4 text-xs sm:text-sm text-gray-700' key={index}>
                  <img className='w-12' src={assets.parcel_icon} alt="" />
                  <div>

                    <div>
                      {order.items.map((item,index) =>{
                        if (index === order.items.length - 1) {
                          return <p className='py-0.5' key={index}> {item.name} x {item.quantity} <span> {item.size} </span></p>
                        }
                        else {
                          return <p className='py-0.5' key={index}> {item.name} x {item.quantity} <span> {item.size} </span>,</p>
                        }
                      })}
                    </div>
                    <p className='mt-3 mb-2 font-medium'>{order.address.firstName + " " + order.address.lastName}</p>
                    <div>
                      <p>{order.address.street}</p>
                      <p>{[order.address.city, order.address.zipcode, order.address.country].filter(Boolean).join(", ")}</p>
                    </div>
                    <p>{order.address.phone}</p>
                  </div>
                  <div>
                    <p className='text-sm sm:text-[15px]'>Items : {order.items.length}</p>
                    <p className='mt-3'>Method : {order.paymentMethod}</p>
                    <p>Payment : { order.payment ? 'Done' : 'Pending'}</p>
                    {order.shipping && <p>Shipping : {order.shipping.label} ({currency}{order.shipping.fee})</p>}
                    <p>Date : {new Date(order.date).toLocaleDateString()}</p>
                  </div>
                  <p className='text-sm sm:text-[15px]'>{currency}{order.amount}</p>
                  <div className='flex flex-col gap-2'>
                  <select onChange={(event)=>statusHandler(event,order._id)} value={order.status} className='p-2 font-semibold'>
                    <option value="Order Placed">Order Placed</option>
                    <option value="Packing">Packing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Out for delivery">Out for delivery</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                  <button onClick={()=>deleteOrder(order)} className='flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md border border-red-200 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600'>
                    <svg className='w-3.5 h-3.5' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'><path d='M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6'/></svg>
                    Delete order
                  </button>
                  </div>
              </div>
          ))
         }
      </div>
      
    </div>
  )
}

export default Orders
