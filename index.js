const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;


//middleware
app.use(cors());
app.use(express.json());
console.log(process.env.DB_PASS);


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rdylw4f.mongodb.net/?retryWrites=true&w=majority`;

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
       // await client.connect();
        // Send a ping to confirm a successful connection
        const db = client.db("toyBD");
        const toyCollection = db.collection("services");

        const imageCollection = client.db('toyBD').collection('toys');

        //get toys for gallery section
        app.get("/toys", async (req, res) => {
            try {
                const result = await imageCollection.find({}).toArray();
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send("Internal Server Error");
            }
        });


        // add a toy
        app.post("/postToy", async (req, res) => {
            try {
                const body = req.body;
                const result = await toyCollection.insertOne(body);
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send("Internal Server Error");
            }
        });


        //all toys
        app.get("/allToys", async (req, res) => {
            const limit = parseInt(req.query.limit) || 20; // Get the limit value from the query parameter, defaulting to 20 if not provided

            const result = await toyCollection.find({}).limit(limit).toArray();
            res.send(result);
        });


        //get all toys by search
        app.get("/allToysSearch/:text", async (req, res) => {
            const searchText = req.params.text;
            try {
                const result = await toyCollection.find({
                    name: { $regex: searchText, $options: "i" }
                }).toArray();
                res.send(result);
            } catch (error) {
                res.status(500).send('Internal Server Error');
            }
        })

        //myToys by sort
        app.get("/myToys/:email", async (req, res) => {
            const { email } = req.params;
            const { sortBy } = req.query;

            // Create a sorting query based on the requested sort option
            let sortQuery = {};
            if (sortBy === "asc") {
                sortQuery = { price: 1 };
            } else if (sortBy === "desc") {
                sortQuery = { price: -1 };
            }

            try {
                const result = await toyCollection
                    .find({ sellerEmail: email })
                    .sort(sortQuery) // Apply the sorting query
                    .toArray();

                res.send(result);
            } catch (error) {
                console.error("Error retrieving toys:", error);
                res.status(500).send("Error retrieving toys");
            }
        });



        //get single toy by id
        app.get("/singleToyById/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const options = {
                projection: { photoURL: 1, name: 1, sellerName: 1, sellerEmail: 1, price: 1, rating: 1, availableQuantity: 1, detailDescription: 1, subCategory: 1 }
            }
            const result = await toyCollection.findOne(query, options);
            res.send(result);

        })


        app.put("/updateToy/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedToy = req.body;
            const toy = {
                $set: {
                    price: updatedToy.price,
                    availableQuantity: updatedToy.availableQuantity,
                    detailDescription: updatedToy.detailDescription,
                }
            }
            const result = await toyCollection.updateOne(filter, toy, options);
            res.send(result);

        })
        //get single toy data for in update page
        app.get("/updateMyToys/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const options = {
                projection: { photoURL: 1, name: 1, sellerName: 1, sellerEmail: 1, price: 1, rating: 1, availableQuantity: 1, detailDescription: 1, subCategory: 1 }
            }
            const result = await toyCollection.findOne(query, options);
            res.send(result);

        })

        //delete myToys
        app.delete("/deleteToy/:id", async (req, res) => {
            const id = req.params.id;
            console.log('please delete', id);
            const query = { _id: new ObjectId(id) }
            const result = await toyCollection.deleteOne(query);
            res.send(result);
        })

        //  get data by subCategory
        app.get('/category', async (req, res) => {
            const category = req.query.subCategory;
            const query = {
                subCategory: category
            }
            const result = await toyCollection.find(query).toArray();
            res.send(result)

        })


       // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('animal toy is running')
})


app.listen(port, () => {
    console.log(`animal toy server is running on port ${port}`)
})


