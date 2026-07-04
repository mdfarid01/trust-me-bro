import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const users = [
    {
      username: "Farid",
      walletAddress: "8KTX7axY1E72WWeDjVHqmFM3ThDnX3cddUtocH2zvLUY",
      legacyWalletAddress: "DemoWalletFarid111111111111111111111111111111",
    },
    {
      username: "Aman",
      walletAddress: "J5gYCHZwXqYBVRBvGv8BUVgn2GmvqdryWTWTxQ83AJA",
      legacyWalletAddress: "DemoWalletAman1111111111111111111111111111111",
    },
  ];

  for (const user of users) {
    const createdUser = await prisma.user.upsert({
      where: { walletAddress: user.walletAddress },
      update: { username: user.username },
      create: {
        username: user.username,
        walletAddress: user.walletAddress,
      },
    });

    const legacyUser = await prisma.user.findUnique({
      where: { walletAddress: user.legacyWalletAddress },
      select: { id: true },
    });

    if (legacyUser && legacyUser.id !== createdUser.id) {
      await prisma.loan.updateMany({
        where: { lenderId: legacyUser.id },
        data: { lenderId: createdUser.id },
      });

      await prisma.loan.updateMany({
        where: { borrowerId: legacyUser.id },
        data: { borrowerId: createdUser.id },
      });

      await prisma.trustEvent.updateMany({
        where: { userId: legacyUser.id },
        data: { userId: createdUser.id },
      });

      await prisma.trustScore.deleteMany({
        where: { userId: legacyUser.id },
      });

      await prisma.user.delete({
        where: { id: legacyUser.id },
      });
    }

    await prisma.trustScore.upsert({
      where: { userId: createdUser.id },
      update: {},
      create: { userId: createdUser.id },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
