const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const User =  require('./model/UserModel')
require('dotenv').config(); // Ensure this line is included to load environment variables

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://gamzy.shop/user/GoogleAuth", // Ensure this URL matches your route
    passReqToCallback: true
}, async (request, accessToken, refreshToken, profile, done) =>{
    try {
        console.log('This is passport');
        let user = await User.findOne({email : profile.emails[0].value})
        if(user){

            if(user.is_blocked){
                return done(null , false, {messege : 'user is blocked...!'})
            }else{
                user.name = profile.displayName;
                await user.save();
            }
        }else{
            user = new User({
                name : profile.displayName,
                email : profile.emails[0].value,
                is_blocked:false
            })
            await user.save();
            console.log(user);
        }
        return done(null,user)
    } catch (error) {
        return done(error,null)
    }
}
));



module.exports = passport;