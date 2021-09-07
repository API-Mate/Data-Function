"use strict"

const MongoClient = require('mongodb').MongoClient;
var apiMateDB;  // Cached connection-pool for further requests.

module.exports = async (event, context) => {
  return prepareDB().then(async (db) => {
    let ret = await HandleRequest(db, event.body);
    console.log(ret);
    if (ret.status == "error") {
      if (ret.message == null) {
        return context
          .status(404)
          .headers({
            "Content-type": "application/json; charset=utf-8"
          })
          .succeed({ message: "Not Found" })
      } else {
        return context
          .status(500)
          .headers({
            "Content-type": "application/json; charset=utf-8"
          })
          .succeed({ message: ret.message })
      }
    }
    else
      return context
        .status(200)
        .headers({
          "Content-type": "application/json; charset=utf-8"
        })
        .succeed(ret)
  })
    .catch(err => {
      return context.fail(err.toString());
    });
}

async function HandleRequest(db, req) {
  return new Promise(resolve => {
    let ret = { message: "Query Started", status: "success" }

    try {
      const table = req.table;
      const record = req.record;
      const query = req.query;
      switch (query) {
        case "insertOne":
          ret.message = db.collection(table).insertOne(record);
          break;
        case "insertMany":
          ret.message = db.collection(table).insertMany(record);
          break;
        case "findOne":
          ret.message = db.collection(table).findOne(record);
          break;
        case "find":
          ret.message = db.collection(table).find(record);
          break;
        case "updateOne":
          ret.message = db.collection(table).updateOne(record);
          break;
        // case "updateMany":
        //   ret = db.collection(table).updateMany(record);
        //   break;
        // case "deleteOne":
        //   ret = db.collection(table).deleteOne(record);
        //   break;
        // case "deleteMany":
        //   ret = db.collection(table).deleteMany(record);
        //   break;
        default:
          ret.message = "Query not found"; ret.status = "error";
      }
    } catch (err) {
      ret.message = err.toString(); ret.status = "error";
    }
    resolve(ret);
  });
}

const prepareDB = () => {
  const url = process.env.mongoconnect;
  //mongoconnect
  return new Promise((resolve, reject) => {
    if (apiMateDB) {
      console.error("DB already connected.");
      return resolve(apiMateDB);
    }

    console.error("DB connecting");

    MongoClient.connect(url, (err, database) => {
      if (err) {
        return reject(err)
      }

      apiMateDB = database.db("api-mate");
      return resolve(apiMateDB)
    });
  });
}