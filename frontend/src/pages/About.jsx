import React from 'react'
import Title from '../components/Title'
import { assets } from '../assets/assets'
import NewsletterBox from '../components/NewsletterBox'

const About = () => {
  return (
    <div>
      
      <div className='text-2xl text-center pt-8 border-t'>
        <Title text1={'ABOUT'} text2={'US'} />
      </div>
      
      <div className='my-10 flex flex-col md:flex-row gap-16'>
        <img className='w-full md:max-w-[450px]' src={assets.about_img} alt="" />
        <div className='flex flex-col justify-center gap-6 md:w-2/4 text-gray-600'>
          <p>Velariq is a premium fashion brand created for girls who love to look and feel their best. Every piece is chosen with care for its quality, comfort, and timeless style.</p>
          <b className='text-gray-800'>Our Mission</b>
          <p>From everyday elegance to special-occasion looks, our collections are designed to make every girl feel beautiful, effortlessly.</p>
        </div>
      </div>


      <div className='text-4xl py-4'>
          <Title text1={'WHY'} text2={'CHOOSE US'} />
      </div>

      <div className='flex flex-col md:flex-row text-sm md:-20'>
        <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5'>
          <b>Quality Assurance:</b>
          <p className='text-gray-600'>Premium Quality Every piece is carefully selected for fine fabrics, neat stitching, and lasting comfort.</p>
        </div>
        <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5'>
          <b>Convenience:</b>
          <p className='text-gray-600'>Effortless Shopping Browse, order, and receive your favorites at home with a smooth and secure experience.</p>
        </div>
        <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5'>
          <b>Exceptional Customer Services:</b>
          <p className='text-gray-600'>Dedicated Support Our team is here every day to help with sizing, orders, and styling questions.</p>
        </div>
      </div>

      <NewsletterBox/>

    </div>
  )
}

export default About
