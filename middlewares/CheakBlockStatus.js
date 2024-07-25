const User = require('../model/UserModel');

const checkBlockedStatus = async(req,res,next) =>{
    if(req.session.userId){
        const user = await User.findById(req.session.userData._id);
        if(user && user.is_blocked){
            req.session.destroy((err)=>{
                if(err){
                    return res.status(500).json({error : 'failed to log out'});
                }
                return res.status(40).json({ error : 'Your account has been blocked'})
            });
        }else{
            next()
        }
    }else{
        next()
    }
};

module.exports = checkBlockedStatus;