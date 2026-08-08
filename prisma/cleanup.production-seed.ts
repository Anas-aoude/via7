import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_EMAIL_PREFIX = "seed.";

async function main() {
  console.log("Starting VIA7 production demo cleanup...");

  const seedUsers = await prisma.user.findMany({
    where: {
      email: {
        startsWith: SEED_EMAIL_PREFIX,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      email: true,
    },
  });

  if (seedUsers.length === 0) {
    console.log("No seed users found. Nothing to clean.");
    return;
  }

  const seedUserIds = seedUsers.map((user) => user.id);

  const seedListings = await prisma.listing.findMany({
    where: {
      userId: {
        in: seedUserIds,
      },
    },
    select: {
      id: true,
    },
  });

  const seedListingIds = seedListings.map((listing) => listing.id);

  console.log(`Found ${seedUsers.length} seed users.`);
  console.log(`Found ${seedListings.length} seed listings.`);

  if (seedListingIds.length > 0) {
    await prisma.message.deleteMany({
      where: {
        conversation: {
          listingId: {
            in: seedListingIds,
          },
        },
      },
    });

    await prisma.conversation.deleteMany({
      where: {
        listingId: {
          in: seedListingIds,
        },
      },
    });

    await prisma.review.deleteMany({
      where: {
        listingId: {
          in: seedListingIds,
        },
      },
    });

    await prisma.listingView.deleteMany({
      where: {
        listingId: {
          in: seedListingIds,
        },
      },
    });

    await prisma.listing.deleteMany({
      where: {
        id: {
          in: seedListingIds,
        },
      },
    });
  }

  await prisma.review.deleteMany({
    where: {
      OR: [
        {
          authorId: {
            in: seedUserIds,
          },
        },
        {
          targetId: {
            in: seedUserIds,
          },
        },
      ],
    },
  });

  await prisma.listingView.deleteMany({
    where: {
      userId: {
        in: seedUserIds,
      },
    },
  });

  await prisma.message.deleteMany({
    where: {
      senderId: {
        in: seedUserIds,
      },
    },
  });

  await prisma.conversation.deleteMany({
    where: {
      userIds: {
        hasSome: seedUserIds,
      },
    },
  });

  await prisma.user.deleteMany({
    where: {
      id: {
        in: seedUserIds,
      },
    },
  });

  console.log("✅ Production demo cleanup completed.");
  console.log("✅ Real production users and listings were not deleted.");
}

main()
  .catch((error) => {
    console.error("PRODUCTION_SEED_CLEANUP_ERROR", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
