import { PrismaClient } from '@prisma/client';
import { seedCollections } from './seed-collections';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  await seedCollections(prisma);
  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
