 const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

 mongoose.connect(process.env.MONGO_URI)

  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

const UserSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  password: String,
  streak: { type: Number, default: 0 },
  lastCodingDate: { type: String, default: null },
  totalLines: { type: Number, default: 0 },
  badges: [String]
});
const User = mongoose.model("User", UserSchema);

// SIGNUP
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already exists" });
    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashed });
    await newUser.save();
    res.json({ message: "Account created successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Wrong password" });
    const token = jwt.sign({ id: user._id }, "codebloom_secret", { expiresIn: "7d" });
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        streak: user.streak,
        badges: user.badges
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/", (req, res) => res.send("CodeBloom Running"));

app.listen(5000, () => console.log("Server running on port 5000"));