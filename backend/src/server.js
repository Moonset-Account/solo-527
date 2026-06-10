const express = require('express')
const cors = require('cors')
const dayjs = require('dayjs')

const patientRoutes = require('./routes/patients')
const doctorRoutes = require('./routes/doctors')
const scheduleRoutes = require('./routes/schedules')
const appointmentRoutes = require('./routes/appointments')
const recordRoutes = require('./routes/records')
const followUpRoutes = require('./routes/followups')
const statsRoutes = require('./routes/stats')
const conflictRoutes = require('./routes/conflicts')
const clinicRoutes = require('./routes/clinics')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.use((req, res, next) => {
  console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ${req.method} ${req.url}`)
  next()
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: dayjs().format('YYYY-MM-DD HH:mm:ss') })
})

app.use('/api/patients', patientRoutes)
app.use('/api/doctors', doctorRoutes)
app.use('/api/schedules', scheduleRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/records', recordRoutes)
app.use('/api/followups', followUpRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/conflicts', conflictRoutes)
app.use('/api/clinics', clinicRoutes)

app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({
    error: err.message || 'Internal Server Error',
  })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`API: http://localhost:${PORT}/api`)
})

module.exports = app
