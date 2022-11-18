const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const {
    promisify
} = require("util");
const Email = require("../utils/email");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

const signToken = (id) => jwt.sign({
    id: id
}, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRATION_PERIOD
})

const createSendToken = (user, statusCode, req, res) => {
    const token = signToken(user._id);
    // set cookie options, important for security
    // const cookieOptions = {
    //     httpOnly: true,
    //     expires: new Date(Date.now() + process.env.JWT_EXPIRATION_PERIOD_IN_DAYS * 24 * 60 * 60 * 1000),
    //     // Check if connection is secure, x-for... is for heroku check
    //     secure: req.secure || req.headers('x-forwarded-proto' === 'https')
    // }
    // if (process.env.NODE_ENV === 'production') {
    // cookieOptions.secure = true;}
    // set cookie in request 
    res.cookie('jwt', token, {
        httpOnly: true,
        expires: new Date(Date.now() + process.env.JWT_EXPIRATION_PERIOD_IN_DAYS * 24 * 60 * 60 * 1000),
        secure: (req.secure || req.headers['x-forwarded-proto'] === 'https')
    })
    // in case of signup:
    user.password = undefined

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user: user
        }
    })
}
exports.signup = catchAsync(async (req, res, next) => {
    //this method has a security flaw of enabling etting roles on signup, anyone can set admin role
    // const user = await User.create(req.body);
    //Correct way: 
    const user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt,
        role: req.body.role
    });
    const url = `${req.protocol}://${req.get("host")}/me`;
    // console.log(url);
    await new Email(user, url).sendWelcome();
    createSendToken(user, 201, req, res);
});


exports.login = catchAsync(async (req, res, next) => {
    const {
        email,
        password
    } = req.body;
    //1) check if req has user and pass
    if (!email || !password) {
        return next(new AppError("please send Email and password", 400));
    }
    //2) check if user is in database and pass is correct
    const user = await User.findOne({
        email: email
    }).select("+password");

    //use the function in compaison in case user isn't found
    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError("incorrect Email or password", 401));
    }
    //3) respond
    createSendToken(user, 201, req, res);
});


exports.logout = catchAsync(async (req, res, next) => {
    res.cookie('jwt', 'loggedOut', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    });
    res.status(200).json({
        status: "success"
    });
});



exports.protect = catchAsync(async (req, res, next) => {
    let token
    //1) check if token is in header, startsWith triggers error when undefined value is checked
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }
    if (!token) {
        return next(new AppError("Please login", 401));
    }
    //2)verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET_KEY);
    //3)verify user still exits
    const freshUser = await User.findById(decoded.id);
    if (!freshUser) {
        return next(new AppError("User doesn't exist anymore", 401));
    }
    //4)check if password wasn't changed after token issuance date
    if (freshUser.passwordChangedAfter(decoded.iat)) {
        return next(new AppError("User changed password after token issuance date, please login again", 401));
    }
    //attach user to req if needed
    req.user = freshUser;
    // for pug to access
    res.locals.user = freshUser;
    next();
});

exports.isLoggedIn = async (req, res, next) => {
    try {


        if (req.cookies.jwt) {
            //1)verify token
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET_KEY);
            //3)verify user still exits
            const currentUser = await User.findById(decoded.id);
            if (!currentUser) {
                return next();
            }
            //4)check if password wasn't changed after token issuance date
            if (currentUser.passwordChangedAfter(decoded.iat)) {
                return next();
            }
            //attach user to res locals to make accessible to pug templates
            res.locals.user = currentUser;
        }

        next();
    } catch (err) {
        return next();
    }
};
//three dots accepts any nuber of args, turns into an array
exports.restrictTo = (
    ...roles
) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return next(new AppError("Permission denied for this account"));
    }
    next();
};

exports.forgotPassword = catchAsync(async (req, res, next) => {

    //1)check if user exists
    const user = await User.findOne(req.id);

    if (!user) {
        return next(new AppError("No such user with provided email", 404));
    }

    //2)Generate token
    const resetToken = user.generatePasswordResetToken();

    // saving user as modifying user in methods don't commit to DB
    //Diasabling validation to modify document
    user.save({
        validateBeforeSave: false
    });
    //create url of reset

    const resetURL = `${req.protocol}://${req.get("host")}/api/v1/users/resetPassword/${resetToken}`;
    // console.log(resetURL);
    const message = `Forgot your Password? Submit a PATCH request with your new password and passwordConfirm to ${resetURL}.\nIf you didn't forget your password, ignore this mail.`;
    try {

        // await Email({
        //     email: user.email,
        //     subject: "password reset, Expiration in 10 mins",
        //     message
        // });
        await new Email(user, resetURL).sendPasswordReset();
        res.status(200).json({
            status: "success",
            mesage: "Token sent to email"
        });
    } catch (err) {
        // console.log(err);
        user.passwordResetToken = undefined;
        user.passwordResetExpiry = undefined;
        user.save({
            validatebeforeSave: false
        })
        next(new AppError("Error sending password reset email", 500));
    }

})
exports.resetPassword = catchAsync(async (req, res, next) => {
    //1)Get user from token (token is hached in DB, need to hash incoming and match)
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpiry: {
            $gt: Date.now()
        }
    });
    //2) if expired or user not found, error, save pass to DB

    //other way
    // if (!user || (Date.now() > user.passwordResetExpiry)) {
    //     next(new AppError("token wrong or expired password reset token"));
    // }
    if (!user) {
        return next(new AppError("token wrong or expired password reset token", 400));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    //3) update changedPasswordAt 
    //better to add save middleware
    // user.changedPasswordAt = Date.now()-1000;
    await user.save();
    //4) LogIn and send jwt 

    createSendToken(user, 200, req, res);

})

exports.updatePassword = catchAsync(async (req, res, next) => {
    //1)get user from collection
    // const user = await User.findOne({

    ///////////////     IMPORTANT
    // can't use findbyidandupdate, validators won't run, only runson save and create, pre save middlewares also won't run
    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
        return next(new AppError("User ID not found"), 404)
    }
    //2)compare passwords 
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError("old password is incorrect, retry"), 401)
    }

    //3)set new pASS
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    //4)log in

    createSendToken(user, 200, req, res);

})