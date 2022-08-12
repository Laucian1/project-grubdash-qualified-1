const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));


// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

function list(req, res) {
    const { dishId } = req.params
    res.json({ data: orders
        .filter(
            dishId ? order => order.dishes.id == dishId 
            : () => true
        ) 
    })
}
