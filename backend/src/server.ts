import express from 'express'
import cors from 'cors'
import drawingsRouter from './routes/drawings'
import importRouter from './routes/import'
import dashboardRouter from './routes/dashboard'

const app = express()
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000'

app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/drawings', drawingsRouter)
app.use('/api/import', importRouter)
app.use('/api/dashboard', dashboardRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`)
})

export default app
