const mongoose = require('mongoose');

const MealSchema =  new mongoose.Schema({
    user: {
		type: mongoose.Schema.Types.ObjectId, 
		ref: 'user'
	},
    food_name: {
        type: String,
        required:true
    },
    calorie: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        default: ""   
    },
    max_calorie: {
        type: Number
    },
    date: {
        type: Date,
        default: Date.now
    },
    day: {
        type:String
    },
    is_super_user: {
        type: Boolean
    }
})

module.exports = Meal = mongoose.model('meal', MealSchema);
