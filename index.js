const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;
const app = express();

//middleware
app.use(cors());
app.use(express.json());
//  verify jwt

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  console.log(authHeader);
  if (!authHeader) {
    console.log("acces");
    return res.status(401).send({ message: "UnAuthorized access" });
  }
  const token = authHeader;
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}
// database connection

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yit7l.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// datebase integration

async function run() {
  try {
    await client.connect();
    const projectCollection = client.db("udoylab").collection("project");
    const userCollection = client.db("udoylab").collection("user");

    // Token generate
    app.post("/gettoken", (req, res) => {
      // let jwtoken = crypto.randomBytes(64).toString('hex')
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "30d",
      });
      res.send({ accessToken });
    });

    
    // users
    app.get("/user/:email", async (req, res) => {
      console.log("user get");
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      if (user) {
        res.send({ status: "success", data: user });
      } else {
        res.send({ status: 404 });
      }
    });

    app.get("/user", async (req, res) => {
      const user = await userCollection.find();

      console.log("users get");
      const result = await user.toArray();
      if (result) {
        res.send({ status: "success", data: result });
      } else {
        res.send({ status: 404 });
      }
    });

    app.put("/user", async (req, res) => {
      const newUser = req.body;

      console.log("user put");
      const query = { email: newUser.email };
      const user = await userCollection.updateOne(
        query,
        { $set: newUser }, // Update
        { upsert: true } // add document with req.body._id if not exists
      );
      if (user.acknowledged) {
        res.send({ status: "success" });
      } else {
        res.send({ status: "404" });
      }
    });

    // project

    app.put("/project", async (req, res) => {
      const { _id, ...updateOrder } = req.body;

      console.log("project put");
      const query = { _id: ObjectId(_id) };
      const updated = await projectCollection.updateOne(
        query,
        { $set: updateOrder }, // Update
        { upsert: true } // add document with req.body._id if not exists
      );
      const cursor = await projectCollection.findOne(query);
      res.send({ status: "success", data: cursor });
    });

    app.post("/project", async (req, res) => {
      const product = req.body;

      console.log("project post");
      const order = await projectCollection.insertOne(product);
      if (order.acknowledged) {
        const result = await projectCollection.findOne({
          _id: order.insertedId,
        });

        res.send({ result, status: "success" });
      } else {
        res.send("404 error");
      }
    });

    app.get("/project", async (req, res) => {
      console.log("order get");
      const email = req.query.email;
      const status = req.query.status;
      let query = {};
      if (email) {
        if (status === "all") {
          query = { email: email };
        } else {
          query = { email: email, status: status };
        }
      }
      // step 2: get the booking of that day. output: [{}, {}, {}, {}, {}, {}]
      const cursor = await projectCollection.find(query);
      const userProduct = await cursor.toArray();
      res.send(userProduct);
    });

    app.get("/project/:id", async (req, res) => {
      const id = req.params.id;

      console.log("order id get");
      const query = { _id: ObjectId(id) };
      const cursor = await projectCollection.findOne(query);
      res.send(cursor);
    });


    app.delete("/project/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const cursor = await projectCollection.deleteOne(query);
      res.send(cursor);
    });

    
  } finally {
    // client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Running udoylab server");
});

app.listen(port, () => {
  console.log("lisening form ", port);
});
