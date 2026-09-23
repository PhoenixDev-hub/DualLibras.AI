import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Generation/build do not require a database or credentials. Database CLI
    // operations use the direct connection when supplied (e.g. Supabase).
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
})
