const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
require("dotenv").config();
const cors = require("cors");
const app = express();
const port =  8000;

app.use(express.json());

app.use(cors());



// Database connection URI
const uri = `mongodb+srv://${process.env.DB_User}:${encodeURIComponent(
  process.env.Secret_Key
)}@cluster0.ey6jdyf.mongodb.net/?retryWrites=true&w=majority`;

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
    // Connect the client to the server (optional starting in v4.7)
     client.connect();

    const eventsCollection = client.db("evento").collection("events");
    const registrationsCollection = client
      .db("evento")
      .collection("registrations");

    // Get all events
    app.get("/events", async (req, res) => {
      const cursor = eventsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // Get single event details
    app.get("/events/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await eventsCollection.findOne(query);
      res.send(result);
    });

    // Create an event
    app.post("/events", async (req, res) => {
      const added = req.body;
      const result = await eventsCollection.insertOne(added);
      res.send(result);
    });

    // Get events created by a specific user
    app.get("/events/user/:email", async (req, res) => {
      const userEmail = req.params.email;
      // console.log(userEmail);
      try {
        const query = { user_email: userEmail };
        const cursor = eventsCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching user events:", error);
        res.status(500).send({ message: "Failed to fetch user events", error });
      }
    });

    //Delete an event
    app.delete("/events/:id", async (req, res) => {
      const id = req.params.id;
      console.log("Delete request received for ID:", id);
      try {
        const result = await eventsCollection.deleteOne({
          _id: new ObjectId(id),
        });
        // console.log('Delete result:', result);
        if (result.deletedCount === 0) {
          return res.status(404).json({ message: "Event not found" });
        }
        res.status(200).json({ message: "Event deleted successfully" });
      } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({ message: "Failed to delete event", error });
      }
    });

    // update an event by ID
    app.put("/events/:id", async (req, res) => {
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
          return res
            .status(404)
            .json({ message: "Event not found or no changes made" });
        }

        res.status(200).json({ message: "Event updated successfully" });
      } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).json({ message: "Failed to update event", error });
      }
    });

    // Register for an event
    app.post("/register", async (req, res) => {
      const {
        name,
        email,
        contactNo,
        transactionMethod,
        transactionId,
        eventId,
      } = req.body;

      try {
        console.log("Request body:", req.body);

        // Check if the user has already registered for the event
        const existingRegistration = await registrationsCollection.findOne({
          email,
          eventId,
        });

        if (existingRegistration) {
          return res
            .status(400)
            .json({ message: "You have already registered for this event." });
        }

        // Fetch the event to get available seats
        const event = await eventsCollection.findOne({
          _id: new ObjectId(eventId),
        });

        // console.log('Fetched event:', event);

        if (event && event.available_seats > 0) {
          // Deduct one from the available seats
          await eventsCollection.updateOne(
            { _id: new ObjectId(eventId) },
            { $inc: { available_seats: -1 } }
          );

          // Create a new registration document
          const newRegistration = {
            name,
            email,
            contactNo,
            transactionMethod,
            transactionId,
            eventId,
            registrationDate: new Date(),
          };

          // Save to the database
          const result = await registrationsCollection.insertOne(
            newRegistration
          );
          res.status(201).json({
            message: "Registration successful",
            registrationId: result.insertedId,
          });
        } else {
          return res
            .status(400)
            .json({ message: "No available seats left for this event." });
        }
      } catch (error) {
        console.error("Error registering:", error);
        res.status(500).json({ message: "Server error", error });
      }
    });

    // Get events registered by a specific user
    app.get("/register/user/:email", async (req, res) => {
      const userEmail = req.params.email;

      try {
        const registrations = await registrationsCollection
          .find({ email: userEmail })
          .toArray();
        const eventIds = registrations.map(
          (registration) => registration.eventId
        );

        const registeredEvents = await eventsCollection
          .find({ _id: { $in: eventIds.map((id) => new ObjectId(id)) } })
          .toArray();

        res.send(registeredEvents);
      } catch (error) {
        console.error("Error fetching registered events:", error);
        res
          .status(500)
          .send({ message: "Failed to fetch registered events", error });
      }
    });

    // Get registered users for a specific event
    app.get("/registrations/event/:id", async (req, res) => {
        const eventId = req.params.id;
      
        try {
          const registrations = await registrationsCollection
            .find({ eventId: eventId }) // or new ObjectId(eventId) if `eventId` is an ObjectId
            .toArray();
      
          res.status(200).json(registrations); // Return the registrations or empty array
        } catch (error) {
          console.error("Error fetching registrations:", error);
          res.status(500).json({ message: "Failed to fetch registrations", error });
        }
      });
      

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Evento server is running");
});

app.listen(port, () => {
  console.log(`Evento is running on port ${port}`);
});
