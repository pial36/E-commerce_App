import React from 'react'
import {assets} from '../assets/assets.js'

const STORE_URL = 'https://velariqfashion.com'

const Navbar = ({setToken}) => {
  return (
    <header className='sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-200'>
      <div className='flex items-center justify-between h-16 sm:h-20 px-[4%]'>

        {/* Brand */}
        <div className='flex items-center gap-4'>
          <img className='h-11 sm:h-14 w-auto' src={assets.logo} alt="Velariq Fashion" />
          <span className='hidden sm:block h-8 w-px bg-gray-200' />
          <span className='hidden sm:block text-xs font-medium tracking-[0.25em] uppercase text-gray-500'>Admin Panel</span>
        </div>

        {/* Actions */}
        <div className='flex items-center gap-2 sm:gap-3'>
          <a
            href={STORE_URL}
            target='_blank'
            rel='noreferrer'
            className='hidden sm:flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors'
          >
            View store
            <svg className='w-3.5 h-3.5' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M7 17 17 7M8 7h9v9'/></svg>
          </a>
          <button
            onClick={()=>setToken('')}
            className='flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-colors'
          >
            <svg className='w-4 h-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'><path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9'/></svg>
            Logout
          </button>
        </div>

      </div>
    </header>
  )
}

export default Navbar
