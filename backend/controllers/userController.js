import validator from "validator"
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken'
import userModel from "../models/userModel.js"


const creatrToken = (id) => {
    return jwt.sign({ id },process.env.JWT_SECRET)
}

// Route for User login
const loginUser = async (req,res) => {
    try {
        const {email,password} = req.body;

        const user = await userModel.findOne({email});

        if (!user) {
            return res.json({success:false, message:"User doesn't exits"})
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            
            const token = creatrToken(user._id)
            res.json({success:true,token})
        }
        else{
            res.json({success:false, message: 'Invalid credential'})
        }

    } catch (error) {
        console.log(error);
        res.json({success:false,massage:error.massage})
    }
   

}

// Route for Register user
const registerUser = async (req,res) => {

    try {
        const { name, email, password } = req.body

        //checking user already exists or not
        const exists = await userModel.findOne({email});
        if (exists) {
            return res.json({success:false, message:"User already exits"})
        }
        
        //validating email format & strong Password
        if (!validator.isEmail(email)) {
            return res.json({success:false, message:"Please enter Valid email"})
        }
         // Define password pattern (at least 1 uppercase, 1 lowercase, 1 number, 1 special character, min 8 characters)
         const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

         // Validate password strength
         if (!passwordPattern.test(password)) {
             return res.json({
                 success: false,
                 message:
                     "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character",
             });
         }
        // Hasing user password
        const salt = await bcrypt.genSalt(10)
        const hashesPassword = await bcrypt.hash(password,salt)

        const newUser = new userModel({
            name,
            email, 
            password:hashesPassword
        })
        
        const user = await newUser.save()

        const token = creatrToken(user._id)
        res.json({success:true,token})


    } catch (error) {
        console.log(error);
        res.json({success:false,massage:error.massage})
    }
    
}

// Route for admin login
const adminLogin = async (req,res) => {

   try {
    
    const {email,password} = req.body

    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign(email+password,process.env.JWT_SECRET);
        res.json({success:true,token})
    }else{
        res.json({success:false,message:"Invalid credentials"})
    }


   } catch (error) {
        console.log(error);
        res.json({success:false,massage:error.massage})
   }

}

export { loginUser,registerUser,adminLogin }