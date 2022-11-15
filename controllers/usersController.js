const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync")
const handlerFactory = require("./handlerFactory")
const multer = require('multer');
const sharp = require('sharp');


/////////////////////////////////////////////////////////////////
// Helper functions

///////// takes a json, filters keys and returns values of the fields filter only
const filterObj = (obj, ...fields) => {
    const filteredObj = {};
    Object.keys(obj).forEach(el => {
        if (fields.includes(el)) {
            filteredObj[el] = obj[el];
        }
    });
    return filteredObj;
}

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
}
//////////////////////////////////////////////////
// MiddleWare
///////////////////Multer
// save on disk not needed, better to save in memory first
// const multerStorage = multer.diskStorage({
//     destination: (req, file, callback) => {
//         callback(null, 'public/img/users');
//     },
//     filename: (req, file, cb) => {
//         // user-ID-TIMESTAMP.jpg
//         //req.file is file
//         const ext = file.mimetype.split('/')[1];
//         cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//     }
// });
const multerStorage = multer.memoryStorage();
//test if the uploaded file is an image
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError("Not an image! Please upload images only.", 400), false)
    }

}

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
    if (!req.file) return next();
    //create filename as saving in memory doesn't create a filename
    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
    //use sharp to customize the image
    await sharp(req.file.buffer).resize(500, 500).toFormat('jpeg').jpeg({
        quality: 90
    }, ).toFile(`public/img/users/${req.file.filename}`);
    next();
});
//////////////////////

/////////////////////////////////////////////////////////////////

exports.updateMe = catchAsync(async (req, res, next) => {

    //////////////protect pre middleware
    //1)if body has password, send error with  other paths
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError("Cannot update password from this path, use /updatePassword instead"), 401);
    }

    ////2)filter body and update password

    const filteredBody = filterObj(req.body, "name", "email");
    if (req.file) {

        // add the photo property to the object to save name to DB
        filteredBody.photo = req.file.filename;
    }
    ///////////////we don't need middleware on update, so we can use the following:
    ///////////////req contains user from the protect middleware
    ///////////////new is like inplace, retruns new user
    const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
        runValidators: true,
        new: true,
        useFindAndModify: false
    })
    ////3)send new user data 
    res.status(200).json({
        status: "success",
        data: {
            updatedUser
        }
    })
});

///will run after protect middleware
exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user._id, {
        active: false
    });
    res.status(204).json({
        status: "success",
        data: null
    })
});


exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: "couldn't load route"
    })

}
exports.getAllUsers = handlerFactory.getAll(User);
exports.deleteUser = handlerFactory.deleteOne(User);
exports.getUser = handlerFactory.getOne(User);
exports.updateUser = handlerFactory.updateOne(User);
exports.deleteUser = handlerFactory.deleteOne(User);