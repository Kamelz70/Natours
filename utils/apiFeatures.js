class APIFeatures {
    constructor(mongooseQuery, queryJSON) {
        this.mongooseQuery = mongooseQuery;
        this.queryJSON = queryJSON;
    }

    filter() {
        // 1A) filtering
        const queryObj = {
            ...this.queryJSON
        };
        const exceptions = ["page", "sort", "limit", "fields"];
        exceptions.forEach((el) => delete queryObj[el]);
        // 1B)Advanced filtering
        let queryString = JSON.stringify(queryObj)
        queryString = queryString.replace(/\b(lt|lte|gt|gte)\b/, match => `$${match}`);
        this.mongooseQuery = this.mongooseQuery.find(JSON.parse(queryString));

        return this;
    }

    sort() {
        // 2) sorting
        const sortString = this.queryJSON.sort;
        if (sortString) {
            this.mongooseQuery = this.mongooseQuery.sort(sortString);
        } else {
            this.mongooseQuery = this.mongooseQuery.sort('-createdAt');
        }
        return this;
    }

    limitFields() {
        // 3) projecting (field limiting)
        let fieldsString = this.queryJSON.fields || "";
        // console.log(fieldsString);
        fieldsString = fieldsString.split(',').join(" ");
        this.mongooseQuery = this.mongooseQuery.select(fieldsString);
        return this;
    }

    paginate() {
        // 3) pagination
        //convert to num and set default value
        const pages = this.queryJSON.page * 1 || 1;
        const limit = this.queryJSON.limit * 1 || 50;
        const skip = (pages - 1) * limit;
        // if (skip >= await Tour.countDocuments()) {
        //     throw new Error("document doesn't exist");
        // }
        this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);
        return this;
    }


}

module.exports = APIFeatures;