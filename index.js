const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
require('dotenv').config();
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

// console.log('DB_User:', process.env.DB_User);
// console.log('Secret_Key:', process.env.Secret_Key);

// Database connection URI
const uri = `mongodb+srv://${process.env.DB_User}:${encodeURIComponent(process.env.Secret_Key)}@cluster0.ey6jdyf.mongodb.net/?retryWrites=true&w=majority`;

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
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();

    const eventsCollection = client.db('evento').collection('events');

    // Get all events
    app.get('/events', async (req, res) => {
        const cursor = eventsCollection.find();
        const result = await cursor.toArray();
        res.send(result);
      });

    // Get single event details
      app.get('/events/:id', async (req, res) => {
        const id = req.params.id;
        const query = { event_id: id }; // Changed to use event_id
        const result = await eventsCollection.findOne(query);
        res.send(result);
      });
  


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Evento server is running');
});

app.listen(port, () => {
  console.log(`Evento is running on port ${port}`);
});
