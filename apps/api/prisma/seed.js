const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create Categories
  const categories = [
    {
      name: 'All News',
      slug: 'all',
      description: 'All news from all categories',
      color: '#00B4A0',
    },
    {
      name: 'Sport',
      slug: 'sport',
      description: 'Sports news and updates',
      color: '#FF6B6B',
    },
    {
      name: 'Politics',
      slug: 'politics',
      description: 'Political news and analysis',
      color: '#FFA500',
    },
    {
      name: 'Oceans & Forests',
      slug: 'oceans-forests',
      description: 'Environmental and conservation news',
      color: '#4ECDC4',
    },
    {
      name: 'Technology',
      slug: 'technology',
      description: 'Tech news and innovations',
      color: '#45B7D1',
    },
    {
      name: 'Health',
      slug: 'health',
      description: 'Health and wellness news',
      color: '#96CEB4',
    },
    {
      name: 'Science',
      slug: 'science',
      description: 'Scientific discoveries and research',
      color: '#DDA15E',
    },
  ];

  for (const category of categories) {
    const existing = await prisma.category.findUnique({
      where: { slug: category.slug },
    });

    if (!existing) {
      await prisma.category.create({
        data: category,
      });
      console.log(`✓ Created category: ${category.name}`);
    }
  }

  // Create Sources
  const sources = [
    {
      name: 'BBC News',
      domain: 'bbc.com',
      url: 'https://www.bbc.com/news',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/BBC_News_2022.svg/1200px-BBC_News_2022.svg.png',
      description: 'British Broadcasting Corporation - Global news coverage',
      isVerified: true,
      trustScore: 95,
    },
    {
      name: 'Reuters',
      domain: 'reuters.com',
      url: 'https://www.reuters.com',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Reuters_logo.svg/1200px-Reuters_logo.svg.png',
      description: 'Reuters - International news agency',
      isVerified: true,
      trustScore: 95,
    },
    {
      name: 'AP News',
      domain: 'apnews.com',
      url: 'https://apnews.com',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Associated_Press_logo_2012.svg/1200px-Associated_Press_logo_2012.svg.png',
      description: 'Associated Press - American news agency',
      isVerified: true,
      trustScore: 95,
    },
    {
      name: 'The Guardian',
      domain: 'theguardian.com',
      url: 'https://www.theguardian.com',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/The_Guardian_2015_logo.svg/1200px-The_Guardian_2015_logo.svg.png',
      description: 'The Guardian - British newspaper',
      isVerified: true,
      trustScore: 92,
    },
    {
      name: 'NPR',
      domain: 'npr.org',
      url: 'https://www.npr.org',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/NPR_logo.svg/1200px-NPR_logo.svg.png',
      description: 'NPR - American public radio',
      isVerified: true,
      trustScore: 92,
    },
    {
      name: 'CNN',
      domain: 'cnn.com',
      url: 'https://www.cnn.com',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/CNN.svg/1200px-CNN.svg.png',
      description: 'CNN - Cable News Network',
      isVerified: true,
      trustScore: 88,
    },
  ];

  for (const source of sources) {
    const existing = await prisma.source.findUnique({
      where: { domain: source.domain },
    });

    if (!existing) {
      await prisma.source.create({
        data: source,
      });
      console.log(`✓ Created source: ${source.name}`);
    }
  }

  console.log('✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
