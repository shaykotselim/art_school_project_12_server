const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const stripe = require("stripe")(process.env.PAYMENT_SECRET);
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");



const port = process.env.PORT || 5000;

//--------------------------------middleware----------------------------
app.use(cors());
app.use(express.json());

// const verifyJWT = (req, res, next)=>{
//   const authorization = req.headers.authorization;
//   if(!authorization){
//     return res.status(401).send({error: true, message:'unauthorized access'});
//   }
//   // bearer token
//   const token = authorization.split(' ')

//   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
//     if(err){
//       return res.status(401).send({error: true, message: 'unauthorized access'})
//     }
//     req.decoded = decoded;
//     next();
//   })

// }
// UserName:
// Password :
//---------------------Mongodb URI Client Here--------------------------
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.2bu1gse.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)

    const classCollection = client.db("artschooldb").collection("showclass");
    const instructorCollection = client
      .db("artschooldb")
      .collection("showinstructor");
    const cartsCollection = client.db("artschooldb").collection("carts");
    const userCollection = client.db("artschooldb").collection("users");

    const paymentCollection = client.db("artschool").collection("payments");
    //jwt--------------

    

    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;

      const query = { email: email };
      const user = await userCollection.findOne(query);
      const result = { admin: user?.role === "admin" };
      res.send(result);
    });
    app.get("/users/instructor/:email", async (req, res) => {
      const email = req.params.email;

      const query = { email: email };
      const user = await userCollection.findOne(query);
      const result = { instructor: user?.role === "instructor" };
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });
    app.post("/users", async (req, res) => {
      const user = req.body;
      console.log(user);
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists" });
      }

      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    app.patch("/users/instructor/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "instructor",
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // Class Area Here.....................
    app.get("/showclass", async (req, res) => {
      const result = await classCollection.find().toArray();
      res.send(result);
    });
    app.post("/showclass", async (req, res) => {
      const clss = req.body;
      

      const result = await classCollection.insertOne(clss);
      res.send(result);
    });
    app.get("/showclass/:email", async (req, res) => {
      const email = req.params.email;
      const query = { instructor_email: email };
      const result = await classCollection.find(query).toArray();
      res.send(result);
    });
    // Instructor Area Here--------------
    app.get("/showinstructor", async (req, res) => {
      const result = await instructorCollection.find().toArray();
      res.send(result);
    });
    // Cart Collection Post  Area here............
    app.get("/carts", async (req, res) => {
      const email = req.query.email;

     

      const query = { email: email };
      const result = await cartsCollection.find(query).toArray();
      res.send(result);
    });
    app.post("/carts", async (req, res) => {
      const item = req.body;
      const result = await cartsCollection.insertOne(item);
      res.send(result);
    });
    app.delete("/carts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartsCollection.deleteOne(query);
      res.send(result);
    });

    // added stripe
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    app.post("/payments", async (req, res) => {
      const paymentInfo = req.body;
      const insertedResult = await paymentCollection.insertOne(paymentInfo);
      const query = {
        _id: {
          $in: paymentInfo.selectedCourse.map((id)=> new ObjectId(id)),
        },
      };
      const deletedConfirm = await cartsCollection.deleteMany(query);
      
    
      res.send({ insertedResult, deletedConfirm});
    });
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

//--------------------------------------
app.get("/", (req, res) => {
  res.send("Port is on 50000");
});

app.listen(port, () => {
  console.log(`Art school drawing on port ${port}`);
});
