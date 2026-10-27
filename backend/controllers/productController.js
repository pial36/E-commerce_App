import { v2 as cloudinary } from "cloudinary";
import productModel from "../models/productModel.js";
import { parseDiscountPercent } from "../utils/pricing.js";

// Every product photo is stored at 390x450 (width x height). Cloudinary
// resizes and crops on upload, keeping the most important part of the photo
// (gravity auto), so the shop grid and product page always line up.
const PRODUCT_IMAGE_SIZE = { width: 390, height: 450 }

const uploadProductImage = async (path) => {
    const result = await cloudinary.uploader.upload(path, {
        resource_type: 'image',
        transformation: [{ ...PRODUCT_IMAGE_SIZE, crop: 'fill', gravity: 'auto' }],
    })
    return result.secure_url
}

//Function for add product
const addProduct = async (req, res) => {
    try {
        
        const { name, description, price, category, subCategory, sizes, bestseller} = req.body;
        const discountPercent = parseDiscountPercent(req.body.discountPercent);

        const image1 = req.files.image1 && req.files.image1[0];
        const image2 = req.files.image2 && req.files.image2[0];
        const image3 = req.files.image3 && req.files.image3[0];
        const image4 = req.files.image4 && req.files.image4[0];

        const images = [image1,image2,image3,image4].filter((item) => item !== undefined);

        let imagesUrl = await Promise.all(
            images.map(async (item) => {
                return uploadProductImage(item.path);
            })
        );


        const productData = {
            name,
            description,
            category,
            price: Number(price),
            discountPercent,
            subCategory,
            bestseller: bestseller === "true" ? true : false,
            sizes: JSON.parse(sizes),
            image:imagesUrl,
            date: Date.now(),
        }

        console.log(productData);

        const product = new productModel(productData);
        await product.save()
        

        res.json({ success: true, message: "Product Added"})

        
    } catch (error) {
        res.json({success:false,message:error.message})
    }
}

//function for List product
const listProducts = async (req, res) => {
    try {
        
        const products = await productModel.find({});
        res.json({success:true,products})

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
        
    }
}

//fuction for removing product
const removeProduct = async (req, res) => {

    try {
        await productModel.findByIdAndDelete(req.body.id)
        res.json({success:true, message: "Product Removed"})
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

//function for editing a product
// Text fields are optional: only the ones sent are changed. A file in
// image1..image4 replaces the image in that slot; other slots keep theirs.
const updateProduct = async (req, res) => {
    try {

        const { id, name, description, price, category, subCategory, sizes, bestseller } = req.body

        const product = await productModel.findById(id)
        if (!product) {
            return res.json({ success: false, message: "Product not found" })
        }

        if (name !== undefined) product.name = name
        if (description !== undefined) product.description = description
        if (price !== undefined) product.price = Number(price)
        if (req.body.discountPercent !== undefined) product.discountPercent = parseDiscountPercent(req.body.discountPercent)
        if (category !== undefined) product.category = category
        if (subCategory !== undefined) product.subCategory = subCategory
        if (sizes !== undefined) product.sizes = JSON.parse(sizes)
        if (bestseller !== undefined) product.bestseller = bestseller === "true"

        const images = [...product.image]
        const slots = ['image1', 'image2', 'image3', 'image4']
        await Promise.all(slots.map(async (slot, index) => {
            const file = req.files?.[slot]?.[0]
            if (file) {
                images[index] = await uploadProductImage(file.path)
            }
        }))
        product.image = images.filter(Boolean)

        await product.save()

        res.json({ success: true, message: "Product Updated", product })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

//fuction for single product
const singleProduct = async (req, res) => {
    try {
        
        const { productId } = req.body
        const product = await productModel.findById(productId)
        res.json({success:true,product})

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export { listProducts, addProduct, removeProduct, singleProduct, updateProduct };
