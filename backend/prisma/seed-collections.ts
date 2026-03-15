import { PrismaClient } from '@prisma/client';

interface SeedItem {
  name: string;
}

interface SeedSeries {
  name: string;
  slug: string;
  items: SeedItem[];
}

interface SeedCategory {
  name: string;
  slug: string;
  description: string;
  series: SeedSeries[];
}

function seedId(category: string, series: string, item: string): string {
  return `seed-${category}-${series}-${item.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
}

const SEED_DATA: SeedCategory[] = [
  {
    name: 'Gundam',
    slug: 'gundam',
    description: 'Mo hinh Gundam',
    series: [
      {
        name: 'Master Grade (MG)',
        slug: 'mg',
        items: [
          { name: 'RX-78-2 Gundam Ver.3.0' },
          { name: 'MSN-06S Sinanju' },
          { name: 'ZGMF-X10A Freedom Gundam 2.0' },
          { name: 'Wing Gundam Zero EW Ver.Ka' },
          { name: 'Unicorn Gundam Full Psycho-Frame' },
          { name: 'Barbatos Lupus Rex' },
          { name: 'Sazabi Ver.Ka' },
          { name: 'Nu Gundam Ver.Ka' },
          { name: 'Exia Repair III' },
          { name: 'Turn A Gundam' },
          { name: 'Astray Red Frame Kai' },
          { name: 'Eclipse Gundam' },
        ],
      },
      {
        name: 'High Grade (HG)',
        slug: 'hg',
        items: [
          { name: 'RX-78-2 Gundam Beyond Global' },
          { name: 'Barbatos' },
          { name: 'Aerial' },
          { name: 'Strike Freedom Gundam' },
          { name: 'Moon Gundam' },
          { name: 'Penelope' },
          { name: 'Schwarzette' },
          { name: 'Darilbalde' },
          { name: 'Lfrith Ur' },
          { name: 'Calibarn' },
        ],
      },
      {
        name: 'Perfect Grade (PG)',
        slug: 'pg',
        items: [
          { name: 'PG Unleashed RX-78-2 Gundam' },
          { name: 'PG Strike Freedom Gundam' },
          { name: 'PG Unicorn Gundam' },
          { name: 'PG Exia' },
          { name: 'PG Banshee Norn' },
          { name: 'PG Wing Gundam Zero Custom' },
          { name: 'PG 00 Raiser' },
          { name: 'PG Astray Red Frame' },
        ],
      },
      {
        name: 'Real Grade (RG)',
        slug: 'rg',
        items: [
          { name: 'RG Hi-Nu Gundam' },
          { name: 'RG Wing Gundam Zero EW' },
          { name: 'RG Sazabi' },
          { name: 'RG Nu Gundam' },
          { name: 'RG Zeong' },
          { name: 'RG Force Impulse Gundam' },
          { name: 'RG God Gundam' },
          { name: 'RG Unicorn Gundam' },
          { name: 'RG Crossbone Gundam X1' },
          { name: 'RG EVA Unit-01' },
        ],
      },
    ],
  },
  {
    name: 'Figurines',
    slug: 'figurines',
    description: 'Mo hinh nhan vat',
    series: [
      {
        name: 'Nendoroid',
        slug: 'nendoroid',
        items: [
          { name: 'Nendoroid Naruto Uzumaki' },
          { name: 'Nendoroid Gojo Satoru' },
          { name: 'Nendoroid Miku Hatsune' },
          { name: 'Nendoroid Tanjiro Kamado' },
          { name: 'Nendoroid Nezuko Kamado' },
          { name: 'Nendoroid Luffy' },
          { name: 'Nendoroid Anya Forger' },
          { name: 'Nendoroid Rem' },
          { name: 'Nendoroid Zero Two' },
          { name: 'Nendoroid Levi Ackerman' },
          { name: 'Nendoroid Power' },
          { name: 'Nendoroid Makima' },
        ],
      },
      {
        name: 'Figma',
        slug: 'figma',
        items: [
          { name: 'Figma Link (Tears of the Kingdom)' },
          { name: 'Figma Spider-Man' },
          { name: 'Figma Saber Artoria Pendragon' },
          { name: 'Figma Kirito' },
          { name: 'Figma Guts (Berserker Armor)' },
          { name: 'Figma Solid Snake' },
          { name: 'Figma Asuna' },
          { name: 'Figma Astolfo' },
          { name: 'Figma Iron Man' },
          { name: 'Figma Cloud Strife' },
        ],
      },
      {
        name: 'S.H.Figuarts',
        slug: 'sh-figuarts',
        items: [
          { name: 'SHF Goku Ultra Instinct' },
          { name: 'SHF Vegeta Super Saiyan Blue' },
          { name: 'SHF Naruto (Sage Mode)' },
          { name: 'SHF Spider-Man (No Way Home)' },
          { name: 'SHF Iron Man Mark 85' },
          { name: 'SHF Thanos (Endgame)' },
          { name: 'SHF Batman (The Dark Knight)' },
          { name: 'SHF Piccolo' },
          { name: 'SHF Frieza Final Form' },
          { name: 'SHF Jiren' },
        ],
      },
      {
        name: 'Scale Figures',
        slug: 'scale-figures',
        items: [
          { name: '1/7 Miku Hatsune (Birthday Ver.)' },
          { name: '1/7 Rem (Crystal Dress)' },
          { name: '1/7 Asuna (Undine Ver.)' },
          { name: '1/8 Saber Alter (Dress Ver.)' },
          { name: '1/7 Zero Two (Wedding Dress)' },
          { name: '1/7 Nezuko Kamado (Demon Form)' },
          { name: '1/8 Emilia (Crystal Dress)' },
          { name: '1/7 Marin Kitagawa (Swimsuit)' },
          { name: '1/7 Power (Chainsaw Man)' },
          { name: '1/7 Yor Forger (Thorn Princess)' },
        ],
      },
    ],
  },
  {
    name: 'Sneakers',
    slug: 'sneakers',
    description: 'Giay sneaker',
    series: [
      {
        name: 'Nike Air Jordan',
        slug: 'air-jordan',
        items: [
          { name: 'AJ1 Retro High OG Chicago' },
          { name: 'AJ1 Retro High OG Royal' },
          { name: 'AJ1 Retro High OG Bred' },
          { name: 'AJ1 Retro High OG Shadow' },
          { name: 'AJ1 Retro High OG Court Purple' },
          { name: 'AJ1 Retro High OG University Blue' },
          { name: 'AJ4 Retro White Cement' },
          { name: 'AJ4 Retro Bred' },
          { name: 'AJ3 Retro White Cement Reimagined' },
          { name: 'AJ11 Retro Cherry' },
          { name: 'AJ1 Low OG Travis Scott' },
          { name: 'AJ4 Retro Military Black' },
        ],
      },
      {
        name: 'Nike Dunk',
        slug: 'nike-dunk',
        items: [
          { name: 'Dunk Low Panda' },
          { name: 'Dunk Low Reverse Panda' },
          { name: 'Dunk Low Argon' },
          { name: 'Dunk Low Grey Fog' },
          { name: 'Dunk Low Rose Whisper' },
          { name: 'Dunk Low Cacao Wow' },
          { name: 'Dunk High Championship White' },
          { name: 'Dunk Low Vintage Navy' },
          { name: 'Dunk Low Coconut Milk' },
          { name: 'Dunk Low Jade Ice' },
        ],
      },
      {
        name: 'Adidas Yeezy',
        slug: 'adidas-yeezy',
        items: [
          { name: 'Yeezy Boost 350 V2 Beluga' },
          { name: 'Yeezy Boost 350 V2 Zebra' },
          { name: 'Yeezy Boost 350 V2 Cream White' },
          { name: 'Yeezy Boost 350 V2 Bred' },
          { name: 'Yeezy Boost 350 V2 Blue Tint' },
          { name: 'Yeezy Boost 700 Wave Runner' },
          { name: 'Yeezy Slide Onyx' },
          { name: 'Yeezy 500 Utility Black' },
          { name: 'Yeezy Boost 380 Alien' },
          { name: 'Yeezy Foam Runner Onyx' },
        ],
      },
      {
        name: 'New Balance',
        slug: 'new-balance',
        items: [
          { name: 'New Balance 550 White Green' },
          { name: 'New Balance 2002R Protection Pack Rain Cloud' },
          { name: 'New Balance 990v6 Grey' },
          { name: 'New Balance 550 White Navy' },
          { name: 'New Balance 574 Classic Grey' },
          { name: 'New Balance 2002R Phantom' },
          { name: 'New Balance 1906D Protection Pack Silver' },
          { name: 'New Balance 530 White Silver' },
        ],
      },
    ],
  },
  {
    name: 'Trading Cards',
    slug: 'trading-cards',
    description: 'The suu tap',
    series: [
      {
        name: 'Pokemon TCG',
        slug: 'pokemon-tcg',
        items: [
          { name: 'Scarlet & Violet Base Set Booster Box' },
          { name: 'Obsidian Flames Booster Box' },
          { name: 'Paldea Evolved Elite Trainer Box' },
          { name: '151 Booster Bundle' },
          { name: 'Paradox Rift Booster Box' },
          { name: 'Temporal Forces Elite Trainer Box' },
          { name: 'Twilight Masquerade Booster Box' },
          { name: 'Surging Sparks Booster Box' },
          { name: 'Prismatic Evolutions Elite Trainer Box' },
          { name: 'Crown Zenith Elite Trainer Box' },
          { name: 'Evolving Skies Booster Box' },
          { name: 'Lost Origin Booster Box' },
        ],
      },
      {
        name: 'Yu-Gi-Oh!',
        slug: 'yugioh',
        items: [
          { name: 'Age of Overlord Booster Box' },
          { name: 'Phantom Nightmare Booster Box' },
          { name: 'Legacy of Destruction Booster Box' },
          { name: 'Maze of Millennia Booster Box' },
          { name: 'Duelist Nexus Booster Box' },
          { name: 'Cyberstorm Access Booster Box' },
          { name: '25th Anniversary Rarity Collection' },
          { name: 'Wild Survivors Booster Box' },
          { name: 'Darkwing Blast Booster Box' },
          { name: 'Power of the Elements Booster Box' },
        ],
      },
      {
        name: 'One Piece Card Game',
        slug: 'one-piece-tcg',
        items: [
          { name: 'OP-01 Romance Dawn Booster Box' },
          { name: 'OP-02 Paramount War Booster Box' },
          { name: 'OP-03 Pillars of Strength Booster Box' },
          { name: 'OP-04 Kingdoms of Intrigue Booster Box' },
          { name: 'OP-05 Awakening of the New Era Booster Box' },
          { name: 'OP-06 Wings of the Captain Booster Box' },
          { name: 'OP-07 500 Years in the Future Booster Box' },
          { name: 'OP-08 Two Legends Booster Box' },
          { name: 'OP-09 The Four Emperors Booster Box' },
          { name: 'ST-01 Straw Hat Crew Starter Deck' },
        ],
      },
    ],
  },
];

export async function seedCollections(prisma: PrismaClient): Promise<void> {
  console.log('Seeding collections...');

  await prisma.$transaction(async (tx) => {
    for (let catPos = 0; catPos < SEED_DATA.length; catPos++) {
      const catData = SEED_DATA[catPos];

      const category = await tx.category.upsert({
        where: { slug: catData.slug },
        update: {
          name: catData.name,
          description: catData.description,
          position: catPos,
        },
        create: {
          name: catData.name,
          slug: catData.slug,
          description: catData.description,
          position: catPos,
        },
      });

      console.log(`  Category: ${category.name} (${category.id})`);

      for (let serPos = 0; serPos < catData.series.length; serPos++) {
        const serData = catData.series[serPos];

        const series = await tx.series.upsert({
          where: {
            categoryId_slug: {
              categoryId: category.id,
              slug: serData.slug,
            },
          },
          update: {
            name: serData.name,
            position: serPos,
          },
          create: {
            categoryId: category.id,
            name: serData.name,
            slug: serData.slug,
            position: serPos,
          },
        });

        console.log(`    Series: ${series.name} (${serData.items.length} items)`);

        for (const itemData of serData.items) {
          const itemId = seedId(catData.slug, serData.slug, itemData.name);

          await tx.item.upsert({
            where: { id: itemId },
            update: {
              name: itemData.name,
              seriesId: series.id,
            },
            create: {
              id: itemId,
              seriesId: series.id,
              name: itemData.name,
            },
          });
        }
      }
    }
  });

  // Print summary counts
  const categoryCount = await prisma.category.count();
  const seriesCount = await prisma.series.count();
  const itemCount = await prisma.item.count();
  console.log(`Collections seeded: ${categoryCount} categories, ${seriesCount} series, ${itemCount} items`);
}
