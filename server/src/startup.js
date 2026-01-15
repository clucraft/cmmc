const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function waitForDatabase(maxAttempts = 30) {
  console.log('Waiting for database connection...');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await prisma.$connect();
      console.log('Database connected!');
      return true;
    } catch (error) {
      console.log(`Attempt ${attempt}/${maxAttempts}: Database not ready, waiting...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  throw new Error('Could not connect to database after maximum attempts');
}

async function runMigrations() {
  console.log('Running database migrations...');
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('Migrations completed!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    throw error;
  }
}

async function seedIfEmpty() {
  console.log('Checking if database needs seeding...');
  const familyCount = await prisma.controlFamily.count();

  if (familyCount === 0) {
    console.log('Database is empty, seeding...');
    execSync('node src/seed.js', { stdio: 'inherit' });
    console.log('Seeding completed!');
  } else {
    console.log(`Database already has ${familyCount} control families, skipping seed.`);
  }
}

async function startServer() {
  console.log('Starting server...');
  require('./index.js');
}

async function main() {
  try {
    await waitForDatabase();
    await runMigrations();
    await seedIfEmpty();
    await startServer();
  } catch (error) {
    console.error('Startup failed:', error);
    process.exit(1);
  }
}

main();
