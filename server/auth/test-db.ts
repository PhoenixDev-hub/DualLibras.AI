import { prisma } from './src/config/prisma';

async function testConnection() {
  try {
    console.log('Testando conexão com o Supabase via Prisma V7...');

    const result = await prisma.$queryRaw`SELECT 1 as result;`;

    console.log(' Conexão bem-sucedida!');
    console.log('Resultado da query:', result);
  } catch (error) {
    console.error(' Erro de conexão:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
