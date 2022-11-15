const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
// const User = require('./userModel');

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        // required: true,
        required: [true, 'A tour must have a name'],
        minLength: 5,
        maxLength: 40,
        unique: true,
        trim: true,
        validate: [(val) => validator.isAlphanumeric(val, 'en-US', {
            ignore: " "
        }), "name must only contain letters"]
    },
    slug: String,
    difficulty: {
        type: String,
        // required: true,
        required: [true, 'A tour must have a difficulty'],
        trim: true,
        enum: {
            values: ["easy", "medium", "difficult"],
            message: 'difficulty must be "easy", "medium", or "hard"'
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, "minimum rating is 1"],
        max: [5, "maximum rating is 5"],
        set: (val) => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'A tour must have a price'],
        min: [0, "minimum price is 0"],
    },
    priceDiscount: {
        type: Number,
        validate: {
            // works only on new documents to compare
            validator: function (val) {
                return val < this.price;
            },
            message: "discount must be less than price"
        }
    },
    duration: {
        type: Number,
        required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a Group Size']
    },
    summary: {
        type: String,
        trim: true,
        required: [true, 'A tour must have a summary']

    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now(),
        // never show in results to clients
        select: false
    },
    secretTour: {
        type: Boolean,
        default: false
    },
    startDates: [Date],
    startLocation: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point"
        },
        coordinates: [Number],
        address: {
            type: String,
        },
        description: {
            type: String,
        }
    },
    locations: [{
        type: {
            type: String,
            enum: ["Point"],
            default: "Point"
        },
        coordinates: [Number],
        address: {
            type: String,
        },
        description: {
            type: String,
        },
        day: Number,
    }],
    // For embedding
    // guides: Array,
    // For referencing
    guides: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],

}, {
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    },
});
/////////////////////////////////////////////////////////////////
// Indexes

// combined index:
tourSchema.index({
    price: 1,
    ratingsAverage: 1
});
tourSchema.index({
    slug: 1
});
tourSchema.index({
    startLocation: "2dsphere"
});

//////////////////////////////////////////////
// create virtual property (not saved in DB)
tourSchema.virtual("durationWeeks").get(function () {
    return this.duration / 7;
});
// Virtual populate
tourSchema.virtual("reviews", {
    ref: "Review",
    // the field name in the reviews schema
    foreignField: "tour",
    localField: "_id",
})

// Document middleware works onlyy on .save and .create
tourSchema.pre('save', function (next) {
    this.slug = slugify(this.name, {
        lower: true
    });
    //mut call next
    next();
});

tourSchema.post('save', (document, next) => {
    // console.log(document);
    next();
});
///////////////////////////////////////////////////////////////////
///////////////////////////////         Embedding guides
// tourSchema.pre('save', async function (next) {
//     // the result of async map is an array of promises
//     const guidesPromises = this.guides.map(id => User.findById(id));
//     this.guides = await Promise.all(guidesPromises);
//     console.log(this.guides);

//     //must call next
//     next();
// });

///////     Query middleware
tourSchema.pre(/^find/, function (next) {
    this.find({
        secretTour: {
            $ne: true
        }
    });
    this.start = Date.now();

    next();
})
tourSchema.pre(/^find/, function (next) {
    this.populate({
        path: "guides",
        select: "-__v"
    });
    next();
})

tourSchema.post(/^find/, function (docs, next) {

    const duration = (Date.now() - this.start);
    next();
})

///////     Aggregation middleware
// tourSchema.pre("aggregate", function (next) {

//     console.log(this.pipeline());
//     //////// false solution, adds match to end of pipeline
//     // this.match({
//     //         secretTour: {
//     //             $ne: true
//     //         }
//     //     }); 
//     this.pipeline().unshift({
//         $match: {
//             secretTour: {
//                 $ne: true
//             }
//         }
//     });
//     console.log("done middle");
//     console.log(this.pipeline());

//     next();
// })

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;