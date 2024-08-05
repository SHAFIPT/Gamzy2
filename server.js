const express = require('express');
const app = express();
const path = require('path');
const userRoute = require('./routers/userRoute');
const connectDB = require('./config/database');
const dotenv = require('dotenv').config();
const adminRoute = require('./routers/adminRoute')
const passport=require('./passport') 

 
connectDB();
// Set up EJS view engine 
app.set('view engine', 'ejs'); 
 
app.set('views', path.join(__dirname, 'view', 'user'));
      
                        
// Middleware for parsing JSON and urlencoded data  
app.use(express.json());    
app.use(express.urlencoded({ extended: true }));       
                         
// Serve static files from the 'public' directory
app.use('/static', express.static(path.join(__dirname, 'public', 'uploads'))); 
app.use(express.static('public'));    
                       
// Use the user Route router for handling route s 
app.get('/', (req,res)=>{res.redirect('/user')});  
     
// app.get('/GoogleAuth',    
//     passport.authenticate('google',{   
//         failureRedirect : '/failure'
//     }  
// ));         
       
   
app.use('/user',userRoute)     
                  
//admin Route                        
                              
app.use('/admin',adminRoute);             
                           
// Start the server                 
const PORT = process.env.PORT;    
app.listen(PORT, () => { 
    console.log(`Server is running on http://localhost:${PORT}`); 
});                   
                                                                               