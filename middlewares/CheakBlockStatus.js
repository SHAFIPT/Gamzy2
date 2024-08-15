const User = require('../model/UserModel');

const checkBlockedStatus = async (req, res, next) => {
    if (req.session.user) {
        const user = await User.findById(req.session.user);
        if (user && user.is_blocked) {
            req.session.destroy((err) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to log out' });
                }
                return res.redirect('/');
            });
        } else {
            next();
        }
    } else {
        next();
    }
};

module.exports = checkBlockedStatus;
