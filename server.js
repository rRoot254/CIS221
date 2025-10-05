// server.js
const express = require('express');
const mongoose = require('mongoose');
const Product = require('./models/Product');

const app = express();
const PORT = 3000;

app.use(express.json());

const DB_URI = 'mongodb://localhost:27017/fashionStoreDB'; 

mongoose.connect(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected successfully!'))
    .catch(err => console.error('DB Connection Error:', err));


app.get('/api/store/metrics', async (req, res) => {
    try {
        const metrics = await Product.aggregate([
            {
                $group: {
                    _id: null,
                    totalPiecesSold: { $sum: '$pieces_sold' },
                    totalCurrentStock: { $sum: '$current_stock' },
                    totalSalesValue: { $sum: '$total_sales_value' }
                }
            }
        ]);

        if (metrics.length === 0) {
            return res.json({ message: 'No inventory data available.' });
        }

        res.json(metrics[0]);
    } catch (err) {
        res.status(500).send('Server Error retrieving metrics');
    }
});

app.post('/api/products/purchase/:productId', async (req, res) => {
    const { quantity } = req.body;
    const purchaseQuantity = parseInt(quantity);
    
    if (!purchaseQuantity || purchaseQuantity <= 0) {
        return res.status(400).send('Invalid quantity for purchase.');
    }

    try {
        const product = await Product.findById(req.params.productId);

        if (!product) {
            return res.status(404).send('Product not found.');
        }

        if (product.current_stock < purchaseQuantity) {
            return res.status(400).send('Not enough stock for this purchase.');
        }
        
        product.pieces_sold += purchaseQuantity;
        product.current_stock -= purchaseQuantity;
        
        const salesAmount = purchaseQuantity * product.price;
        product.total_sales_value += salesAmount;

        await product.save();
        
        res.json({ 
            message: `${purchaseQuantity} of ${product.name} sold successfully!`, 
            new_stock: product.current_stock,
            money_made: salesAmount 
        });

    } catch (err) {
        res.status(500).send('Server Error during purchase');
    }
});


async function setupInitialInventory() {
    const count = await Product.countDocuments();
    if (count === 0) {
        console.log("Setting up initial inventory...");
        await Product.create([
            { name: "Stylish Shoes", initial_stock: 50, current_stock: 50, price: 99.99, pieces_sold: 0, total_sales_value: 0 },
            { name: "Elegant Dress", initial_stock: 35, current_stock: 35, price: 149.99, pieces_sold: 0, total_sales_value: 0 },
            { name: "Modern Accessories", initial_stock: 100, current_stock: 100, price: 29.99, pieces_sold: 0, total_sales_value: 0 }
        ]);
        console.log("Initial inventory created.");
    }
}
setupInitialInventory();

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
