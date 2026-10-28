import React from 'react'

// Size chart editor for Add / Edit product. One row per selected size;
// chest (round) and length in inches. Leave a row empty to skip it, or
// leave everything empty for no chart.
//
// chart: { [size]: { chest, length } } (strings while typing)

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL']

export const orderedSizes = (sizes) =>
  [...sizes].sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(a), ib = SIZE_ORDER.indexOf(b)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })

// product.sizeChart (array) -> editor state (object by size)
export const chartToState = (rows = []) =>
  Object.fromEntries(rows.map(row => [row.size, { chest: row.chest ?? '', length: row.length ?? '' }]))

// editor state -> array sent to the API (only selected sizes with a value)
export const stateToChart = (chart, sizes) =>
  orderedSizes(sizes)
    .map(size => ({ size, chest: chart[size]?.chest ?? '', length: chart[size]?.length ?? '' }))
    .filter(row => String(row.chest).trim() !== '' || String(row.length).trim() !== '')

const cellInput = 'w-full px-2 py-1.5 border border-gray-300 rounded text-sm outline-none focus:border-gray-900'

const SizeChartEditor = ({ sizes, chart, onChange }) => {

  const setValue = (size, field, value) => {
    onChange({ ...chart, [size]: { ...chart[size], [field]: value } })
  }

  return (
    <div className='w-full max-w-[500px]'>
      <p className='mb-2'>Size chart <span className='text-xs text-gray-400'>(inches · optional · shown on the product page with a CM tab)</span></p>
      {
        sizes.length === 0
        ? <p className='text-xs text-gray-400'>Select sizes first.</p>
        : <table className='w-full text-sm border border-gray-200 bg-white'>
            <thead className='bg-gray-50 text-left text-gray-600'>
              <tr>
                <th className='px-3 py-2 font-medium w-20'>Size</th>
                <th className='px-3 py-2 font-medium'>Chest (round)</th>
                <th className='px-3 py-2 font-medium'>Length</th>
              </tr>
            </thead>
            <tbody>
              {
                orderedSizes(sizes).map(size => (
                  <tr key={size} className='border-t border-gray-200'>
                    <td className='px-3 py-1.5 font-medium text-gray-700'>{size}</td>
                    <td className='px-3 py-1.5'>
                      <input type='number' min='0' step='0.5' placeholder='e.g. 39' aria-label={`${size} chest in inches`} value={chart[size]?.chest ?? ''} onChange={(e)=>setValue(size, 'chest', e.target.value)} className={cellInput} />
                    </td>
                    <td className='px-3 py-1.5'>
                      <input type='number' min='0' step='0.5' placeholder='e.g. 27.5' aria-label={`${size} length in inches`} value={chart[size]?.length ?? ''} onChange={(e)=>setValue(size, 'length', e.target.value)} className={cellInput} />
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
      }
    </div>
  )
}

export default SizeChartEditor
