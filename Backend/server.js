const express = require('express')
const connectDB = require('./config/db')

const app = express();

//Connect Database
connectDB();

//INIT Middleware
app.use(express.json({ extended: false }))

// Define Routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api', require('./routes/api/auth'));
app.use('/api/meals', require('./routes/api/meals'));

app.get('/', (req, res) => {
    res.send("API Running!")
})

const PORT = process.env.PORT || 5000;

app.listen(PORT, ()=> console.log(`Server is running on ${PORT}`));
