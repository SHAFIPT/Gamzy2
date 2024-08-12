const mongoose = require('mongoose');

const Schema = mongoose.Schema;
    
const wishlistSchema = new Schema({
    products: [
        {
            product: { type: Schema.Types.ObjectId, ref: 'Product' },
            variant: { type: Schema.Types.ObjectId } // Directly refer to ObjectId, we'll handle the variant population separately
        }
    ],
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
});

module.exports = mongoose.model("Wishlist",wishlistSchema)