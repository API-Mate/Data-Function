"use strict"

const MongoClient = require('mongodb').MongoClient;
var apiMateDB;  // Cached connection-pool for further requests.

module.exports = async (event, context) => {
  return prepareDB().then(async (db) => {
    let ret = await HandleRequest(db, event.body);
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
    const table = req.table;
    const record = req.record;
    const query = req.query;
    let ret = "Query Started"
    switch (query) {
      case "insertOne":
        ret = db.collection(table).insertOne(record);
        break;
      case "insertMany":
        ret = db.collection(table).insertMany(record);
        break;
      case "findOne":
        ret = db.collection(table).findOne(record);
        break;
      case "find":
        ret = db.collection(table).find(record);
        break;
      case "updateOne":
        ret = db.collection(table).updateOne(record);
        break;
      case "updateMany":
        ret = db.collection(table).updateMany(record);
        break;
      case "deleteOne":
        ret = db.collection(table).deleteOne(record);
        break;
      case "deleteMany":
        ret = db.collection(table).deleteMany(record);
        break;
      default:
        ret = "Query not found"
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