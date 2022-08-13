const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));


// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

function list(req, res) {
    res.json({ data: orders })
}

function bodyDataHas(propertyName) {
    return function (req, res, next) {
        const { data = {} } = req.body
        if (data[propertyName]) {
            return next()
        }
        next({
            status: 400,
            message: `Order must include a 
                ${propertyName === "dishes" ? "dish" : propertyName}` 
            
        })
    }
}

function dishesPropertyIsValid(req, res, next) {
    const {data: { dishes } = {} } = req.body
    if (Array.isArray(dishes) && dishes.length > 0) {
        return next()
    }
    next({
        status: 400,
        message: "Order must include at least one dish"
    })
}

function dishQuantityIsValid(req, res, next) {
    const {data: { dishes } = {} } = req.body
    const index = dishes.findIndex((dish) => dish.quantity <= 0 || !Number.isInteger(dish.quantity))
    if (index > -1) {
        next({
            status: 400,
            message: `Dish ${index} must have a quantity that is an integer greater than 0`
        })
    }
    return next()
}

function create(req, res) {
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body
    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        status,
        dishes,
    }
    orders.push(newOrder)
    res.status(201).json({ data: newOrder })
}

function orderExists(req, res, next) {
    const { orderId } = req.params
    const foundOrder = orders.find((order) => order.id === orderId)
    if (foundOrder) {
        res.locals.order = foundOrder
        return next()
    }
    next({
        status: 404,
        message: `Order id not found: ${orderId}`
    })
}

function read(req, res) {
    res.json({ data: res.locals.order })
}

function idMatch(req, res, next) {
    const { orderId } = req.params
    const { data: { id } = {} } = req.body
    if (id === orderId || !id) {
        return next()
    }
    next({
        status: 400,
        message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`
    })
}

function validateStatusProperty(req, res, next) {
    const { data: { status } = {} } = req.body
    const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"]
    if (validStatus.includes(status)) {
        return next()
    }
    next({
        status: 400,
        message: "Order must have a status of pending, preparing, out-for-delivery, delivered"
    })
}

function checkForDelivered(req, res, next) {
    const { data: { status } = {} } = req.body
    if (status === "delivered") {
        next({
            status: 400,
            message: "A delivered order cannot be changed"
        })
    }
    return next()
}

function update(req, res) {
    const order = res.locals.order
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body

    order.deliverTo = deliverTo
    order.mobileNumber = mobileNumber
    order.status = status
    order.dishes = dishes

    res.json({ data: order })
}

function isStatusPending(req, res, next) {
    const status = res.locals.order.status
    if (status !== "pending") {
        next({
            status: 400,
            message: "An order cannot be deleted unless it is pending"
        })
    }
    return next()
}

function destroy(req, res, next) {
    const { orderId } = req.params
    const index = orders.findIndex((order) => order.id === orderId)
    const deletedOrders = orders.splice(index, 1)
    res.sendStatus(204)
}

module.exports = {
    list,
    create: [
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        dishesPropertyIsValid,
        dishQuantityIsValid,
        create,
    ],
    read: [
        orderExists,
        read,
    ],
    update: [
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("status"),
        bodyDataHas("dishes"),
        dishesPropertyIsValid,
        dishQuantityIsValid,
        orderExists,
        idMatch,
        validateStatusProperty,
        checkForDelivered,
        update,
    ],
    delete: [
        orderExists,
        isStatusPending,
        destroy,
    ]
}