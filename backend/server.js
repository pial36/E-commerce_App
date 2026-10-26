import 'dotenv/config'
import app from './app.js'
import connectDB from './config/mongobdb.js'
import connectCloudinay from './config/cloudinary.js'


//App Config
const port = process.env.PORT ||4000
connectDB()
connectCloudinay()

app.listen(port, ()=> console.log('Servers started on PORT : '+port))
