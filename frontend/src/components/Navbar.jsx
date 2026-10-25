import React, { useContext, useState } from 'react'
import {assets} from '../assets/assets'
import { Link, NavLink } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/collection', label: 'Collection' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

const iconButton = 'p-0 border-0 bg-transparent cursor-pointer flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 transition-colors'

const Navbar = ({ theme, toggleTheme }) => {

    const [visible,setVisible] = useState(false);

    const {setShowSearch , getCartCount, navigate, token, setToken, setCartItems} = useContext(ShopContext);

    const logout =() => {

      localStorage.removeItem('token')
      setToken('')
      setCartItems({});
      navigate('/login')

    }

  return (
    <header className='sticky top-0 z-40 -mx-4 px-4 sm:-mx-[5vw] sm:px-[5vw] md:-mx-[7vw] md:px-[7vw] lg:-mx-[9vw] lg:px-[9vw] bg-[var(--background-color)] border-b border-gray-200'>
      <div className='grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_auto_1fr] items-center h-20 sm:h-24 font-medium'>

        {/* Brand logo */}
        <Link to='/' className='justify-self-start'>
          <img src={assets.logo} className='h-14 sm:h-16 w-auto' alt="Velariq Fashion" />
        </Link>

        {/* Main navigation */}
        <nav className='hidden sm:flex gap-8 lg:gap-10 text-xs tracking-[0.2em] uppercase text-gray-700'>
          {
            navLinks.map((link)=>(
              <NavLink key={link.to} to={link.to} className='flex flex-col items-center gap-1 hover:text-black transition-colors'>
                <p>{link.label}</p>
                <hr className='w-2/4 border-none h-[1.5px] bg-gray-700 hidden'/>
              </NavLink>
            ))
          }
        </nav>

        {/* Utility icons */}
        <div className='justify-self-end flex items-center gap-1 sm:gap-2'>

          <button onClick={()=>setShowSearch(true)} aria-label='Search' className={iconButton}>
            <img src={assets.search_icon} className='nav-icon w-[18px]' alt="" />
          </button>

          <div className='group relative'>
            <button onClick={()=> token ? null : navigate('/login')} aria-label='Account' className={iconButton}>
              <img className='nav-icon w-[18px]' src={assets.profile_icon} alt="" />
            </button>

              {/* -----DropDown------- */}
            {token &&
            <div className='group-hover:block hidden absolute dropdown-menu right-0 pt-3 z-50'>
              <div className='flex flex-col gap-2 w-40 py-3 px-5 bg-white text-gray-500 text-sm rounded shadow-lg border border-gray-100'>
                <p className='cursor-pointer hover:text-black'>My Profile</p>
                <p onClick={()=>navigate('/orders')} className='cursor-pointer hover:text-black'>Orders</p>
                <p onClick={logout} className='cursor-pointer hover:text-black'>Logout</p>
              </div>
            </div>}
          </div>

          <Link to='/cart' aria-label='Cart' className={`${iconButton} relative`}>
              <img src={assets.cart_icon} className='nav-icon w-[18px] min-w-[18px]' alt="" />
              <p className='absolute right-0.5 bottom-0.5 w-4 text-center leading-4 bg-black text-white aspect-square rounded-full text-[8px]'>{getCartCount()}</p>
          </Link>

          {/* Theme toggle */}
          <button onClick={toggleTheme} aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'} className={`${iconButton} text-gray-700`}>
            {
              theme === 'light'
              ? <svg className='w-[18px] h-[18px]' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'><path d='M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z'/></svg>
              : <svg className='w-[18px] h-[18px]' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round'><circle cx='12' cy='12' r='4'/><path d='M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4'/></svg>
            }
          </button>

          <button onClick={()=>setVisible(true)} aria-label='Open menu' className={`${iconButton} sm:hidden`}>
            <img src={assets.menu_icon} className='nav-icon w-[18px]' alt="" />
          </button>

        </div>
      </div>

      {/*sidebar menu for small screens*/ }
      <div className={`fixed top-0 right-0 bottom-0 z-50 overflow-hidden bg-white transition-all ${visible ? 'w-full' : 'w-0'}`}>
              <div className='flex flex-col text-gray-600'>
                  <div onClick={()=>setVisible(false)} className='flex items-center gap-4 p-3 cursor-pointer'>
                      <img className='h-4 rotate-180' src={assets.dropdown_icon} alt="" />
                      <p>Back</p>
                  </div >
                  {
                    navLinks.map((link)=>(
                      <NavLink key={link.to} onClick={()=>setVisible(false)} className='py-2 pl-6 border-b uppercase' to={link.to}>{link.label}</NavLink>
                    ))
                  }
              </div>
      </div>

    </header>
  )
}

export default Navbar
