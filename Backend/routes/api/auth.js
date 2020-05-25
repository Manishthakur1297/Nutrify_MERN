const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
const config = require('config')

const auth = require('../../middleware/auth')
const User = require('../../models/User')


// @route       POST api/register
// @desc        Register USER
// @access      Public
router.post('/register', [
    
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

        await user.save()

        const payload = {
            user: {
                id: user.id
            }
        }

        jwt.sign(
            payload,
            config.get('jwtSecret'),
            { expiresIn : 360000 },
            (err, token) => {
                if (err) throw err;
                return res.json({ token });
            });

    } catch (error) {
        return res.status(500).send("Server Error");
    }
})



// @route       POST api/login
// @desc        Login User
// @access      Public
router.post('/login', [
    
    check('email', 'Please Enter Valid Email ID').isEmail(),

    check('password', "Please Enter a Password with 1 or more cahracters").exists()

] , async (req, res) => {

    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() })
    }

    const { email, password } = req.body;

    try {

        let user = await User.findOne({ email });

        if (!user){
            return res.status(400)
            .json({ errors: [{"msg" : "Invalid Credentials"}] });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch){
            return res.status(400)
            .json({ errors: [{"msg" : "Invalid Credentials"}] });
        }

        const payload = {
            user: {
                id: user.id
            }
        }

        jwt.sign(
            payload,
            config.get('jwtSecret'),
            { expiresIn : 360000 },
            (err, token) => {
                if (err) throw err;
                return res.json({ token });
            });

    } catch (error) {
        return res.status(500).send("Server Error");
    }
})


module.exports = router;