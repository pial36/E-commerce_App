import orderModel from "../models/orderModel.js"
import userModel from "../models/userModel.js"
import productModel from "../models/productModel.js"
import Stripe from 'stripe'
import razorpay from 'razorpay'


// global variable 
const currency = 'usd'
// Shipping rates live on the server; the client only picks a method
const shippingRates = {
    inside_dhaka: { label: 'Inside Dhaka', fee: 100 },
    outside_dhaka: { label: 'Outside Dhaka', fee: 150 },
}

// gateway initialize 
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// const razorpayInstance = new razorpay({
//     key_id : process.env.RAZORPAY_SECRET_KEY_ID,
//     key_secret : process.env.RAZORPAY_KEY_SECRET,
// })

// Build order items from the database so the client can't set prices.
// Only _id, size and quantity are taken from the request.
const buildOrderItems = async (requestItems, shippingMethod = 'inside_dhaka') => {
    const shipping = shippingRates[shippingMethod]
    if (!shipping) {
        throw new Error("Invalid shipping method")
    }

    if (!Array.isArray(requestItems) || requestItems.length === 0) {
        throw new Error("Cart is empty")
    }

    const items = []
    for (const requestItem of requestItems) {
        const quantity = Number(requestItem.quantity)
        if (!Number.isInteger(quantity) || quantity < 1) {
            throw new Error("Invalid quantity")
        }

        const product = await productModel.findById(requestItem._id)
        if (!product) {
            throw new Error("Product not found")
        }
        if (!product.sizes.includes(requestItem.size)) {
            throw new Error(`Size not available for ${product.name}`)
        }

        items.push({
            _id: product._id.toString(),
            name: product.name,
            price: product.price,
            image: product.image,
            category: product.category,
            subCategory: product.subCategory,
            size: requestItem.size,
            quantity
        })
    }

    const amount = items.reduce((sum, item) => sum + item.price * item.quantity, 0) + shipping.fee

    return { items, amount, shipping: { method: shippingMethod, label: shipping.label, fee: shipping.fee } }
}

//  Placing Order using COD method
const placeOrder = async (req,res) => {

    try {

        const { userId, address } = req.body
        const { items, amount, shipping } = await buildOrderItems(req.body.items, req.body.shippingMethod)

        const orderData = {
            userId,
            items,
            amount,
            address,
            shipping,
            paymentMethod:"COD",
            payment:false,
            date: Date.now()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        await userModel.findByIdAndUpdate(userId,{cartData:{}})
        
        res.json({success: true, message: "Order Placed"})


    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message})
        
    }


}

//  Placing Order using bkash method
const placeOrderStripe = async (req,res) => {
    try {
        
        const { userId, address } = req.body
        const { items, amount, shipping } = await buildOrderItems(req.body.items, req.body.shippingMethod)
        const { origin } = req.headers;

        const orderData = {
            userId,
            items,
            amount,
            address,
            shipping,
            paymentMethod:"Stripe",
            payment:false,
            date: Date.now()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        const line_items = items.map((item)=> ({
            price_data: {
                currency:currency,
                product_data: {
                    name:item.name
                },
                unit_amount: Math.round(item.price * 100)
            },
            quantity: item.quantity
        }))

        line_items.push({
            price_data: {
                currency:currency,
                product_data: {
                    name:`Delivery Charges (${shipping.label})`
                },
                unit_amount: shipping.fee * 100
            },
            quantity: 1
        })

        const session = await stripe.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}`,
            line_items,
            mode : 'payment',

        })

        newOrder.stripeSessionId = session.id
        await newOrder.save()

        res.json({success:true,session_url:session.url})

    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message})
    }
}

// Verify Stripe
// Payment status comes from Stripe, not from the `success` query param,
// and only the user who placed the order can verify or cancel it.
const verifyStripe = async (req,res) => {

    const { orderId, userId } = req.body

    try {
        const order = await orderModel.findOne({ _id: orderId, userId })
        if (!order || !order.stripeSessionId) {
            return res.json({success: false, message: "Order not found"})
        }

        if (order.payment) {
            return res.json({success: true})
        }

        const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId)

        if (session.payment_status === 'paid') {
            order.payment = true
            await order.save()
            await userModel.findByIdAndUpdate(userId, {cartData: {}})
            res.json({success: true});

        } else {
            await orderModel.deleteOne({ _id: order._id, payment: false })
            res.json({success:false})
        }
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message})
    }
}



//  Placing Order using razorpay method
const placeOrderRazorpay = async (req,res) => {

    // try {
        
    //     const { userId, items, amount, address, } = req.body
        

    //     const orderData = {
    //         userId,
    //         items,
    //         amount,
    //         address,
    //         paymentMethod:"Razorpay",
    //         payment:false,
    //         date: Date.now()
    //     }

    //     const newOrder = new orderModel(orderData)
    //     await newOrder.save()

    //     const options= {
    //         amount: amount * 100,
    //         currency: currency.toUpperCase(),
    //         receipt: newOrder._id.toString()
    //     }

    //     await razorpayInstance.orders.create(options, (error,order)=>{
    //         if (error) {
    //             console.log(error);
    //             return res.json({success:false, message: error})
                
    //         }
    //         res.json({success:true,order})
    //     })

    // } catch (error) {
    //     console.log(error);
    //     res.json({success: false, message: error.message})
    // }
}


// all Orders data for admin panel
const allOrders = async (req,res) => {

    try {
        
        const orders = await orderModel.find({}) 
        res.json({success:true,orders})
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message})
    }
}

// User order Data for Forntdata
const userOrders = async (req,res) => {
    try {
        
        const { userId } = req.body

        const orders = await orderModel.find({ userId })
        res.json({success:true, orders})
 
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message})
    }

}

// Update order status from admin panel
const updateStatus = async (req,res) => {
    try {
        const { orderId, status } = req.body

        await orderModel.findByIdAndUpdate (orderId, { status })
        res.json({success: true, message: 'Status Updated'})

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}


export { placeOrder, placeOrderStripe, placeOrderRazorpay, allOrders, userOrders, updateStatus, verifyStripe }