// const fs = require('fs');
const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const handlerFactory = require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');
///////////////////////////////////////////////////////

// Middleware

///////////////////////////////////////////////////////

// const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`, 'utf-8'))
// exports.checkID = (req, res, next, val) => {
//     if (req.params.id * 1 > tours.length) {
//         return res.status(404).json({
//             status: 'fail',
//             message: 'invalid id'
//         })
//     }
//     next();
// }
exports.checkBody = (req, res, next) => {
    console.log('checking body');
    if (!req.body.name) {
        return res.status(400).json({
            status: 'fail',
            message: "body doesn't contain name",
        });
    }
    next();
};

exports.cheapAlias = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,difficulty,summary';
    next();
};

///////////////////multer
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

exports.uploadTourImages = upload.fields([{
        name: 'imageCover',
        maxCount: 1
    },
    {
        name: 'images',
        maxCount: 3
    }
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
    console.log(req.files);
    if (!req.files.imageCover || !req.files.images) return next();

    //1) cover image
    // to later update in the DB
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
    //use sharp to customize the image
    await sharp(req.files.imageCover[0].buffer).resize(2000, 1333).toFormat('jpeg').jpeg({
        quality: 90
    }, ).toFile(`public/img/tours/${req.body.imageCover }`);

    //2)images
    req.body.images = [];
    //can't use forEach as it's async and won't be awaited, use map then primse.all
    await Promise.all(req.files.images.map(async (file, i) => {
        const fileName = `tour-${req.params.id}-${Date.now()}-${i+1}.jpeg`;
        await sharp(file.buffer).resize(2000, 1333).toFormat('jpeg').jpeg({
            quality: 90
        }, ).toFile(`public/img/tours/${fileName}`);
        req.body.images.push(fileName);
    }));
    next();
});
////////// if multiple under same field, use array
// upload.array('images', 5); req.files
// upload.single('photo'); req.file
// upload.fields([]); req.files

///////////////////////////////////////////////////////////////////////////////

exports.getAllTours = handlerFactory.getAll(Tour);
exports.getTourById = handlerFactory.getOne(Tour, {
    path: 'reviews',
    select: '-__v',
});
exports.createTour = handlerFactory.createOne(Tour);
exports.updateTour = handlerFactory.updateOne(Tour);
exports.deleteTour = handlerFactory.deleteOne(Tour);
exports.getToursStats = catchAsync(async (req, res, next) => {
    // Aggregation pipeline match, group, and sort. stages can be reused
    const stats = await Tour.aggregate([{
            $group: {
                _id: {
                    $toUpper: '$difficulty',
                },
                numTours: {
                    $sum: 1,
                },
                numRatings: {
                    $sum: '$ratingsQuantity',
                },
                avgRatings: {
                    $avg: '$ratingsAverage',
                },
                avgPrice: {
                    $avg: '$price',
                },
                minPrice: {
                    $min: '$price',
                },
                maxPrice: {
                    $max: '$price',
                },
            },
        },
        {
            $sort: {
                // 1 for ascending
                avgPrice: 1,
            },
        },
        // {
        //     $match: {
        //         _id: {
        //             $ne: "easy"
        //         }
        //     }
        // }
    ]);
    res.status(200).json({
        status: 'success',
        data: stats,
    });
});
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const {
        year
    } = req.params;

    const monthlyPlan = await Tour.aggregate([
        // unwind replicates documents while seperating array values
        {
            $unwind: '$startDates',
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-29`),
                },
            },
        },
        {
            $group: {
                _id: {
                    $month: '$startDates',
                },
                numTours: {
                    $sum: 1,
                },
            },
        },
        {
            $addFields: {
                month: '$_id',
            },
        },
        {
            $project: {
                _id: 0,
            },
        },
        {
            $sort: {
                numTours: -1,
            },
        },
        {
            $limit: 5,
        },
    ]);
    res.status(200).json({
        status: 'success',
        data: monthlyPlan,
    });
});

//  'tours/within/distance/:distance/unit/:unit/centerLatLng/:latlng',
exports.getToursWithin = catchAsync(async (req, res, next) => {
    const {
        distance,
        unit,
        latlng
    } = req.params;
    const [lat, lng] = latlng.split(",");

    if (!lat || !lng) {
        return next(
            new AppError('Please specify center in the following format: lat,lng')
        );
    }
    let divisor = 1;
    if (unit === 'mi') {
        divisor = 3963.2;
    } else {
        divisor = 6378.13;
    }
    //radius is in radians, so we devide by equatorial radius
    const radius = distance / divisor;
    const tours = await Tour.find({
        startLocation: {
            $geoWithin: {
                $centerSphere: [
                    [lng, lat], radius
                ],
            }
        },
    });

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            tours,
        },
    });
});
//'/distances/:latlng/unit/:unit'
exports.getToursDistances = catchAsync(async (req, res, next) => {
    const {
        unit,
        latlng
    } = req.params;
    const [lat, lng] = latlng.split(",");
    const multiplier = unit === "mi" ? 0.000621371 : 0.001;
    if (!lat || !lng) {
        return next(
            new AppError('Please specify center in the following format: lat,lng')
        );
    }

    const tours = await Tour.aggregate([{
            $geoNear: {
                near: {
                    type: "Point",
                    coordinates: [lng, lat]
                },
                distanceField: "distance",
                distanceMultiplier: multiplier,
            }
        },
        {
            $project: {
                distance: 1,
                name: 1
            }
        }
    ]);

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            tours,
        },
    });
});