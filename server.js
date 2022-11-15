const dotenv = require('dotenv');
const mongoose = require('mongoose');

process.on("uncaughtException", (err) => {
    //in case of uncaught exceptions
    console.log(err.name, err.message);
    process.exit(1);

});
dotenv.config({
    path: './config.env',
});
console.log("Connecting to DB");
const DB = process.env.DATABASE.replace('<PASSWdORD>', process.env.DATABASE_PASSWORD);
console.log("DB connection Link:", DB);
mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: true,
    useUnifiedTopology: true

}).then(() => {
    // console.log(connection.connections);
    console.log('successful connection');
}).catch(err => {
    console.log('DB connection error:', err.message)
});

// const testTour = new Tour({
//     name: 'toouur',
//     rating: 4.8,
//     price: 330
// });
// testTour.save().then(doc => {
//     console.log(doc);
// }).catch(err => {
//     console.log('error', err);
// });
// console.log(testTour);

//app must be last
const app = require('./app');

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log('listening');
});

process.on("unhandledRejection", (err) => {
    console.log(err.name, err.message);
    //server.close gracefully ends execution by handling open requests first
    server.close(() => {
        process.exit(1);
    });
});