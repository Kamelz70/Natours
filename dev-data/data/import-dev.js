const dotenv = require('dotenv');
const fs = require('fs');
const mongoose = require('mongoose');
const Review = require('../../models/reviewModel');
const Tour = require("../../models/tourModel");
const User = require('../../models/userModel');

dotenv.config({
    path: './config.env',
});

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: true,
    useUnifiedTopology: true

}).then(() => {
    // console.log(connection.connections);
    console.log('successful connection');
});

const importData = async () => {
    try {

        const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
        const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
        const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));
        await Tour.create(tours);
        await User.create(users);
        await Review.create(reviews);
        console.log('import successful');

        process.exit();
    } catch (error) {
        console.log(error);
    }
}


const deleteData = async () => {
    try {

        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log('deletion successful');
        process.exit();

    } catch (error) {
        console.log(error);
    }
}

if (process.argv[2] === '--import') {
    importData();
} else if (process.argv[2] === '--delete') {
    deleteData();
} else {
    console.log("Please choose --import or --delete");
}