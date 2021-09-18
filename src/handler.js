"use strict"

const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const jwt = require("jsonwebtoken");
var apiMateDB;  // Cached connection-pool for further requests.
const resheaders = {
  "Access-Control-Allow-Origin": "http://localhost:3000"
};

module.exports = async (event, context) => {
  if (event.method === 'OPTIONS') {
    var headers = {};
    headers["Access-Control-Allow-Origin"] = "http://localhost:3000";
    headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, OPTIONS";
    headers["Access-Control-Allow-Credentials"] = false;
    headers["Access-Control-Max-Age"] = '86400'; // 24 hours
    headers["Access-Control-Allow-Headers"] = "*";

    return context
      .status(200)
      .headers(headers)
      .succeed();
  } else {
    return prepareDB().then(async (db) => {
      console.log(event);
      let req = event.body;
      if (event.headers["authorization"] && event.headers["authorization"].startsWith("Bearer ") && event.headers["authorization"].length > 7 && req.query == null) {
        console.log("vfret");
        const vfret = verifyToken(event.headers["authorization"].split(' ')[1]);
        console.log(vfret);
        if (vfret.user_id) {
          req = {
            record: vfret.user_id,
            query: "findById",
            table: "Users",
          }
        }
        else return context.headers(resheaders).fail(vfret.toString());
      }
      console.log(req);
      let ret = await HandleRequest(db, req);
      if (ret == null)
        return context
          .status(404)
          .headers(resheaders)
          .succeed("Not found");
      else if (ret == "Query not found")
        return context
          .status(400)
          .headers(resheaders)
          .succeed(ret);
      else {
        //if (req.table == "Users") ret.password = null;
        return context
          .status(200)
          .headers({
            "Content-type": "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": "http://localhost:3000"
          })
          .succeed(ret)
      }
    })
      .catch(err => {
        return context
          .status(500)
          .headers(resheaders)
          .succeed(err.toString());
      });
  }
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
      case "findById":
        ret = db.collection(table).findOne({ _id: new ObjectId(record) });
        break;
      case "findAll":
        ret = db.collection(table).find({}).toArray();
        break;
      case "find":
        ret = db.collection(table).find(record);
        break;
      case "updateOne":
        ret = db.collection(table).updateOne(record);
        break;
      case "findOne":
        ret = db.collection(table).findOne(record);
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
        ret = "Query not found"
    }
    resolve(ret);
  });
}

const verifyToken = (token) => {
  // const token =
  //   req.body.token || req.query.token || req.headers["x-access-token"];
  if (!token) {
    return "A token is required for authentication";
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_TOKEN_KEY);
    return decoded;
  } catch (err) {
    return "Invalid Token " + err.toString();
  }
};

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