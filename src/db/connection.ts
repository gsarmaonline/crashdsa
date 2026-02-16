import postgres from 'postgres'

const sql = process.env.DATABASE_URL
  ? postgres(process.env.DATABASE_URL, {
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
    })
  : null

export default sql
