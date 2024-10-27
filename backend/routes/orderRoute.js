import express from 'express'
import { placeOrder, allOrders, userOrders, updateStatus, placeOrderStripe, placeOrderRazorpay, verifyStripe } from '../controllers/orderController.js' 
import adminAuth from '../middleware/adminAuth.js'
import authUser from '../middleware/auth.js'

const orderRouter = express.Router()

// admin Feature
orderRouter.post('/list',adminAuth,allOrders)
orderRouter.post('/status',adminAuth,updateStatus)

// Payment feature
orderRouter.post('/place',authUser,placeOrder)
orderRouter.post('/stripe',authUser,placeOrderStripe)
orderRouter.post('/razorpay',authUser,placeOrderRazorpay)

// User Feature
orderRouter.post('/userorders',authUser,userOrders)

// verify payment 
orderRouter.post('/verifyStripe',authUser,verifyStripe)


export default orderRouter