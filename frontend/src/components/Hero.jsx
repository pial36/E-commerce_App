import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { assets } from '../assets/assets'

const slides = assets.hero_slides

// The slider keeps the old hero's footprint: one 1259x1008 image on mobile,
// and that image beside the text column (2518x1008) from sm up. The 16:9
// slides are cropped to fit, so each one sets where to anchor the crop.
const slidePositions = ['object-center', 'object-[75%_0%]', 'object-[75%_0%]', 'object-center']

const Hero = () => {

    const trackRef = useRef(null)
    const [current,setCurrent] = useState(0)
    const [paused,setPaused] = useState(false)

    const goTo = (index) => {
        const track = trackRef.current
        if (!track) return
        const next = (index + slides.length) % slides.length
        track.scrollTo({ left: next * track.clientWidth, behavior: 'smooth' })
    }

    const currentRef = useRef(0)
    currentRef.current = current
    const widthRef = useRef(0)

    // keep the dots in sync when the user swipes or scrolls by hand
    const onScroll = () => {
        const track = trackRef.current
        if (!track) return
        // scrolls caused by a resize are not user navigation; the observer below re-aligns those
        if (track.clientWidth !== widthRef.current) return
        setCurrent(Math.round(track.scrollLeft / track.clientWidth))
    }

    // slide width changes with the window, so re-align to the current slide
    useEffect(()=>{
        const track = trackRef.current
        if (!track) return
        const observer = new ResizeObserver(()=>{
            widthRef.current = track.clientWidth
            track.scrollTo({ left: currentRef.current * track.clientWidth })
        })
        observer.observe(track)
        return () => observer.disconnect()
    },[])

    // auto-advance every 5 seconds, paused while hovering or touching
    useEffect(()=>{
        if (paused) return
        const timer = setInterval(()=> goTo(current + 1), 5000)
        return () => clearInterval(timer)
    },[current,paused])

  return (
    <div
      className='relative border border-gray-400'
      onMouseEnter={()=>setPaused(true)}
      onMouseLeave={()=>setPaused(false)}
      onTouchStart={()=>setPaused(true)}
      onTouchEnd={()=>setPaused(false)}
    >
      {/* Horizontal scroll track */}
      <div
        ref={trackRef}
        onScroll={onScroll}
        className='flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none]'
      >
        {
          slides.map((image,index)=>(
            <Link key={index} to='/collection' className='w-full flex-shrink-0 snap-start'>
              <img className={`w-full aspect-[1259/1008] sm:aspect-[2518/1008] object-cover ${slidePositions[index]}`} src={image} alt={`Collection slide ${index + 1}`} />
            </Link>
          ))
        }
      </div>

      {/* Prev / Next arrows */}
      <button
        onClick={()=>goTo(current - 1)}
        aria-label='Previous slide'
        className='absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 p-0 border-0 rounded-full bg-white/70 hover:bg-white text-gray-800 text-xl flex items-center justify-center'
      >&#8249;</button>
      <button
        onClick={()=>goTo(current + 1)}
        aria-label='Next slide'
        className='absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 p-0 border-0 rounded-full bg-white/70 hover:bg-white text-gray-800 text-xl flex items-center justify-center'
      >&#8250;</button>

      {/* Dots */}
      <div className='absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2'>
        {
          slides.map((_,index)=>(
            <button
              key={index}
              onClick={()=>goTo(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`h-2 p-0 border-0 rounded-full transition-all ${index === current ? 'w-6 bg-gray-800' : 'w-2 bg-white/80'}`}
            />
          ))
        }
      </div>
    </div>
  )
}

export default Hero
