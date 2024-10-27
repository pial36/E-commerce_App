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
          <p>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Necessitatibus obcaecati atque laboriosam error illum quia quos.</p>
          <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Tempore enim natus vitae error officia magni optio omnis unde, eaque modi assumenda neque voluptatem necessitatibus corrupti ullam iusto, quos dicta excepturi.</p>
          <b className='text-gray-800'>Our Mission</b>
          <p>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Reiciendis, iste molestiae maxime incidunt fugit odit. Architecto nisi voluptatibus minima eum molestiae commodi culpa itaque tempora dolorum assumenda, ad iusto rem</p>
        </div>
      </div>


      <div className='text-4xl py-4'>
          <Title text1={'WHY'} text2={'CHOOSE US'} />
      </div>

      <div className='flex flex-col md:flex-row text-sm md:-20'>
        <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5'>
          <b>Quality Assurance:</b>
          <p className='text-gray-600'>The European languages are members of the same family. Their separate existence is a myth.</p>
        </div>
        <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5'>
          <b>Convenience:</b>
          <p className='text-gray-600'>To achieve this, it would be necessary to have uniform grammar, pronunciation and more common words.</p>
        </div>
        <div className='border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5'>
          <b>Exceptional Customer Services:</b>
          <p className='text-gray-600'> If several languages coalesce, the grammar of the resulting language is more simple and regular than that of the individual languages.</p>
        </div>
      </div>

      <NewsletterBox/>

    </div>
  )
}

export default About
