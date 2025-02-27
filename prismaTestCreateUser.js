const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create a new user
  const user = await prisma.user.create({
    data: {
      name: 'Mc Donald',
      username: 'mcdonald',
      preferredTimezone: 'Asia/Jakarta',
    },
  });

  console.log('User created:', user);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
