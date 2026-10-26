import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { backendUrl } from '../App'
import { assets } from '../assets/assets'

const CATEGORIES = ['Men', 'Women', 'Kid']
const SUB_CATEGORIES = ['Topwear', 'Bottomwear', 'Winterwear']
const SIZES = ['S', 'M', 'L', 'XL', 'XXL']

const fieldClass = 'w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-800 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900'
const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5'

const EditProductModal = ({ product, token, onClose, onSaved }) => {

  const [name,setName] = useState(product.name)
  const [description,setDescription] = useState(product.description)
  const [price,setPrice] = useState(product.price)
  const [category,setCategory] = useState(product.category)
  const [subCategory,setSubCategory] = useState(product.subCategory)
  const [sizes,setSizes] = useState(product.sizes || [])
  const [bestseller,setBestseller] = useState(!!product.bestseller)
  // a File per slot when the admin picks a replacement; null keeps the current image
  const [newImages,setNewImages] = useState([null, null, null, null])
  const [saving,setSaving] = useState(false)

  useEffect(()=>{
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  },[onClose])

  const pickImage = (index, file) => {
    setNewImages(prev => prev.map((item, i) => i === index ? file : item))
  }

  const toggleSize = (size) => {
    setSizes(prev => prev.includes(size) ? prev.filter(item => item !== size) : [...prev, size])
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      const formData = new FormData()
      formData.append('id', product._id)
      formData.append('name', name)
      formData.append('description', description)
      formData.append('price', price)
      formData.append('category', category)
      formData.append('subCategory', subCategory)
      formData.append('sizes', JSON.stringify(sizes))
      formData.append('bestseller', bestseller)
      newImages.forEach((file, index) => file && formData.append(`image${index + 1}`, file))

      const response = await axios.post(backendUrl + '/api/product/update', formData, { headers: { token } })
      if (response.data.success) {
        toast.success(response.data.message)
        onSaved()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto'>
      <div onClick={onClose} className='fixed inset-0 bg-black/40' />

      <form onSubmit={onSubmit} role='dialog' aria-label='Edit product' className='relative w-full max-w-2xl bg-white rounded-xl shadow-2xl my-8'>

        <div className='flex items-center justify-between px-6 py-4 border-b border-gray-200'>
          <h2 className='text-lg font-semibold text-gray-900'>Edit product</h2>
          <button type='button' onClick={onClose} aria-label='Close' className='text-2xl leading-none text-gray-500 hover:text-gray-900'>&times;</button>
        </div>

        <div className='px-6 py-5 flex flex-col gap-5'>

          {/* Images */}
          <div>
            <p className={labelClass}>Images <span className='font-normal text-gray-500'>(click one to replace it)</span></p>
            <div className='flex flex-wrap gap-3'>
              {
                [0,1,2,3].map((index)=>{
                  const preview = newImages[index] ? URL.createObjectURL(newImages[index]) : product.image[index] || assets.upload_area
                  return (
                    <label key={index} htmlFor={`edit-image-${index}`} className='relative cursor-pointer group'>
                      <img src={preview} className='w-20 h-24 object-cover rounded-md border border-gray-200 bg-gray-50' alt={`Image ${index + 1}`} />
                      <span className='absolute inset-0 rounded-md bg-black/40 text-white text-xs font-medium flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>Change</span>
                      {newImages[index] && <span className='absolute -top-2 -right-2 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded-full'>New</span>}
                      <input id={`edit-image-${index}`} type='file' accept='image/*' hidden onChange={(e)=>pickImage(index, e.target.files[0] || null)} />
                    </label>
                  )
                })
              }
            </div>
          </div>

          <div>
            <label htmlFor='edit-name' className={labelClass}>Product name</label>
            <input id='edit-name' value={name} onChange={(e)=>setName(e.target.value)} className={fieldClass} required />
          </div>

          <div>
            <label htmlFor='edit-description' className={labelClass}>Description</label>
            <textarea id='edit-description' value={description} onChange={(e)=>setDescription(e.target.value)} rows={3} className={fieldClass} required />
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
            <div>
              <label htmlFor='edit-category' className={labelClass}>Category</label>
              <select id='edit-category' value={category} onChange={(e)=>setCategory(e.target.value)} className={`${fieldClass} bg-white`}>
                {CATEGORIES.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor='edit-subcategory' className={labelClass}>Sub category</label>
              <select id='edit-subcategory' value={subCategory} onChange={(e)=>setSubCategory(e.target.value)} className={`${fieldClass} bg-white`}>
                {SUB_CATEGORIES.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor='edit-price' className={labelClass}>Price</label>
              <input id='edit-price' type='number' min='0' value={price} onChange={(e)=>setPrice(e.target.value)} className={fieldClass} required />
            </div>
          </div>

          <div>
            <p className={labelClass}>Sizes</p>
            <div className='flex flex-wrap gap-2'>
              {
                SIZES.map(size => (
                  <button
                    type='button'
                    key={size}
                    onClick={()=>toggleSize(size)}
                    className={`px-3 py-1.5 text-sm rounded-md border ${sizes.includes(size) ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-900'}`}
                  >{size}</button>
                ))
              }
            </div>
          </div>

          <label className='flex items-center gap-2 text-sm text-gray-700 cursor-pointer'>
            <input type='checkbox' checked={bestseller} onChange={()=>setBestseller(!bestseller)} className='w-4 h-4 accent-gray-900' />
            Show in bestsellers
          </label>
        </div>

        <div className='flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl'>
          <button type='button' onClick={onClose} className='px-5 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-white'>Cancel</button>
          <button type='submit' disabled={saving} className='px-5 py-2 text-sm rounded-md bg-gray-900 text-white hover:bg-black disabled:opacity-60'>{saving ? 'Saving…' : 'Save changes'}</button>
        </div>

      </form>
    </div>
  )
}

export default EditProductModal
