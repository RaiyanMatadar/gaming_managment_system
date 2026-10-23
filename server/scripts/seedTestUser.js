import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../src/models/User.js';
import { Station } from '../src/models/Station.js';

async function seedTestUser() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('No MONGO_URI specified in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
    console.log('Connected to MongoDB.');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // 1. Create or update test user: admin@gamedash.com / admin
    let user = await User.findOne({
      $or: [{ username: 'admin' }, { email: 'admin@gamedash.com' }]
    });

    if (!user) {
      user = await User.create({
        username: 'admin',
        email: 'admin@gamedash.com',
        password: hashedPassword,
        name: 'GameDash Admin',
        centerName: 'GameDash Arena HQ',
        role: 'admin',
        whatsappNumber: '919876543210'
      });
      console.log('Created user: admin / admin@gamedash.com (id: ' + user._id + ')');
    } else {
      user.password = hashedPassword;
      user.email = 'admin@gamedash.com';
      user.role = 'admin';
      await user.save();
      console.log('Updated user: admin / admin@gamedash.com (id: ' + user._id + ')');
    }

    // 2. Also ensure testuser / test@gamedash.com exists
    let testUser = await User.findOne({
      $or: [{ username: 'testuser' }, { email: 'test@gamedash.com' }]
    });

    if (!testUser) {
      testUser = await User.create({
        username: 'testuser',
        email: 'test@gamedash.com',
        password: hashedPassword,
        name: 'Testing Manager',
        centerName: 'CyberArena Test Center',
        role: 'manager',
        whatsappNumber: '919876543210'
      });
      console.log('Created user: testuser / test@gamedash.com (id: ' + testUser._id + ')');
    } else {
      testUser.password = hashedPassword;
      testUser.email = 'test@gamedash.com';
      await testUser.save();
      console.log('Updated user: testuser / test@gamedash.com (id: ' + testUser._id + ')');
    }

    // 3. Ensure users have gaming stations to manage
    const usersToSeedStations = [user, testUser];
    for (const u of usersToSeedStations) {
      const existingStations = await Station.find({ userId: u._id });
      if (existingStations.length === 0) {
        console.log(`Seeding demo stations for user ${u.username}...`);
        await Station.create([
          {
            name: `${u.username.toUpperCase()}-PC-01`,
            type: 'PC_VIP',
            hourlyRate: 120,
            status: 'AVAILABLE',
            userId: u._id
          },
          {
            name: `${u.username.toUpperCase()}-PC-02`,
            type: 'PC_STANDARD',
            hourlyRate: 80,
            status: 'AVAILABLE',
            userId: u._id
          },
          {
            name: `${u.username.toUpperCase()}-PS5-01`,
            type: 'PS5',
            hourlyRate: 150,
            status: 'AVAILABLE',
            userId: u._id
          },
          {
            name: `${u.username.toUpperCase()}-VR-01`,
            type: 'VR',
            hourlyRate: 200,
            status: 'AVAILABLE',
            userId: u._id
          }
        ]);
        console.log(`Created 4 stations for user ${u.username}`);
      } else {
        console.log(`User ${u.username} already has ${existingStations.length} stations.`);
      }
    }

    console.log('\n--- Credentials for Testing ---');
    console.log('User 1:');
    console.log('  Email: admin@gamedash.com');
    console.log('  Username: admin');
    console.log('  Password: password123');
    console.log('User 2:');
    console.log('  Email: test@gamedash.com');
    console.log('  Username: testuser');
    console.log('  Password: password123');
    console.log('-------------------------------\n');
  } catch (err) {
    console.error('Error seeding test user:', err);
  } finally {
    await mongoose.disconnect();
  }
}

seedTestUser();
