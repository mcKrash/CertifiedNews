const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Note: This seed file creates default admin credentials for the WCNA platform.
// For production use, ensure these credentials are changed immediately after first login.
// Store credentials securely and never commit them to version control.

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create Categories
  const categories = [
    { name: 'All News', slug: 'all', description: 'All news from all categories', color: '#00B4A0' },
    { name: 'Sport', slug: 'sport', description: 'Sports news and updates', color: '#FF6B6B' },
    { name: 'Politics', slug: 'politics', description: 'Political news and analysis', color: '#FFA500' },
    { name: 'Oceans & Forests', slug: 'oceans-forests', description: 'Environmental and conservation news', color: '#4ECDC4' },
    { name: 'Technology', slug: 'technology', description: 'Tech news and innovations', color: '#45B7D1' },
    { name: 'Health', slug: 'health', description: 'Health and wellness news', color: '#96CEB4' },
    { name: 'Science', slug: 'science', description: 'Scientific discoveries and research', color: '#DDA15E' },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }
  console.log('✓ Categories seeded');

  // Create Sources
  const sources = [
    { name: 'BBC News', domain: 'bbc.com', url: 'https://www.bbc.com/news', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/BBC_News_2022.svg/1200px-BBC_News_2022.svg.png', description: 'British Broadcasting Corporation', isVerified: true, trustScore: 95 },
    { name: 'Reuters', domain: 'reuters.com', url: 'https://www.reuters.com', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Reuters_logo.svg/1200px-Reuters_logo.svg.png', description: 'Reuters International news agency', isVerified: true, trustScore: 95 },
  ];

  for (const source of sources) {
    await prisma.source.upsert({
      where: { domain: source.domain },
      update: {},
      create: source,
    });
  }
  console.log('✓ Sources seeded');

  // Create Users
  const hashedPassword = await bcrypt.hash('Admin@2026', 10);
  const reporterPassword = await bcrypt.hash('Reporter123!', 10);
  const userPassword = await bcrypt.hash('User123!', 10);

  const users = [
    { email: 'admin@wcna.com', password: hashedPassword, name: 'System Admin', role: 'ADMIN', isVerified: true },
    { email: 'reporter@certifiednews.com', password: reporterPassword, name: 'Lead Reporter', role: 'REPORTER', isVerified: true },
    { email: 'user@certifiednews.com', password: userPassword, name: 'Regular User', role: 'USER', isVerified: false },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { password: user.password, role: user.role },
      create: user,
    });
  }
  console.log('✓ Users seeded (Admin: admin@wcna.com / Admin@2026)');

  console.log('✅ Database seed completed successfully!');
  console.log('\n📋 Default Admin Credentials:');
  console.log('   Email: admin@wcna.com');
  console.log('   Password: Admin@2026');
  console.log('\n🔗 Admin Dashboard: /admin/dashboard');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
