import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();




const SEED_EMAIL_PREFIX = "seed.";

const seedPassword = process.env.PRODUCTION_SEED_PASSWORD;

if (!seedPassword) {
  throw new Error(
    "PRODUCTION_SEED_PASSWORD is required. Do not use a hard-coded production seed password."
  );
}





const governorates = [
  "Damascus",
  "Rif Dimashq",
  "Aleppo",
  "Homs",
  "Hama",
  "Latakia",
  "Tartus",
  "Idlib",
  "Daraa",
  "As-Suwayda",
  "Quneitra",
  "Deir ez-Zor",
  "Raqqa",
  "Al-Hasakah",
];

const citiesByGovernorate: Record<string, string[]> = {
  Damascus: ["Damascus", "Mezzeh", "Malki", "Kafr Sousa", "Baramkeh"],
  "Rif Dimashq": ["Jaramana", "Qudsaya", "Dummar", "Zabadani"],
  Aleppo: ["Aleppo", "Azaz", "Afrin", "Al-Bab"],
  Homs: ["Homs", "Talkalakh", "Al-Qusayr"],
  Hama: ["Hama", "Masyaf", "Salamiyah"],
  Latakia: ["Latakia", "Jableh", "Qardaha"],
  Tartus: ["Tartus", "Baniyas", "Safita"],
  Idlib: ["Idlib", "Ariha", "Maarat al-Numan"],
  Daraa: ["Daraa", "Izra", "Al-Sanamayn"],
  "As-Suwayda": ["As-Suwayda", "Salkhad", "Shahba"],
  Quneitra: ["Quneitra", "Khan Arnabah"],
  "Deir ez-Zor": ["Deir ez-Zor", "Al-Mayadin", "Al-Bukamal"],
  Raqqa: ["Raqqa", "Tabqa"],
  "Al-Hasakah": ["Al-Hasakah", "Qamishli", "Ras al-Ayn"],
};

const categories = [
  "Apartment",
  "House",
  "Villa",
  "Cabin",
  "Hotel",
  "Tourism",
  "Land",
  "Farm",
  "Office",
  "Shop",
  "Restaurant",
  "Warehouse",
  "Factory",
];

const categoryImages: Record<string, string[]> = {
  Apartment: [
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200",
  ],

  House: [
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200",
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200",
    "https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=1200",
  ],

  Villa: [
    "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200",
    "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200",
  ],

  Cabin: [
    "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200",
    "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200",
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200",
  ],

  Hotel: [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200",
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200",
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200",
  ],

  Tourism: [
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200",
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200",
  ],

  Land: [
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200",
    "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=1200",
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200",
  ],

  Farm: [
    "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200",
    "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1200",
    "https://images.unsplash.com/photo-1500076656116-558758c991c1?w=1200",
  ],

  Office: [
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200",
    "https://images.unsplash.com/photo-1497366412874-3415097a27e7?w=1200",
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200",
  ],

  Shop: [
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200",
    "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=1200",
    "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200",
  ],

  Restaurant: [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200",
    "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200",
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200",
  ],

  Warehouse: [
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200",
    "https://images.unsplash.com/photo-1553413077-190dd305871c?w=1200",
    "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1200",
  ],

  Factory: [
    "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=1200",
    "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=1200",
    "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=1200",
  ],
};

const avatarUrls = [
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400",
];

const names = [
  "Ahmad Al Hassan",
  "Maya Darwish",
  "Omar Khaled",
  "Lina Mansour",
  "Yazan Haddad",
  "Nour Saleh",
  "Samer Nasser",
  "Rama Ibrahim",
  "Khaled Barakat",
  "Sara Al Ali",
];

const titlesByCategory: Record<string, string[]> = {
  Apartment: ["Modern Apartment", "City Apartment", "Furnished Apartment"],
  House: ["Family House", "Traditional House", "Private House"],
  Villa: ["Luxury Villa", "Private Villa", "Garden Villa"],
  Cabin: ["Mountain Cabin", "Wooden Cabin", "Quiet Cabin"],
  Hotel: ["Boutique Hotel", "Hotel Room", "City Hotel"],
  Tourism: ["Tourism Chalet", "Holiday Stay", "Resort Stay"],
  Land: ["Investment Land", "Residential Land", "Commercial Land"],
  Farm: ["Green Farm", "Private Farm", "Countryside Farm"],
  Office: ["Modern Office", "Business Office", "Office Space"],
  Shop: ["Retail Shop", "Commercial Shop", "Street Shop"],
  Restaurant: ["Restaurant Space", "Cafe Restaurant", "Food Business"],
  Warehouse: ["Large Warehouse", "Storage Warehouse", "Industrial Warehouse"],
  Factory: ["Industrial Factory", "Production Factory", "Factory Space"],
};

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log("Starting VIA7 production demo seed...");

  /*
   * Safety check:
   * Never overwrite or delete real production data.
   */
  const existingSeedUser = await prisma.user.findFirst({
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

  if (existingSeedUser) {
    throw new Error(
      `Production seed already exists (${existingSeedUser.email}). ` +
      "Run the dedicated seed cleanup script before seeding again."
    );
  }

  const hashedPassword = await bcrypt.hash(seedPassword, 12);

  /*
   * Demo users only.
   *
   * No ADMIN is created here.
   * Your real production admin stays untouched.
   */
  const users: Awaited<ReturnType<typeof prisma.user.create>>[] = [];

  for (let i = 0; i < 30; i++) {
    const role =
      i < 5
        ? UserRole.VIP_HOST
        : i < 22
          ? UserRole.HOST
          : UserRole.USER;

    const number = String(i + 1).padStart(2, "0");

    const email =
      role === UserRole.USER
        ? `seed.user${number}@via7.app`
        : role === UserRole.VIP_HOST
          ? `seed.viphost${number}@via7.app`
          : `seed.host${number}@via7.app`;

    const user = await prisma.user.create({
      data: {
        name: names[i % names.length],
        email,
        hashedPassword,
        role,

        avatarUrl: avatarUrls[i % avatarUrls.length],

        bio:
          role === UserRole.USER
            ? "Exploring properties across Syria."
            : "Property owner offering residential and commercial real estate across Syria.",

        phoneNumber: `9639${randomInt(10000000, 99999999)}`,

        dateOfBirth: new Date(
          randomInt(1975, 2003),
          randomInt(0, 11),
          randomInt(1, 28)
        ),

        /*
         * Recommended for demo accounts if these fields
         * exist in your Prisma schema.
         *
         * emailVerified: new Date(),
         * isBanned: false,
         */
      },
    });

    users.push(user);
  }

  const hosts = users.filter(
    (user) =>
      user.role === UserRole.HOST ||
      user.role === UserRole.VIP_HOST
  );

  if (hosts.length === 0) {
    throw new Error("No seed hosts were created.");
  }

  const listings: Awaited<ReturnType<typeof prisma.listing.create>>[] = [];

  /*
   * Demo listings
   */
  for (let i = 1; i <= 312; i++) {
    const category = categories[(i - 1) % categories.length];

    const governorate = randomItem(governorates);

    const city = randomItem(
      citiesByGovernorate[governorate]
    );

    const purpose =
      Math.random() > 0.65 ? "sale" : "rent";

    const imageUrls = categoryImages[category];

    const host = randomItem(hosts);

    const titleBase = randomItem(
      titlesByCategory[category]
    );

    const isCommercial = [
      "Office",
      "Shop",
      "Restaurant",
      "Warehouse",
      "Factory",
      "Land",
      "Farm",
      "Hotel",
      "Tourism",
    ].includes(category);

    const listing = await prisma.listing.create({
      data: {
        title: `${titleBase} in ${city} ${i}`,

        description:
          "Well located property with a practical layout, clear details, and strong potential. Suitable for users looking for real estate opportunities across Syria.",

        price:
          purpose === "sale"
            ? randomInt(25000, 550000)
            : randomInt(120, 3500),

        governorate,
        city,

        district: randomItem([
          "Center",
          "Old Town",
          "West",
          "East",
          "North",
        ]),

        street: `Street ${randomInt(1, 90)}`,

        address: `${city}, ${governorate}`,

        latitude: randomInt(3200, 3700) / 100,
        longitude: randomInt(3500, 4200) / 100,

        category,
        type: category,
        purpose,

        guestCount: isCommercial
          ? null
          : randomInt(1, 10),

        bedroomCount: isCommercial
          ? null
          : randomInt(1, 6),

        bedCount: isCommercial
          ? null
          : randomInt(1, 8),

        bathroomCount: randomInt(1, 4),

        area: randomInt(45, 1200),

        imageUrl: imageUrls[0],
        imageUrls,

        isActive: Math.random() > 0.06,

        /*
         * First 39 listings appear in featured areas.
         */
        featured: i <= 39,

        viewCount: randomInt(10, 3500),
        favoriteCount: randomInt(0, 600),

        userId: host.id,
      },
    });

    listings.push(listing);
  }

  /*
   * Listing views
   */
  for (let i = 0; i < 250; i++) {
    const user = randomItem(users);
    const listing = randomItem(listings);

    if (listing.userId === user.id) {
      continue;
    }

    try {
      await prisma.listingView.create({
        data: {
          userId: user.id,
          listingId: listing.id,
        },
      });
    } catch {
      /*
       * Ignore duplicate view constraints.
       */
    }
  }

  /*
   * Reviews
   */
  for (let i = 0; i < 180; i++) {
    const author = randomItem(users);
    const listing = randomItem(listings);

    if (listing.userId === author.id) {
      continue;
    }

    await prisma.review.create({
      data: {
        rating: randomInt(3, 5),

        comment: randomItem([
          "Great property and very helpful owner.",
          "Clean property and good location.",
          "Very comfortable experience.",
          "Good value for the price.",
          "I would recommend this property.",
        ]),

        authorId: author.id,
        targetId: listing.userId,
        listingId: listing.id,
      },
    });
  }

  /*
   * Demo conversations
   */
  for (let i = 0; i < 90; i++) {
    const guest = randomItem(users);
    const listing = randomItem(listings);

    if (guest.id === listing.userId) {
      continue;
    }

    const conversation =
      await prisma.conversation.create({
        data: {
          listingId: listing.id,
          userIds: [
            guest.id,
            listing.userId,
          ],
        },
      });

    await prisma.message.create({
      data: {
        conversationId:
          conversation.id,

        senderId: guest.id,

        body:
          "Hello, is this property still available?",

        isRead:
          Math.random() > 0.5,
      },
    });

    await prisma.message.create({
      data: {
        conversationId:
          conversation.id,

        senderId:
          listing.userId,

        body:
          "Hello, yes it is available. You are welcome to ask anything.",

        isRead:
          Math.random() > 0.5,
      },
    });
  }

  console.log("");
  console.log(
    "✅ VIA7 production demo seed completed."
  );

  console.log(
    `✅ ${users.length} demo users created.`
  );

  console.log(
    `✅ ${listings.length} demo listings created.`
  );

  console.log("");
  console.log(
    "Seed accounts use the seed.*@via7.app namespace."
  );

  console.log(
    "No real users or listings were deleted."
  );
}

main()
  .catch((error) => {
    console.error(
      "PRODUCTION_SEED_ERROR",
      error
    );

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });