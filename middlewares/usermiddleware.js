const isLogout = async (req, res, next) => {
    try {
        if (req.session.user) {
            // Already logged in, redirect to homepage
            return res.redirect('/');
        }
        next();
    } catch (error) {
        console.log(error.message);
        res.redirect('/user/login');
    }
};
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