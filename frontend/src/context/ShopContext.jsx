import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from 'axios'
import { refreshSession, setSignedOutHandler } from "../authClient";

export const ShopContext = createContext();

// Guests have no server cart, so their cart is kept in localStorage to survive a refresh.
// Signed-in carts live on the server; on sign-in the guest cart is merged into it.
const GUEST_CART_KEY = 'guestCart'

const readGuestCart = () => {
    try {
        return JSON.parse(localStorage.getItem(GUEST_CART_KEY)) || {}
    } catch {
        return {}
    }
}

 export const ShopContextProvider = (props) => {

    const currency ='৳';
    // must match shippingRates in backend/controllers/orderController.js
    const shippingRates = {
        inside_dhaka: { label: 'Inside Dhaka', fee: 100 },
        outside_dhaka: { label: 'Outside Dhaka', fee: 150 },
    };
    const delivery_fee = shippingRates.inside_dhaka.fee;
    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const [search,setSearch] = useState('');
    const [showSearch,setShowSearch] = useState(false);
    const [cartItems,setCartItems] = useState(readGuestCart);
    const [products,setProducts] = useState([]);
    // signed-in customer ({ name, email }) or null; the session itself is in httpOnly cookies
    const [user,setUser] = useState(null);
    const [authReady,setAuthReady] = useState(false);
    const isLoggedIn = !!user;
    const [cartOpen,setCartOpen] = useState(false);
    const [lastAddedId,setLastAddedId] = useState(null);
    const navigate = useNavigate();


    const addToCart = async (itemId,size) => {
        if (!size) {
            toast.error('Select Product Size');
            return;
        }
        let cartData = structuredClone(cartItems);

        if (cartData[itemId]) {
            if (cartData[itemId][size]) {
                cartData[itemId][size] += 1;
            }
            else{
                cartData[itemId][size] = 1;
            }  
        }
        else{
            cartData[itemId] = {};
            cartData[itemId][size] = 1;
        }
        setCartItems(cartData);
        setLastAddedId(itemId);
        setCartOpen(true);

        if (isLoggedIn) {
            try {
                

                await axios.post(backendUrl + '/api/cart/add', {itemId,size})

            } catch (error) {
                console.log(error);
                toast.error(error.messasge)
                
            }
        }
    }

    const getCartCount = () => {
        let totalCount = 0;
        for(const items in cartItems){
            for(const item in cartItems[items]){
                try {
                    if (cartItems[items][item] > 0) {
                        totalCount += cartItems[items][item];
                    }
                } catch (error) {
                    
                }
            }
        }
        return totalCount;
    }

    const updateQuantity = async (itemId,size,quantity) => {
        let cartData = structuredClone(cartItems);

        cartData[itemId][size] = quantity;

        setCartItems(cartData);

        if (isLoggedIn) {
            try {
                
                await axios.post(backendUrl + '/api/cart/update', {itemId,size,quantity})

            } catch (error) {
                console.log(error);
                toast.error(error.messasge)
            }
        }

    }


    const getCartAmount = () => {
        let totalAmount = 0;
        for(const items in cartItems){
            let itemInfo = products.find((product)=> product._id === items);
            for(const item in cartItems[items]){
                try {
                    if (cartItems[items][item] > 0) {
                        totalAmount += itemInfo.price * cartItems[items][item]
                    }
                } catch (error) {
                    
                }
            }
        }
        return totalAmount;
    }

    const getProductsData = async () => {
        try {

            const response = await axios.get(backendUrl + '/api/product/list')
            if(response.data.success){
                setProducts(response.data.products)
            } else {
                toast.error(response.data.messasge)
            }
             
            
        } catch (error) {
            console.log(error);
            toast.error(error.messasge)
            
        }
    }
    const getUserCart = async () => {
        try {
            
            const response = await axios.post(backendUrl + '/api/cart/get',{})
            if(response.data.success){
                const cartData = structuredClone(response.data.cartData || {})

                // move anything added while signed out into the account cart
                const guestCart = readGuestCart()
                for (const itemId in guestCart) {
                    for (const size in guestCart[itemId]) {
                        const guestQuantity = guestCart[itemId][size]
                        if (guestQuantity > 0) {
                            const quantity = (cartData[itemId]?.[size] || 0) + guestQuantity
                            cartData[itemId] = { ...cartData[itemId], [size]: quantity }
                            await axios.post(backendUrl + '/api/cart/update', {itemId,size,quantity})
                        }
                    }
                }
                localStorage.removeItem(GUEST_CART_KEY)

                setCartItems(cartData)
            }
        } catch (error) {
            console.log(error);
            toast.error(error.messasge)
        }
    }

    useEffect(()=>{
        getProductsData()
    },[])

    // On load, ask the API whether this browser has a session (refresh cookie)
    useEffect(() => {
        // tokens used to be kept in localStorage; they are no longer used
        localStorage.removeItem('token')

        refreshSession().then((sessionUser) => {
            setUser(sessionUser)
            setAuthReady(true)
        })

        // the session ended mid-visit (expired or signed out elsewhere)
        setSignedOutHandler(() => {
            setUser(null)
            setCartItems({})
        })
    }, []);

    const logout = async () => {
        try {
            await axios.post(backendUrl + '/api/auth/logout')
        } catch (error) {
            console.log(error)
        }
        setUser(null)
        setCartItems({})
        navigate('/login')
    }

    // keep the guest cart in localStorage (signed-in carts are saved on the server)
    useEffect(() => {
        if (authReady && !isLoggedIn) {
            localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cartItems))
        }
    }, [cartItems, authReady, isLoggedIn]);

    // Fetch the account cart once someone is signed in
    useEffect(() => {
        if (isLoggedIn) {
            getUserCart();
        }
    }, [isLoggedIn]);


    const value = {
        products ,currency, delivery_fee, shippingRates,
        search,setSearch,showSearch,setShowSearch,
        cartItems,setCartItems,addToCart,
        getCartCount,updateQuantity,
        getCartAmount, navigate, backendUrl,
        user, setUser, isLoggedIn, authReady, logout,
        cartOpen,setCartOpen,lastAddedId
    }

    return (
        <ShopContext.Provider value={value}>
            {props.children}
        </ShopContext.Provider>
    )
    
}


export default ShopContextProvider
