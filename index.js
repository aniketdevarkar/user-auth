require("dotenv").config();
const express = require("express");
const mongodb = require("mongodb");
const bcrypt = require("bcrypt");
const app = express();

const mongoClient = mongodb.MongoClient;
const objectId = mongoClient.objectId;

const port = process.env.port || 4000;

const dbUrl = process.env.DB_URL || "mongodb://127.0.0.27017";

app.use(express.json());

app.get("/", async (req, res) => {
  try {
    let client = await mongoClient.connect(dbUrl);
    let db = client.db("user-auth");
    let data = await db
      .collection("users")
      .find()
      .project({ password: 0 })
      .toArray();
    res.status(200).json(data);
    await client.close();
  } catch (error) {
    console.log(error);
  }
});

app.post("/register", async (req, res) => {
  try {
    let client = await mongoClient.connect(dbUrl);
    let db = client.db("user-auth");
    let found = await db.collection("users").findOne({ email: req.body.email });
    if (found) {
      res.status(400).json({ message: "user already exist" });
    } else {
      let salt = await bcrypt.genSalt(10);
      let hash = await bcrypt.hash(req.body.password, salt);
      req.body.password = hash;
      await db.collection("users").insertOne(req.body);
      res.status(200).json({ message: "user registered" });
      await client.close();
      // console.log(salt);
    }
  } catch (error) {
    console.log(error);
  }
});

app.post("/login", async (req, res) => {
  try {
    let client = await mongoClient.connect(dbUrl);
    let db = client.db("user-auth");
    let data = await db.collection("users").findOne({ email: req.body.email });
    if (data) {
      let isValid = bcrypt.compare(req.body.password, data.password);
      if (isValid) {
        res.status(200).json({ message: "Login successful" });
      } else {
        res.status(400).json({ message: "Login unsucessful" });
      }
    } else {
      res.status(404).json({ message: "user not found" });
    }
  } catch (error) {
    console.log(error);
  }
});

app.listen(port, () => console.log("app is started with", port));
