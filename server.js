require("dotenv").config();
const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("❌ MONGODB_URI is missing! Set it in Render environment variables.");
  process.exit(1);
}

const client = new MongoClient(uri);

async function start() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB!");

    const db = client.db();
    const expenses = db.collection("expenses");

    // Serve index.html
    app.get("/", (req, res) => {
      res.sendFile(path.join(__dirname, "index.html"));
    });

    // Submit expense
    app.post("/submit", async (req, res) => {
      try {
        const { name, amount, type, description, date } = req.body;
        const result = await expenses.insertOne({ name, amount, type, description, date });
        res.json({ status: "success", message: "✅ Expense saved!", id: result.insertedId });
      } catch (err) {
        console.error(err);
        res.status(500).json({ status: "error", message: "❌ Failed to save expense" });
      }
    });

    // Get all expenses
    app.get("/users", async (req, res) => {
      try {
        const all = await expenses.find().toArray();
        res.json(all);
      } catch (err) {
        console.error(err);
        res.status(500).json({ status: "error", message: "❌ Failed to fetch expenses" });
      }
    });

    // Get single expense
    app.get("/user/:id", async (req, res) => {
      try {
        const user = await expenses.findOne({ _id: new ObjectId(req.params.id) });
        res.json(user);
      } catch (err) {
        console.error(err);
        res.status(500).json({ status: "error", message: "❌ Failed to fetch expense" });
      }
    });

    // Update expense
    app.put("/update/:id", async (req, res) => {
      try {
        const { name, amount, type, description, date } = req.body;
        await expenses.updateOne({ _id: new ObjectId(req.params.id) }, { $set: { name, amount, type, description, date } });
        res.json({ status: "success", message: "✅ Expense updated!" });
      } catch (err) {
        console.error(err);
        res.status(500).json({ status: "error", message: "❌ Failed to update expense" });
      }
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`🚀 Server running on Render at port ${PORT}`));

  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}

start();
