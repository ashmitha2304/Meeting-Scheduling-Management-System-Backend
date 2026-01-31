import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import models
import User from '../src/models/User';
import Meeting from '../src/models/Meeting';

async function setupTestUsers() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/meeting-scheduler';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clear all collections
    await User.deleteMany({});
    await Meeting.deleteMany({});
    console.log('✅ Database cleared');

    // Create test users
    const hashedPassword = await bcrypt.hash('Password123!', 12);

    const organizer = await User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'organizer@example.com',
      password: hashedPassword,
      role: 'ORGANIZER',
      isActive: true
    });
    console.log('✅ Created ORGANIZER account:', organizer.email);

    const participant = await User.create({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'participant@example.com',
      password: hashedPassword,
      role: 'PARTICIPANT',
      isActive: true
    });
    console.log('✅ Created PARTICIPANT account:', participant.email);

    console.log('\n📋 Test Accounts:');
    console.log('─────────────────────────────────────────');
    console.log('ORGANIZER:');
    console.log('  Email: organizer@example.com');
    console.log('  Password: Password123!');
    console.log('  ID:', organizer._id.toString());
    console.log('\nPARTICIPANT:');
    console.log('  Email: participant@example.com');
    console.log('  Password: Password123!');
    console.log('  ID:', participant._id.toString());
    console.log('─────────────────────────────────────────');

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
