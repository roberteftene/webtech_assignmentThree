const express = require('express')
const bodyParser = require('body-parser')
const Sequelize = require('sequelize')

const mysql = require('mysql2/promise')

const DB_USERNAME = 'root'
const DB_PASSWORD = 'pass'

let conn

mysql.createConnection({
        user: DB_USERNAME,
        password: DB_PASSWORD
    })
    .then((connection) => {
        conn = connection
        return connection.query('CREATE DATABASE IF NOT EXISTS tw_homework')
    })
    .then(() => {
        return conn.end()
    })
    .catch((err) => {
        console.warn(err.stack)
    })

const sequelize = new Sequelize('tw_homework', DB_USERNAME, DB_PASSWORD, {
    dialect: 'mysql',
    logging: false
})

let FoodItem = sequelize.define('foodItem', {
    name: Sequelize.STRING,
    category: {
        type: Sequelize.STRING,
        validate: {
            len: [3, 10]
        },
        allowNull: false
    },
    calories: Sequelize.INTEGER
}, {
    timestamps: false
})


const app = express()
app.use(bodyParser.json());

app.get('/create', async (req, res) => {
    try {
        await sequelize.sync({
            force: true
        })
        for (let i = 0; i < 10; i++) {
            let foodItem = new FoodItem({
                name: 'name ' + i,
                category: ['MEAT', 'DAIRY', 'VEGETABLE'][Math.floor(Math.random() * 3)],
                calories: 30 + i
            })
            await foodItem.save()
        }
        res.status(201).json({
            message: 'created'
        })
    } catch (err) {
        console.warn(err.stack)
        res.status(500).json({
            message: 'server error'
        })
    }
})

app.get('/food-items', async (req, res) => {
    try {
        let foodItems = await FoodItem.findAll()
        res.status(200).json(foodItems)
    } catch (err) {
        console.warn(err.stack)
        res.status(500).json({
            message: 'server error'
        })
    }
})

app.post('/food-items', async (req, res) => {
    try {

        if (Object.keys(req.body).length === 0) {
            return res.status(400).send({
                "message": "body is missing"
            })
        }

        if (!(req.body.hasOwnProperty('name') && req.body.hasOwnProperty('category') && req.body.hasOwnProperty('calories'))) {
            return res.status(400).send({
                "message": "malformed request"
            })
        }
        if (parseInt(req.body.calories) < 0) {
            return res.status(400).send({
                "message": "calories should be a positive number"
            })
        }

        if (req.body.category.length < 3 || req.body.category.length > 10) {
            return res.status(400).send({
                "message": 'not a valid category'
            })
        }
        await FoodItem.create(req.body);
        res.status(201).send({
            "message": "created"
        });

    } catch (err) {
        res.status(500).json({
            message: 'server error'
        })
    }
})

module.exports = app