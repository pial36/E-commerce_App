// Per-product size chart: one row per size with chest (round) and length
// in inches, e.g. [{ size: 'M', chest: 39, length: 27.5 }]. The store
// converts to centimetres for display.

const MAX_ROWS = 10

const toMeasurement = (value) => {
    if (value === undefined || value === null || value === '') return undefined
    const number = Number(value)
    if (!Number.isFinite(number) || number <= 0 || number >= 200) {
        throw new Error('Size chart measurements must be numbers between 0 and 200 inches')
    }
    return Math.round(number * 10) / 10
}

// Parses the JSON string sent by the admin panel; returns clean rows or throws.
// Rows with no measurements are dropped.
export const parseSizeChart = (value) => {
    if (value === undefined || value === null || value === '') return []
    const rows = typeof value === 'string' ? JSON.parse(value) : value
    if (!Array.isArray(rows) || rows.length > MAX_ROWS) {
        throw new Error('Invalid size chart')
    }
    return rows
        .map((row) => {
            const size = String(row?.size ?? '').trim().slice(0, 10)
            if (!size) throw new Error('Every size chart row needs a size')
            return { size, chest: toMeasurement(row.chest), length: toMeasurement(row.length) }
        })
        .filter((row) => row.chest !== undefined || row.length !== undefined)
}
