import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { Client } from 'pg'

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
  })
  try {
    await client.connect()
    await client.query(
      await readFile(
        path.resolve(__dirname, '../../prisma/patches/material-classroom.sql'),
        'utf8',
      ),
    )
    console.log('Vínculo de materiais com turmas atualizado.')
  } catch {
    console.error('Não foi possível atualizar o banco. Verifique a conexão e as permissões.')
    process.exitCode = 1
  } finally {
    await client.end()
  }
}
void main()
