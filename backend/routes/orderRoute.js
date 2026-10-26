import express from 'express'
import { placeOrder, allOrders, userOrders, updateStatus, deleteOrder, recentOrders, placeOrderStripe, placeOrderRazorpay, verifyStripe } from '../controllers/orderController.js' 
import adminAuth from '../middleware/adminAuth.js'
import authUser from '../middleware/auth.js'
import optionalAuth from '../middleware/optionalAuth.js'

const orderRouter = express.Router()

// admin Feature
orderRouter.post('/list',adminAuth,allOrders)
orderRouter.post('/status',adminAuth,updateStatus)
orderRouter.post('/delete',adminAuth,deleteOrder)
orderRouter.post('/recent',adminAuth,recentOrders)

// Payment feature
// open to guests and signed-in customers
orderRouter.post('/place',optionalAuth,placeOrder)
orderRouter.post('/stripe',optionalAuth,placeOrderStripe)
orderRouter.post('/razorpay',authUser,placeOrderRazorpay)

// User Feature
orderRouter.post('/userorders',authUser,userOrders)

// verify payment 
orderRouter.post('/verifyStripe',optionalAuth,verifyStripe)


export default orderRouter