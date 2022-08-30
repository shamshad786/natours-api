class APIfeatures {
    constructor(query, queryString){
            this.query =  query;
            this.queryString =  queryString;
    }

    filter(){
        const queryObj = {...this.queryString}
        const excludedFields = ['page','limit','sort','fields'];
        excludedFields.forEach(el => delete queryObj[el]);
        // console.log()

        //! Advance Filtering Query
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}` );
        const queryStrJson = JSON.parse(queryStr)
        console.log('QueryStr: ',queryStrJson)


        //! const Tours = await Tour.find(req.query).lean();
      this.query =  this.query.find(queryStrJson);

       return this; // this simply return entire object that can we chain miltiple features like sor,limit,etc.
    }


    sort(){
        if(this.queryString.sort){
            console.log(this.queryString.sort)
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query =  this.query.sort(sortBy)
        }else{
            this.query = this.query.sort('-createdAt')
        }
        return this; // this simply return entire object that can we chain miltiple features
    }

    limitFields(){
        if(this.queryString.fields){
            const fields = this.queryString.fields.split(',').join(' ');
           this.query = this.query.select(fields);
        }else{
           this.query =this.query.select('-__v');
        }

        return this; // this simply return entire object that can we chain miltiple features
    }

    pagination(){
        const page =  this.queryString.page * 1 || 1;
        const limit = this.queryString.limit *1 || 100;
        const skip = (page -1) * limit;

       this.query = this.query.skip(skip).limit(limit);

        console.log('Page No: ',page);
        console.log('Limit: ', limit);

        // if(this.queryString.page){ //! if the last page doen't have any data it not error this in class we don't have these line of code
        //     const numTours = await Tour.countDocuments();
        //     console.log('Count Documents',numTours);
        //     if(skip >=  numTours){
        //         throw new Error('This Page Not Found');
        //     }
        // }

        return this; // this simply return entire object that can we chain miltiple features
    }

  }

  module.exports = APIfeatures;