const mongoose = require("mongoose");
const Tour = require("./tourModel");

//review,rating,createdAt,ref:Tour,Ref:User
const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'A review must have text'],
    },
    rating: {
        type: Number,
        required: [true, 'A review must have a rating'],
        min: 0,
        max: 5,
    },
    createdAt: Date,
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: "Tour",
        required: [true, 'A review must have a referenced tour'],
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: [true, 'A review must have a referenced user'],
    }
});
///////////////////////////////////////////////////
//indexes 
// meaning no user can rate a tour multiple times
reviewSchema.index({
    tour: 1,
    user: 1
}, {
    unique: true
});
///////////////////////////////////////////////////
// Static methods (unlike instance methods)
reviewSchema.statics.calcAverageRatingsOnTour = async function (tourId) {
    // this refers to this Model
    const stats = await this.aggregate([{
            $match: {
                tour: tourId
            }
        },
        {
            // group by tourId so that stats of all docs containing this id are grouped
            $group: {
                _id: "$tour",
                averageRating: {
                    $avg: "$rating"
                },
                nRatings: {
                    $sum: 1
                },
            }
        }
    ]);
    Tour.findByIdAndUpdate(tourId, {
        ratingsAverage: stats[0].averageRating,
        ratingsQuantity: stats[0].nRatings,
    })
}
/////////////// Document middleware
reviewSchema.pre("save", function (next) {
    this.createdAt = Date.now();
    next();
});
// post for after the review is saved, avg is calculated
reviewSchema.post("save", async (doc) => {
    //doc.constructor calls the model cunstructor to use the static method
    // post middleware takes doc as input, use it to get the model
    doc.constructor.calcAverageRatingsOnTour(doc.tour);

});
////////////// query middleware
/// don't forget (function)A
reviewSchema.pre(/^find/, function (next) {
    this.populate({
        path: "user",
        select: "name photo"
    });
    // too much populate chaining
    // this.populate({
    //     path: "tour",
    //     select: "name"
    // });
    next();
});
reviewSchema.pre(/^findOneAnd/, async function (next) {
    const review = await this.findOne()
    this.Review = review;
    next();
});
reviewSchema.post(/^findOneAnd/, async function () {
    await this.Review.constructor.calcAverageRatingsOnTour(this.Review.tour);
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;