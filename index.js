const express = require('express');
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
require('dotenv').config();

const port = process.env.PORT || 5000;

//--------------------------------middleware----------------------------
app.use(cors());
app.use(express.json());

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
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    
    const classCollection = client.db("artschooldb").collection("showclass");
    const instructorCollection = client.db("artschooldb").collection("showinstructor");
    const cartsCollection = client.db("artschooldb").collection("carts");
    const userCollection = client.db("artschooldb").collection("users");
    
    //user related Api
    app.get('/users', async (req, res)=>{
        const result = await userCollection.find().toArray();
        res.send(result);
    })
    app.post('/users', async(req, res)=>{
        const user = req.body;
        console.log(user);
        const query = {email: user.email};
        const existingUser = await userCollection.findOne(query);
        if(existingUser){
            return res.send({message:'user already exists'})
        }

        const result = await userCollection.insertOne(user);
        res.send(result);
    })

    // Class Area Here.....................
    app.get('/showclass', async(req, res)=>{
        const result = await classCollection.find().toArray();
        res.send(result);
    })
    
    
    // Instructor Area Here--------------
    app.get('/showinstructor', async(req, res)=>{
        const result = await instructorCollection.find().toArray();
        res.send(result);
    })

    // Cart Collection Post  Area here............
    app.get('/carts', async(req, res)=>{
        const email = req.query.email;
        if(!email){
            res.send([]);
        }
        const query ={email: email};
        const result = await cartsCollection.find(query).toArray();
        res.send(result)
    })

    app.post('/carts', async(req, res)=>{
        const item = req.body;
        const result = await cartsCollection.insertOne(item);
        res.send(result);
    })

    app.delete('/carts/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await cartsCollection.deleteOne(query);
        res.send(result);
      });
      

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    
  }
}
run().catch(console.dir);

//--------------------------------------
app.get('/', (req, res)=>{
    res.json("Art School is Drawing");
})

app.listen(port, ()=>{
    console.log(`Art school drawing on port ${port}`);
})