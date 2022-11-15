const APIFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.deleteOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
        return next(new AppError('no such document with ID found', 404));
    }
    res.status(204).json({
        status: 'success',
        data: null
    })
});

exports.updateOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    if (!doc) {
        return next(new AppError('no such document with ID found', 404));
    }
    res.status(200).json({
        status: 'success',
        data: doc
    })
});

exports.createOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    if (!doc) {
        return next(new AppError("Couldn't create document", 404));
    }
    res.status(201).json({
        status: 'success',
        data: doc
    })
});
//Add populate options if any
exports.getOne = (Model, popOptions) => catchAsync(async (req, res, next) => {

    let query = Model.findById(req.params.id);

    if (popOptions) {
        query = query.populate(popOptions);
    }
    const doc = await query;
    if (!doc) {
        return next(new AppError('no such document with ID found', 404));
    }
    res.status(200).json({
        status: 'success',
        data: doc
    })
});


exports.getAll = Model => catchAsync(async (req, res, next) => {

    //for both routes (tours/:tourID/reveiws) and (/reviews) ((HACK))
    let filter;
    if (req.params.tourID) {
        filter = {
            tour: req.params.tourID
        };
    }
    ////////////////
    const features = new APIFeatures(Model.find(filter), req.query).filter().sort().limitFields().paginate();
    const docs = await features.mongooseQuery;

    res.status(200).json({
        status: 'success',
        requetedAt: res.requestTime,
        results: docs.length,
        data: {
            docs: docs
        }
    });

});