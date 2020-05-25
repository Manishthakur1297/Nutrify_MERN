const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
const config = require('config')

const auth =  require('../../middleware/auth')

const User = require('../../models/User')
const Meal = require('../../models/Meal')

const formatDate = require('../../utils/format_date')


// @route       POST api/meals
// @desc        ADD Meal
// @access      Private
router.post('/', 
[
    auth, 
    check('food_name', "Food Name is Required").not().isEmpty(),
    check('calorie', "Calorie is Required").not().isEmpty()
] ,
async (req, res) => {

    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({ errors : errors.array() });
    }

    try {
        
        const user = await User.findById(req.user.id).select('-password');

        // const dateFormat = (date) => 
        // {
        //     return date.getDate()+""+parseInt(date.getMonth()+1)+""+date.getFullYear()
        // }
        const newMeal = new Meal({
            food_name: req.body.food_name,
            calorie: req.body.calorie,
            user: req.user.id,
            description: req.body.description,
            max_calorie: user.max_calorie,
            is_super_user: user.is_super_user,
            day: formatDate(new Date)
        })

        const meal = await newMeal.save();

        return res.json(meal)
        
    } catch (error) {
        console.log(error.message)
        res.status(500).send("Server Error!!")
        
    }
})


// @route       GET api/meals
// @desc        GET ALL Meals
// @access      Private
router.get('/', auth, async (req, res) => {
    try {
        
        const user = await User.findById(req.user.id).select('-password');

        if(user.is_super_user){
            const meals = await Meal.find().sort({ date: -1 })
            return res.json(meals)
        }

        const meals = await Meal.find({user:req.user.id}).sort({ date: -1 })
        return res.json(meals)

    } catch (error) {
        console.log(error.message)
        res.status(500).send("Server Error!!")
    }
})



// @route       GET api/meals/:id
// @desc        GET Meal By ID
// @access      Private
router.get('/:id', auth, async (req, res) => {
    try {
        
        const meal = await Meal.findById(req.params.id);

        //Check Valid User

        if(!meal){
            return res.status(404).json({"msg" : "Meal Not Found!!!"})
        }

        const user = await User.findById(req.user.id).select('-password');

        if(user.is_super_user){
            return res.json(meal)
        }

        if(meal.user.toString() !== req.user.id){
            return res.status(404).json({"msg" : "User Not Authorised!!!"})
        }

        return res.json(meal)

    } catch (error) {

        if(error.kind === 'ObjectId'){
            return res.status(404).json({"msg" : "Meal Not Found!!!"})
        }
        console.log(error.message)
        res.status(500).send("Server Error!!")
    }
})


// @route       DELETE api/meals/:id
// @desc        Delete Meal By ID
// @access      Private
router.delete('/:id', auth, async (req, res) => {
    try {
        
        const meal = await Meal.findById(req.params.id);

        //Check Valid User

        if(!meal){
            return res.status(404).json({"msg" : "Meal Not Found!!!"})
        }

        const user = await User.findById(req.user.id).select('-password');

        if(user.is_super_user){
            await meal.remove();
            return res.json({"msg": "Meal Removed!!!"})
        }

        if(meal.user.toString() !== req.user.id){
            return res.status(404).json({"msg" : "User Not Authorised!!!"})
        }

        await meal.remove();

        return res.json({"msg": "Meal Removed!!!"})

    } catch (error) {

        if(error.kind === 'ObjectId'){
            return res.status(404).json({"msg" : "Meal Not Found!!!"})
        }
        console.log(error.message)
        res.status(500).send("Server Error!!")
    }
})




// @route       PUT api/meals
// @desc        Update Meal
// @access      Private

router.put('/:id', 
[
    auth, 
    check('food_name', "Food Name is Required").not().isEmpty(),
    check('calorie', "Calorie is Required").not().isEmpty()
] ,
async (req, res) => {

    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({ errors : errors.array() });
    }

    try {

        const meal = await Meal.findById(req.params.id);

        if(!meal){
            return res.status(404).json({"msg" : "Meal Not Found!!!"})
        }

        const user = await User.findById(req.user.id).select('-password');

        const {food_name, calorie, description} = req.body

        const mealFields = {}
        
        if(food_name) mealFields.food_name=food_name
        if(description) mealFields.description = description
        if(calorie) mealFields.calorie = calorie

        if(!user.is_super_user)
        {
            if(req.user.id!==meal.user.toString())
            {
                return res.status(404).json({"msg" : "User Not Authorised!!!"})
            }
            mealFields.max_calorie = user.max_calorie
        }

        const updateMeal = await Meal.findOneAndUpdate(
                {_id:req.params.id},
                {$set: mealFields},
                {new: true}
            );
        
            return res.json(updateMeal)

    } catch (error) {
        console.log(error.message)
        res.status(500).send("Server Error!!")
        
    }
})


module.exports = router;