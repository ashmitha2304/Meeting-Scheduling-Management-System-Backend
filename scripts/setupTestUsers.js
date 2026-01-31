const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function setupTestUsers() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/meeting-scheduler';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get collections
    const db = mongoose.connection.db;
    
    // Clear all collections
    await db.collection('users').deleteMany({});
    await db.collection('meetings').deleteMany({});
    console.log('✅ Database cleared');

    // Create test users
    const hashedPassword = await bcrypt.hash('Password123!', 12);

    const organizer = await db.collection('users').insertOne({
      firstName: 'John',
      lastName: 'Doe',
      email: 'organizer@example.com',
      password: hashedPassword,
      role: 'ORGANIZER',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const participant = await db.collection('users').insertOne({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'participant@example.com',
      password: hashedPassword,
      role: 'PARTICIPANT',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ Created ORGANIZER account: organizer@example.com');
    console.log('✅ Created PARTICIPANT account: participant@example.com');

    // Fetch users to display IDs
    const organizerDoc = await db.collection('users').findOne({ email: 'organizer@example.com' });
    const participantDoc = await db.collection('users').findOne({ email: 'participant@example.com' });

    console.log('\n📋 Test Accounts:');
    console.log('─────────────────────────────────────────');
    console.log('ORGANIZER:');
    console.log('  Name: John Doe');
    console.log('  Email: organizer@example.com');
    console.log('  Password: Password123!');
    console.log('  ID:', organizerDoc._id.toString());
    console.log('\nPARTICIPANT:');
    console.log('  Name: Jane Smith');
    console.log('  Email: participant@example.com');
    console.log('  Password: Password123!');
    console.log('  ID:', participantDoc._id.toString());
    console.log('─────────────────────────────────────────');

    // Verify database state
    const userCount = await db.collection('users').countDocuments();
    const meetingCount = await db.collection('meetings').countDocuments();
    console.log('\n📊 Database Status:');
    console.log('  Users:', userCount);
    console.log('  Meetings:', meetingCount);

    // Disconnect
    await mongoose.disconnect();
    console.log('\n✅ Setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setupTestUsers();
