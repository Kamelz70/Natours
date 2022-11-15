const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        minLength: 3,
        validate: [(val) => validator.isAlphanumeric(val, 'en-US', {
            ignore: " "
        }), "name must only contain letters and numbers"],
        required: true,
    },
    email: {
        type: String,
        unique: true,
        trim: true,
        required: true,
        validate: [validator.isEmail, "must enter a valid email"]
    },
    role: {
        type: String,
        enum: ["user", "admin", "guide", "lead-guide"],
        default: "user"
    },
    photo: {
        type: String,
        default: 'default.jpg',
        trim: true,
    },
    password: {
        required: true,
        type: String,
        minLength: 8,
        select: false
    },
    passwordConfirm: {
        required: true,
        validate: {
            validator: function (el) {
                return el === this.password;
            },
            message: "password confirmation incorrect"
        },
        type: String
    },
    passwordChangedAt: {
        type: Date
    },
    passwordResetToken: String,
    passwordResetExpiry: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

/////////////// Document middleware .save,.create
userSchema.pre("save", async function (next) {
    // if no password modification return
    if (!this.isModified("password")) {
        return next();
    }
    // sava hash to pasword with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    //drop the confirm
    this.passwordConfirm = undefined
    next();
})
userSchema.pre("save", async function (next) {
    // if no password modification return
    if (!this.isModified("password") || this.isNew) {
        return next();
    }
    // minus 1 second as creating a jwt token can be faster than saving to db, making it invalid when changing password
    this.changedPasswordAt = Date.now() - 1000;
    next();
})
/////////////////////query middleware, .find
userSchema.pre(/^find/, function (next) {
    this.find({
        active: {
            $ne: false,
        }
    });
    next();
})
//instance methods, available on documents

/////////Compares password to chekc if correct
userSchema.methods.correctPassword = async function (candidatePass, userPass) {
    // can't use this.password as it's set to false select
    return await bcrypt.compare(candidatePass, userPass);
}

///////// chacks if password was changed after input date
userSchema.methods.passwordChangedAfter = function (date) {
    if (this.passwordChangedAt) {
        //convert to millisecs with gettime, then get seconds and parse to int
        const passwordDate = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return passwordDate > date;
    }
    return false;
}

userSchema.methods.generatePasswordResetToken = function () {
    const token = crypto.randomBytes(32).toString("hex");
    this.passwordResetToken = crypto.createHash("sha256").update(token).digest("hex");
    //Expiry date after 10 minutes
    this.passwordResetExpiry = Date.now() + (10 * 60 * 1000);

    return token;

    //Even after modifying the doc, it still needs .save()
}
const User = mongoose.model('User', userSchema);

module.exports = User;