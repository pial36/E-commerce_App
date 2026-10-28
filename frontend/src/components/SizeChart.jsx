import React, { useState } from 'react'

// Product size chart with INCH / CM tabs. Measurements are stored in inches.
const UNITS = [
  { key: 'inch', label: 'INCH', title: 'inches', convert: (value) => value },
  { key: 'cm', label: 'CM', title: 'centimeters', convert: (value) => Math.round(value * 2.54 * 10) / 10 },
]

const SizeChart = ({ rows }) => {

  const [unitKey,setUnitKey] = useState('inch')
  const unit = UNITS.find(item => item.key === unitKey)
  const show = (value) => (value === undefined || value === null ? '–' : unit.convert(value))

  return (
    <div className='mt-8 sm:w-4/5'>
      <p className='font-semibold text-gray-800 mb-3'>Size chart - In {unit.title} <span className='font-normal text-gray-500'>(Expected Deviation &lt; 3%)</span></p>

      <div role='tablist' aria-label='Size chart unit' className='flex border-b border-gray-200'>
        {
          UNITS.map(item => (
            <button
              key={item.key}
              role='tab'
              aria-selected={item.key === unitKey}
              onClick={()=>setUnitKey(item.key)}
              className={`-mb-px px-6 py-2.5 text-sm border rounded-t-md ${item.key === unitKey ? 'bg-white border-gray-200 border-b-white text-gray-900' : 'bg-gray-100 border-transparent text-gray-600 hover:text-gray-900'}`}
            >{item.label}</button>
          ))
        }
      </div>

      <table className='w-full text-sm mt-3 border-separate border-spacing-y-1'>
        <thead>
          <tr className='bg-gray-100 text-left text-gray-800'>
            <th className='px-3 py-2.5 font-semibold'>Size</th>
            <th className='px-3 py-2.5 font-semibold'>Chest (round)</th>
            <th className='px-3 py-2.5 font-semibold'>Length</th>
          </tr>
        </thead>
        <tbody>
          {
            rows.map(row => (
              <tr key={row.size} className='bg-gray-50 text-gray-700'>
                <td className='px-3 py-2.5'>{row.size}</td>
                <td className='px-3 py-2.5'>{show(row.chest)}</td>
                <td className='px-3 py-2.5'>{show(row.length)}</td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  )
}

export default SizeChart
