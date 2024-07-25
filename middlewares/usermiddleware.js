const isLogout = async(req,res,next)=>{

    try {
        
        if (req.session.userId) {
            res.redirect('/');
        } else {
            next()
        }
      

    } catch (error) {
        console.log(error.messege);
    }

}
const isLogin=async(req,res,next)=>{
    try{
        if(!req.session.user){
            res.redirect('/user/login')
        }else{
            next()
        }
    }catch(err){
        console.error((err))
    }
}

module.exports = {
    isLogout,
    isLogin
}