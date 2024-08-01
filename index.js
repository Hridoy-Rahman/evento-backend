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
        const query = { _id: new ObjectId(id) }
        const result = await eventsCollection.findOne(query);
        res.send(result);
      });
  

    // Create an event
    app.post('/events', async (req, res) => {
        const added = req.body;
        const result = await eventsCollection.insertOne(added);
        res.send(result);
      });


        // Get events created by a specific user
    app.get('/events/user/:email', async (req, res) => {
        const userEmail = req.params.email;
        // console.log(userEmail);
        try {
          const query = { user_email: userEmail };
          const cursor = eventsCollection.find(query);
          const result = await cursor.toArray();
          res.send(result);
        } catch (error) {
          console.error('Error fetching user events:', error);
          res.status(500).send({ message: 'Failed to fetch user events', error });
        }
      });

      //Delete an event
    app.delete('/events/:id', async (req, res) => {
        const id = req.params.id;
        console.log('Delete request received for ID:', id);
        try {
            const result = await eventsCollection.deleteOne({ _id: new ObjectId(id) });
            // console.log('Delete result:', result);
            if (result.deletedCount === 0) {
                return res.status(404).json({ message: 'Event not found' });
            }
            res.status(200).json({ message: 'Event deleted successfully' });
        } catch (error) {
            console.error('Error deleting event:', error);
            res.status(500).json({ message: 'Failed to delete event', error });
        }
    });


    // update an event by ID
    app.put('/events/:id', async (req, res) => {
        const id = req.params.id;
        const updatedEvent = req.body;

        // console.log('Update request received for ID:', id);
        // console.log('Updated event data:', updatedEvent);

        try {
            const result = await eventsCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updatedEvent }
            );

            if (result.modifiedCount === 0) {
                return res.status(404).json({ message: 'Event not found or no changes made' });
            }

            res.status(200).json({ message: 'Event updated successfully' });
        } catch (error) {
            console.error('Error updating event:', error);
            res.status(500).json({ message: 'Failed to update event', error });
        }
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
