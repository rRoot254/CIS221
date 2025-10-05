const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    initial_stock: {
        type: Number,
        default: 0
    },
    pieces_sold: {
        type: Number,
        default: 0
    },
    current_stock: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: true
    },
    total_sales_value: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('Product', ProductSchema);
