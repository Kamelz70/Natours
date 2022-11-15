// const fs = require('fs');
const path = require('path');
const morgan = require('morgan');
const express = require('express');
// const helmet = require('helmet');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
// const cors = require('cors');
const xss = require('xss-clean');
//multer used for multipart form
const cookieParser = require('cookie-parser');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const toursRouter = require('./routers/toursRouter');
const usersRouter = require('./routers/usersRouter');
const reviewsRouter = require('./routers/reviewsRouter');
const bookingsRouter = require('./routers/bookingsRouter');
const viewsRouter = require('./routers/viewsRouter');
const AppError = require('./utils/appError');
const GlobalErrorHandler = require('./controllers/errorController');

const app = express();
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"))
// enable access to public folder
app.use(express.static(path.join(__dirname, "public")));
// app.use(cors);
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
    res.setHeader('Access-Control-Allow-Methods', 'Content-Type', 'Authorization');
    next();
})
app.use(compression());
///////////////////////////    Global MiddleWare

//Set security http headers
// const scriptSrcUrls = [
//     'https://api.tiles.mapbox.com/',
//     'https://api.mapbox.com/',
// ];
// const styleSrcUrls = [
//     'https://api.mapbox.com/',
//     'https://api.tiles.mapbox.com/',
//     'https://fonts.googleapis.com/',
// ];
// const connectSrcUrls = [
//     'https://api.mapbox.com/',
//     'https://a.tiles.mapbox.com/',
//     'https://b.tiles.mapbox.com/',
//     'https://events.mapbox.com/',
// ];
// app.use(
//     helmet.contentSecurityPolicy({
//         directives: {
//             defaultSrc: [],
//             connectSrc: ["'self'", ...connectSrcUrls],
//             scriptSrc: ["'self'", ...scriptSrcUrls],
//             styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
//             workerSrc: ["'self'", 'blob:'],
//             objectSrc: [],
//             imgSrc: ["'self'", 'blob:', 'data:'],
//         },
//     })
// );
//prevent parameter pollution (multiple parameters ex: ?sort=duration&sort=price)
app.use(hpp({
    whitelist: [
        "duration",
        "ratingsAverage",
        "ratingsQuantity",
        "maxGroupSize",
        "difficulty",
        "price"
    ]
}));

// sanitize against NoSQL query injections
app.use(mongoSanitize());
// prevents cross site scripting
app.use(xss());
//limit requests
const rateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, //one hour window
    max: 100, //100 reqs
    message: "Too many requests, wait one hour before using again"
})
app.use(rateLimiter);
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));

}
//parse req to read req.body
app.use(express.json({
    //limit req body
    limit: "10kb"
}));
app.use(cookieParser());
//parse url forms from url into body
app.use(express.urlencoded({
    extended: true,
    limit: '10kb',
}));

//serving static files
app.use((req, res, next) => {
    res.requestTime = new Date().toISOString();
    // console.log(req.cookies);
    next();
});


/////////////////////////////////// Route Handlers

///////////////////////////////////////////////////// routes
// app.get('/api/v1/tours', getAllTours);
// app.post('/api/v1/tours', postTour)
// app.get('/api/v1/tours/:id', getTourById)
// app.patch('/api/v1/tours/:id', patchTour);
// app.delete('/api/v1/tours/:id', deleteTour)

app.use('/api/v1/tours', toursRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/reviews', reviewsRouter);
app.use('/api/v1/bookings', bookingsRouter);
app.use('/', viewsRouter);

//app.all applies callback on all verbs
app.all("*", (req, res, next) => {

    const err = new AppError(`can't find ${req.originalUrl} on this server`, 404);
    // passing anything into next goes directly to error handling middleware 
    next(err);
})


//error handling middleware (has 4 parameters)
app.use(GlobalErrorHandler);
module.exports = app;