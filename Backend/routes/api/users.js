const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
const config = require('config')

const User = require('../../models/User');
const auth = require('../../middleware/auth')



// @route       GET api/users
// @desc        User Profile
// @access      Private
router.get('/me', auth, async (req, res) => {
    try {
        
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).send("Server Error!!!");
    }
})


// @route       POST api/users
// @desc        Create New User (Admin Only)
// @access      Private
router.post('/', [auth,
    
    check('name', "Name is Required")
    .not()
    .isEmpty(),
    
    check('email', 'Please Enter Valid Email ID')
    .isEmail(),

    check('password', "Please Enter a Password with 1 or more cahracters")
    .isLength({ min : 1 })

] , async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() })
    }

    const { name, email, password } = req.body;

    try {

        let admin = await User.findById(req.user.id);
        if (!admin.is_super_user)
        {
            return res.status(400).json({"msg" : "User Not Authorised!!!"})
        }

        let user = await User.findOne({ email });

        if (user){
            return res.status(400).json({ errors: [{"msg" : "User already exists!"}] });
        }

        user = new User({
            name,
            email,
            password
        });

        const salt = await bcrypt.genSalt(10);

        user.password = await bcrypt.hash(password, salt);

        let response = await user.save()

        return res.json(response)

    } catch (error) {
        return res.status(500).send("Server Error");
    }
})





// @route       GET api/users
// @desc        GET ALL Users(Admin Only)
// @access      Private
router.get('/', auth, async (req, res) => {
    try {
        
        const user = await User.findById(req.user.id).select('-password');

        if(user.is_super_user){
            const users = await User.find().sort({ date: -1 })
            return res.json(users)
        }

        return res.status(400).json({"msg":"User Not Authorised!!!"})

    } catch (error) {
        console.log(error.message)
        res.status(500).send("Server Error!!")
    }
})



// @route       GET api/users/:id
// @desc        GET USER By ID (Admin Only)
// @access      Private
router.get('/:id', auth, async (req, res) => {
    try {

        const user = await User.findById(req.params.id).select('-password');

        const admin = await User.findById(req.user.id).select('-password');


        if(!user){
            return res.status(404).json({"msg" : "User Not Found!!!"})
        }

        if(admin.is_super_user){
            return res.json(user)
        }

        if(req.params.id === req.user.id){
            return res.json(user)
        }

        
        return res.status(404).json({"msg" : "User Not Authorised!!!"})
        
    } catch (error) {

        if(error.kind === 'ObjectId'){
            return res.status(404).json({"msg" : "User Not Found!!!"})
        }
        console.log(error.message)
        res.status(500).send("Server Error!!")
    }
})




// @route       DELETE api/users/:id
// @desc        Delete User By ID(Admin All, Individual One)
// @access      Private
router.delete('/:id', auth, async (req, res) => {
    try {
        
        const user = await User.findById(req.params.id).select('-password');

        //Check Valid User

        if(!user){
            return res.status(404).json({"msg" : "User Not Found!!!"})
        }

        const admin = await User.findById(req.user.id).select('-password');

        if(admin.is_super_user){
            await user.remove();
            return res.json({"msg": "User Deleted Successfully!!!"})
        }

        if(req.params.id === req.user.id){
            await user.remove();
            return res.json({"msg": "User Deleted Successfully!!!"})
        }

        return res.status(404).json({"msg" : "User Not Authorised!!!"})

    } catch (error) {

        if(error.kind === 'ObjectId'){
            return res.status(404).json({"msg" : "Meal Not Found!!!"})
        }
        console.log(error.message)
        res.status(500).send("Server Error!!")
    }
})




// @route       PUT api/users
// @desc        Update User
// @access      Private

router.put('/:id', [auth,
    
    check('name', "Name is Required")
    .not()
    .isEmpty(),
    
    // check('email', 'Please Enter Valid Email ID')
    // .isEmail(),

    // check('password', "Please Enter a Password with 1 or more cahracters")
    // .isLength({ min : 1 }),

    check('max_calorie', "Max Calorie is Required")
    .not()
    .isEmpty(),

] , async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() })
    }

    try {

        const user = await User.findById(req.params.id).select('-password');

        if(!user){
            return res.status(404).json({"msg" : "User Not Found!!!"})
        }

        const admin = await User.findById(req.user.id).select('-password');

        const { name, max_calorie } = req.body;

        const userFields = {}
        
        if(name) userFields.name=name
        if(max_calorie) userFields.max_calorie = max_calorie

        if(!admin.is_super_user)
        {
            if(req.user.id!==req.params.id)
            {
                return res.status(404).json({"msg" : "User Not Authorised!!!"})
            }
        }

        const updateUser = await User.findOneAndUpdate(
                {_id:req.params.id},
                {$set: userFields},
                {new: true}
            );
        
            return res.json(updateUser)

    } catch (error) {
        console.log(error.message)
        res.status(500).send("Server Error!!")
        
    }
})


module.exports = router;
