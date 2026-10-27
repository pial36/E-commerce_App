import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'
import EditProductModal from '../components/EditProductModal'
import { discountOf, salePrice } from '../pricing'

const List = () => {


  const [list,setList] = useState([])
  const [editing,setEditing] = useState(null)

  const fetchList = async () => {
    try {
      
      const response = await axios.get(backendUrl + '/api/product/list')
      if (response.data.success) {
        setList(response.data.products);
      }
      else{
        toast.error(response.data.message)
      }
    
      
    } catch (error) {
      console.log(error);
      toast.error(error.message)
      
    }
  }

  const removeProduct = async (item) =>{
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return
    const id = item._id
    try {
      const response = await axios.post(backendUrl + '/api/product/remove', {id})

      if (response.data.success) {
        toast.success(response.data.message)
        await fetchList();
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message)
    }
  }

  useEffect(()=>{
    fetchList()
  },[])


  return (
    <>
      <p className='mb-2'>All Products List</p>
      <div className='flex flex-col gap-2'>
        {/* ---------list table Title--------- */}
        <div className=' md:grid grid-cols-[1fr_3fr_1fr_1fr_1fr] items-center py-1 px-2 border bg-gray-100 text-sm hidden'>
          <b>Image</b>
          <b>Name</b>
          <b>Category</b>
          <b>Price</b>
          <b className='text-center'>Action</b>
        </div>


        {/* -------products list--------- */}
        {
          list.map((item,index) => (
            <div className='grid grid-cols-[1fr_3fr_1fr] md:grid-cols-[1fr_3fr_1fr_1fr_1fr] items-center gap-2 py-1 px-2 border text-sm' key={index}>
                <img className='w-12' src={item.image[0]} alt="" />
                <p>{item.name}</p>
                <p>{item.category}</p>
                <p>
                  {currency}{salePrice(item)}
                  {discountOf(item) > 0 && <><span className='ml-1.5 text-xs text-gray-400 line-through'>{currency}{item.price}</span><span className='ml-1.5 text-xs font-semibold text-rose-600'>-{discountOf(item)}%</span></>}
                </p>
                <div className='flex justify-center items-center gap-3'>
                  <button onClick={()=>setEditing(item)} aria-label={`Edit ${item.name}`} title='Edit' className='w-7 h-7 flex items-center justify-center rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-200'>
                    <svg className='w-[18px] h-[18px]' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'><path d='M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z'/></svg>
                  </button>
                  <img onClick={()=>removeProduct(item)} title='Delete' className='w-7 h-7 sm:w-6 sm:h-6 md:w-7 md:h-7 cursor-pointer' src={assets.remove_icon} alt="Delete" />
                </div>
                {/* <p onClick={()=>removeProduct(item._id)} className='text- right md:text-center cursor-pointer text-lg'>X</p> */}
            </div>
          ))
        }
      </div>

      {
        editing &&
        <EditProductModal
          product={editing}
          onClose={()=>setEditing(null)}
          onSaved={async ()=>{ setEditing(null); await fetchList() }}
        />
      }
    </>
  )
}

export default List
