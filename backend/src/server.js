const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const counselorRoutes = require('./routes/counselors');
const timeSlotRoutes = require('./routes/timeSlots');
const appointmentRoutes = require('./routes/appointments');
const statsRoutes = require('./routes/stats');
const exportRoutes = require('./routes/export');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/counselors', counselorRoutes);
app.use('/api/timeslots', timeSlotRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/export', exportRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`心理咨询预约系统后端运行在 http://localhost:${PORT}`);
});
