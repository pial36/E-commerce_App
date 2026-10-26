import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import userRouter from './routes/userRoute.js'
import productRouter from './routes/productRoute.js'
import cartRouter from './routes/cartRoute.js'
import orderRouter from './routes/orderRoute.js'
import authRouter from './routes/authRoute.js'

// Sites allowed to call the API with cookies. Add more (comma-separated)
// with the ALLOWED_ORIGINS environment variable.
const allowedOrigins = [
    'https://velariqfashion.com',
    'https://www.velariqfashion.com',
    'https://admin.velariqfashion.com',
    'http://localhost:5173',
    'http://localhost:5174',
    ...(process.env.ALLOWED_ORIGINS || '').split(',').map(origin => origin.trim()).filter(Boolean),
]

const app = express()

// Hostinger terminates HTTPS in front of the app; trust it so req.secure is
// true and the session cookies get the Secure flag
app.set('trust proxy', 1)

// Middleware
app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)),
    credentials: true,
}))

// CORS only stops other sites reading responses; it doesn't stop the request.
// Refuse state-changing requests that a browser sends from any other site.
app.use((req, res, next) => {
    const origin = req.headers.origin
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && origin && !allowedOrigins.includes(origin)) {
        return res.status(403).json({ success: false, message: 'Origin not allowed' })
    }
    next()
})

//Api Endpoints
app.use('/api/auth',authRouter)
app.use('/api/user',userRouter)
app.use('/api/product',productRouter)
app.use('/api/cart',cartRouter)
app.use('/api/order',orderRouter)


app.get('/',(req,res)=>{
    res.send("API Working")
})

export default app
