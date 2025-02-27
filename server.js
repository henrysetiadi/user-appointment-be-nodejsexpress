const express = require('express');
const cors = require('cors');

// Import Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user'); // ✅ Import user routes
const appointmentRoutes = require("./routes/appointment");

const app = express();
app.use(express.json());
app.use(cors());

app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use("/api/appointments", appointmentRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
