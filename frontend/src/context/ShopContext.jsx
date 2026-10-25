import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from 'axios'

export const ShopContext = createContext();

 export const ShopContextProvider = (props) => {

    const currency ='৳';
    const delivery_fee = 10;
    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const [search,setSearch] = useState('');
    const [showSearch,setShowSearch] = useState(false);
    const [cartItems,setCartItems] = useState({});
    const [products,setProducts] = useState([]);
    const [token,setToken] = useState('');
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

        if (token) {
            try {
                

                await axios.post(backendUrl + '/api/cart/add', {itemId,size}, {headers:{token}})

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

        if (token) {
            try {
                
                await axios.post(backendUrl + '/api/cart/update', {itemId,size,quantity}, {headers:{token}})

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
    const getUserCart = async ( token ) => {
        try {
            
            const response = await axios.post(backendUrl + '/api/cart/get',{},{headers:{token}})
            if(response.data.success){
                setCartItems(response.data.cartData)
                
            }
        } catch (error) {
            console.log(error);
            toast.error(error.messasge)
        }
    }

    useEffect(()=>{
        getProductsData()
    },[])

    useEffect(() => {
        const storedToken = localStorage.getItem('token'); // Store token once from localStorage
        if (!token && storedToken) {
            setToken(storedToken);  // Set token state
        }
    }, []);  // This effect runs only once on component mount
    
    // Fetch cart data whenever the token changes
    useEffect(() => {
        if (token) {
            getUserCart(token);  // Fetch user cart when token is set
        }
    }, [token]);  // This effect runs whenever the token state changes
    

    const value = {
        products ,currency, delivery_fee,
        search,setSearch,showSearch,setShowSearch,
        cartItems,setCartItems,addToCart,
        getCartCount,updateQuantity,
        getCartAmount, navigate, backendUrl,
        setToken,token,
        cartOpen,setCartOpen,lastAddedId
    }

    return (
        <ShopContext.Provider value={value}>
            {props.children}
        </ShopContext.Provider>
    )
    
}


export default ShopContextProvider
