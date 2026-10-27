import orderModel from "../models/orderModel.js"
import userModel from "../models/userModel.js"
import productModel from "../models/productModel.js"
import Stripe from 'stripe'
import crypto from 'crypto'
import { salePrice, discountOf } from "../utils/pricing.js"
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

        // the photo the customer picked (they can show different colours); default first
        const imageIndex = Number(requestItem.imageIndex)
        const chosen = Number.isInteger(imageIndex) && imageIndex >= 0 && imageIndex < product.image.length ? imageIndex : 0

        items.push({
            _id: product._id.toString(),
            name: product.name,
            // what the customer pays per item (discount applied); original kept for records
            price: salePrice(product),
            originalPrice: product.price,
            discountPercent: discountOf(product),
            // image[0] is the picked photo, which is what order screens show
            image: [product.image[chosen]],
            imageIndex: chosen,
            category: product.category,
            subCategory: product.subCategory,
            size: requestItem.size,
            quantity
        })
    }

    const amount = items.reduce((sum, item) => sum + item.price * item.quantity, 0) + shipping.fee

    return { items, amount, shipping: { method: shippingMethod, label: shipping.label, fee: shipping.fee } }
}

const hashGuestKey = (key) => crypto.createHash('sha256').update(String(key)).digest('hex')

// Delivery details are required for every order, guest or not
const validateAddress = (address) => {
    if (!address || typeof address !== 'object') return 'Please enter your delivery details'
    const required = { email: 'an email or phone number', lastName: 'a last name', street: 'an address', city: 'a city', phone: 'a phone number' }
    for (const [field, label] of Object.entries(required)) {
        const value = address[field]
        if (typeof value !== 'string' || !value.trim()) return `Please enter ${label}`
        if (value.length > 200) return 'Delivery details are too long'
    }
    return null
}

// Fields shared by COD and card orders. Guests get a random key (only its
// hash is stored) that lets their browser confirm the card payment later.
const newOrderFields = (userId, address, items, amount, shipping, paymentMethod) => {
    const guest = !userId
    const guestKey = guest ? crypto.randomBytes(24).toString('base64url') : undefined
    return {
        guestKey,
        orderData: {
            userId: userId || undefined,
            guest,
            guestKeyHash: guest ? hashGuestKey(guestKey) : undefined,
            items,
            amount,
            address,
            shipping,
            paymentMethod,
            payment:false,
            date: Date.now()
        }
    }
}

//  Placing Order using COD method
const placeOrder = async (req,res) => {

    try {

        const { userId, address } = req.body
        const addressError = validateAddress(address)
        if (addressError) {
            return res.json({success: false, message: addressError})
        }
        const { items, amount, shipping } = await buildOrderItems(req.body.items, req.body.shippingMethod)

        const { orderData, guestKey } = newOrderFields(userId, address, items, amount, shipping, "COD")

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        if (userId) {
            await userModel.findByIdAndUpdate(userId,{cartData:{}})
        }
        
        res.json({success: true, message: "Order Placed", orderId: newOrder._id, amount, guestKey})


    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message})
        
    }


}

//  Placing Order using bkash method
const placeOrderStripe = async (req,res) => {
    try {
        
        const { userId, address } = req.body
        const addressError = validateAddress(address)
        if (addressError) {
            return res.json({success: false, message: addressError})
        }
        const { items, amount, shipping } = await buildOrderItems(req.body.items, req.body.shippingMethod)
        const { origin } = req.headers;

        const { orderData, guestKey } = newOrderFields(userId, address, items, amount, shipping, "Stripe")

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

        res.json({success:true,session_url:session.url,orderId:newOrder._id,guestKey})

    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message})
    }
}

// Verify Stripe
// Payment status comes from Stripe, not from the `success` query param,
// and only whoever placed the order can verify or cancel it: the signed-in
// customer, or for a guest order the browser holding its guest key.
const verifyStripe = async (req,res) => {

    const { orderId, userId, guestKey } = req.body

    try {
        let order = await orderModel.findOne(userId ? { _id: orderId, userId } : { _id: orderId, guest: true })
        if (order && !userId && (!guestKey || hashGuestKey(guestKey) !== order.guestKeyHash)) {
            order = null
        }
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
            if (userId) {
                await userModel.findByIdAndUpdate(userId, {cartData: {}})
            }
            res.json({success: true, amount: order.amount});

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
        
        // newest first so the admin sees recent orders at the top
        const orders = await orderModel.find({}).sort({ date: -1 })
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

// New orders since a timestamp, for the admin notification bell.
// Returns a small summary of the latest 20 plus the total count.
const recentOrders = async (req,res) => {
    try {
        const since = Number(req.body.since) || 0
        const filter = { date: { $gt: since } }

        const [count, orders] = await Promise.all([
            orderModel.countDocuments(filter),
            orderModel.find(filter)
                .sort({ date: -1 })
                .limit(20)
                .select('address.firstName address.lastName amount date paymentMethod items.quantity')
        ])

        res.json({ success: true, count, orders })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Delete an order from admin panel
const deleteOrder = async (req,res) => {
    try {
        const { orderId } = req.body

        const deleted = await orderModel.findByIdAndDelete(orderId)
        if (!deleted) {
            return res.json({success: false, message: 'Order not found'})
        }
        res.json({success: true, message: 'Order Deleted'})

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
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


export { placeOrder, placeOrderStripe, placeOrderRazorpay, allOrders, userOrders, updateStatus, verifyStripe, deleteOrder, recentOrders }