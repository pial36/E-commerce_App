import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from './Title';
import ProductItem from './ProductItem';
import { Link } from 'react-router-dom';

const LATEST_COUNT = 30

// category pills above the grid; value matches product.category
const FILTERS = [
    { label: 'ALL', value: null },
    { label: 'MEN', value: 'Men' },
    { label: 'WOMEN', value: 'Women' },
    { label: 'KID', value: 'Kid' },
]

const LatestCollection = () => {

    const {products} = useContext(ShopContext);
    const [latestProducts,setLatestProducts] = useState([])
    const [category,setCategory] = useState(null)

    useEffect(()=>{
        // newest first: the most recently added products
        const newest = [...products].sort((a,b) => (b.date || 0) - (a.date || 0))
        const filtered = category ? newest.filter(item => item.category === category) : newest
        setLatestProducts(filtered.slice(0,LATEST_COUNT))
    },[products, category])
  return (
    <div className='my-10'>
      <div className='text-center py-8 text-3xl'>
          <Title text1={'LATEST'} text2={'COLLECTIONS'} />
          <p className='m-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600'>Discover the latest styles from VELARIQ, where timeless elegance meets modern fashion. Explore our exclusive collection, thoughtfully curated to bring sophistication and confidence to every look.</p>

      </div>

      {/* Category filter: scrolls sideways on small screens */}
      <div role='tablist' aria-label='Filter by category' className='no-scrollbar flex gap-3 overflow-x-auto pb-6 -mt-2 sm:justify-center'>
        {
            FILTERS.map((filter)=>{
                const active = category === filter.value
                return (
                    <button
                        key={filter.label}
                        role='tab'
                        aria-selected={active}
                        onClick={()=>setCategory(filter.value)}
                        className={`flex-shrink-0 px-6 py-2 rounded-full border text-sm font-medium tracking-wide transition-colors ${active ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-800 text-gray-800 hover:bg-gray-100'}`}
                    >{filter.label}</button>
                )
            })
        }
      </div>

      {/* Rendering Products */}
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6'>
        {
            latestProducts.map((item)=>(
                <ProductItem key={item._id} id={item._id} image={item.image} name={item.name} price={item.price} />
            ))
        }

      </div>

      {
        products.length > 0 && latestProducts.length === 0 &&
        <p className='text-center text-sm text-gray-500 py-10'>No products in this category yet.</p>
      }

      {/* View all: opens the collection page filtered to the selected pill */}
      {
        products.length > 0 &&
        <div className='flex justify-center mt-10'>
          <Link
            to={category ? `/collection?category=${category}` : '/collection'}
            aria-label={category ? `View all ${category} products` : 'View all products'}
            className='inline-flex items-center gap-2 px-8 py-3 border border-gray-900 text-sm font-medium tracking-[0.15em] text-gray-900 hover:bg-gray-900 hover:text-white transition-colors'
          >
            VIEW ALL
            <span aria-hidden='true'>&rarr;</span>
          </Link>
        </div>
      }
      
    </div>
  )
}

export default LatestCollection
