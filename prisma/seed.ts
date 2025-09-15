import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (in development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Clearing existing data...');
    await prisma.vote.deleteMany({});
    await prisma.pollOption.deleteMany({});
    await prisma.poll.deleteMany({});
    await prisma.user.deleteMany({});
    console.log('✅ Existing data cleared');
  }

  // Create sample users with different roles and scenarios
  const userData = [
    { 
      name: 'Rohit Sharma', 
      email: 'rohit@gmail.in', 
      password: 'Rohit@1234',
      description: 'Tech Lead - Active poll creator'
    },
    { 
      name: 'Ananya Singh', 
      email: 'ananya@gmail.in', 
      password: 'Ananya@1234',
      description: 'Product Manager - Frequent voter'
    },
    { 
      name: 'Vikram Patel', 
      email: 'vikram@gmail.in', 
      password: 'Vikram@1234',
      description: 'Frontend Developer - Occasional participant'
    },
    { 
      name: 'Priya Mehta', 
      email: 'priya@gmail.in', 
      password: 'Priya@1234',
      description: 'UX Designer - Poll creator'
    },
    { 
      name: 'Arjun Rao', 
      email: 'arjun@gmail.in', 
      password: 'Arjun@1234',
      description: 'Backend Developer - Active voter'
    },
    { 
      name: 'Divya Kapoor', 
      email: 'divya@gmail.in', 
      password: 'Divya@1234',
      description: 'DevOps Engineer - Team lead'
    }
  ];

  console.log('👥 Creating users...');
  const createdUsers = [];

  for (const user of userData) {
    const passwordHash = await bcrypt.hash(user.password, 12);
    const createdUser = await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        passwordHash
      }
    });
    createdUsers.push(createdUser);
    console.log(`   ✅ Created user: ${user.name} (${user.email}) - ${user.description}`);
  }

  // Create comprehensive sample polls with various scenarios
  const pollsData = [
    {
      question: 'Which backend technology do Indian developers prefer in 2025?',
      options: ['Node.js', 'Spring Boot', 'Django', 'Express.js', 'Go', 'Ruby on Rails'],
      isPublished: true,
      creator: createdUsers[0], // Rohit
      category: 'Technology'
    },
    {
      question: 'Which database is widely used in Indian startups?',
      options: ['PostgreSQL', 'MySQL', 'MongoDB', 'Cassandra', 'Redis'],
      isPublished: true,
      creator: createdUsers[1], // Ananya
      category: 'Technology'
    },
    {
      question: 'Which frontend framework is gaining popularity in India?',
      options: ['React', 'Vue.js', 'Angular', 'Svelte', 'Next.js'],
      isPublished: true,
      creator: createdUsers[0], // Rohit
      category: 'Technology'
    },
    {
      question: 'Which cloud platform do Indian startups mostly use?',
      options: ['AWS', 'Google Cloud', 'Azure', 'DigitalOcean', 'Vercel'],
      isPublished: true,
      creator: createdUsers[3], // Priya
      category: 'Cloud'
    },
    {
      question: 'Which code editor do Indian developers prefer?',
      options: ['VS Code', 'WebStorm', 'Atom', 'Vim', 'IntelliJ IDEA'],
      isPublished: true,
      creator: createdUsers[2], // Vikram
      category: 'Tools'
    },
    {
      question: 'How often should dev teams in India conduct meetings?',
      options: ['Daily', 'Every 2-3 days', 'Weekly', 'Bi-weekly', 'Monthly'],
      isPublished: true,
      creator: createdUsers[5], // Divya
      category: 'Management'
    },
    {
      question: 'What is the preferred API versioning method among Indian developers?',
      options: ['URI versioning (/v1/)', 'Header versioning', 'Query params', 'Accept header', 'No versioning'],
      isPublished: true,
      creator: createdUsers[4], // Arjun
      category: 'API Design'
    },
    {
      question: 'Which testing library is popular for Node.js projects in India?',
      options: ['Jest', 'Mocha', 'Vitest', 'Chai', 'Supertest'],
      isPublished: false, // Unpublished poll for testing
      creator: createdUsers[0], // Rohit
      category: 'Testing'
    },
    {
      question: 'Which JavaScript bundler do Indian developers prefer?',
      options: ['Webpack', 'Vite', 'Rollup', 'Parcel', 'esbuild'],
      isPublished: true,
      creator: createdUsers[3], // Priya
      category: 'Build Tools'
    },
    {
      question: 'Which authentication method is most trusted in Indian tech companies?',
      options: ['JWT', 'OAuth 2.0', 'API Keys', 'Session Cookies', 'Basic Auth'],
      isPublished: true,
      creator: createdUsers[4], // Arjun
      category: 'Security'
    }
  ];

  console.log('📊 Creating polls with options...');
  const createdPolls = [];

  for (const pollData of pollsData) {
    const poll = await prisma.poll.create({
      data: {
        question: pollData.question,
        isPublished: pollData.isPublished,
        creatorId: pollData.creator.id
      }
    });

    const options = await Promise.all(
      pollData.options.map(optionText =>
        prisma.pollOption.create({
          data: {
            text: optionText,
            pollId: poll.id
          }
        })
      )
    );

    createdPolls.push({ poll, options, category: pollData.category });
    const status = pollData.isPublished ? '✅ Published' : '📝 Draft';
    console.log(`   ✅ Created poll: "${poll.question}" with ${options.length} options [${pollData.category}] ${status}`);
  }

  // Create realistic voting patterns
  console.log('🗳️  Creating sample votes with realistic patterns...');
  let voteCount = 0;

  for (const { poll, options } of createdPolls) {
    if (!poll.isPublished) continue; // Only vote on published polls

    // Create different voting patterns for different polls
    const voterPool = [...createdUsers];
    
    // Randomize the number of voters (50-90% participation)
    const participationRate = 0.5 + Math.random() * 0.4;
    const numVoters = Math.floor(voterPool.length * participationRate);
    
    // Shuffle voters
    const shuffledVoters = voterPool.sort(() => Math.random() - 0.5).slice(0, numVoters);

    for (const voter of shuffledVoters) {
      // Create realistic voting patterns based on poll topic
      let selectedOption;
      
      if (poll.question.includes('programming language')) {
        // Favor popular languages
        const popularChoices = ['JavaScript/Node.js', 'Python', 'Java'];
        const isPopularChoice = Math.random() < 0.7;
        if (isPopularChoice) {
          const popularOptions = options.filter(opt => popularChoices.includes(opt.text));
          selectedOption = popularOptions[Math.floor(Math.random() * popularOptions.length)] || options[0];
        } else {
          selectedOption = options[Math.floor(Math.random() * options.length)];
        }
      } else if (poll.question.includes('database')) {
        // Favor PostgreSQL and MongoDB
        const preferredDbs = ['PostgreSQL', 'MongoDB'];
        const isPreferred = Math.random() < 0.6;
        if (isPreferred) {
          const preferredOptions = options.filter(opt => preferredDbs.includes(opt.text));
          selectedOption = preferredOptions[Math.floor(Math.random() * preferredOptions.length)] || options[0];
        } else {
          selectedOption = options[Math.floor(Math.random() * options.length)];
        }
      } else {
        // Random distribution for other polls
        selectedOption = options[Math.floor(Math.random() * options.length)];
      }

      try {
        await prisma.vote.create({
          data: {
            userId: voter.id,
            pollOptionId: selectedOption.id
          }
        });
        voteCount++;
      } catch (error) {
        // Skip if duplicate vote (shouldn't happen with our logic, but just in case)
        continue;
      }
    }
  }

  console.log(`   ✅ Created ${voteCount} votes with realistic patterns`);

  // Generate comprehensive statistics
  const stats = await Promise.all([
    prisma.user.count(),
    prisma.poll.count(),
    prisma.pollOption.count(),
    prisma.vote.count(),
    prisma.poll.count({ where: { isPublished: true } }),
    prisma.poll.count({ where: { isPublished: false } })
  ]);

  // Get top polls by vote count
  const topPolls = await prisma.poll.findMany({
    where: { isPublished: true },
    include: {
      options: {
        include: {
          _count: {
            select: { votes: true }
          }
        }
      }
    },
    take: 3
  });

  // Sort polls by total votes (client-side sorting)
  const sortedPolls = topPolls
    .map(poll => ({
      ...poll,
      totalVotes: poll.options.reduce((sum: number, option: any) => sum + option._count.votes, 0)
    }))
    .sort((a, b) => b.totalVotes - a.totalVotes)
    .slice(0, 3);

  console.log('\n📈 Database seeding completed successfully!');
  console.log('═══════════════════════════════════════');
  console.log('📊 SEEDING STATISTICS:');
  console.log(`   👥 Users: ${stats[0]}`);
  console.log(`   📊 Polls: ${stats[1]} (${stats[4]} published, ${stats[5]} drafts)`);
  console.log(`   📝 Poll Options: ${stats[2]}`);
  console.log(`   🗳️  Votes: ${stats[3]}`);
  console.log('');
  console.log('🎯 SAMPLE CATEGORIES:');
  console.log('   � Technology, Cloud, Tools');
  console.log('   👔 Management, API Design');
  console.log('   🛡️  Security, Testing, Build Tools');
  console.log('');
  console.log('🏆 TOP VOTED POLLS:');
  
  sortedPolls.forEach((poll, index) => {
    console.log(`   ${index + 1}. "${poll.question}" - ${poll.totalVotes} votes`);
  });

  console.log('');
  console.log('🚀 READY TO TEST! Sample credentials:');
  console.log('   📧 Email: rohit@gmail.in');
  console.log('   🔐 Password: Rohit@1234');
  console.log('');
  console.log('   📧 Email: ananya@gmail.in');
  console.log('   🔐 Password: Ananya@1234');
  // console.log('');
  // console.log('💡 TIP: All users have the same password for easy testing');
  console.log('═══════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
