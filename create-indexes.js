/**
 * Script to manually create database indexes
 * Run this in production to avoid blocking on server startup
 *
 * Usage: node create-indexes.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import all models to register their schemas
require('./src/modules/users/user.model');
require('./src/modules/courses/course.model');
require('./src/modules/assignments/assignment.model');
require('./src/modules/submissions/submission.model');
require('./src/modules/materials/material.model');
require('./src/modules/meetings/meeting.model');
require('./src/modules/groups/group-post.model');
require('./src/modules/groups/group-thread.model');
require('./src/modules/groups/activity-log.model');
require('./src/modules/groups/group.model');
require('./src/modules/academicTerms/academic-term.model');
require('./src/modules/privateFiles/private-file.model');
require('./src/modules/groups/group-member.model');
require('./src/modules/groups/contribution-thread.model');

async function createIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB\n');

    console.log('Creating indexes...');

    // Get all registered models
    const models = mongoose.modelNames();

    for (const modelName of models) {
      const Model = mongoose.model(modelName);
      console.log(`Creating indexes for ${modelName}...`);

      try {
        await Model.createIndexes();
        console.log(`✓ Indexes created for ${modelName}`);
      } catch (err) {
        console.error(`✗ Error creating indexes for ${modelName}:`, err.message);
      }
    }

    console.log('\n✓ All indexes created successfully!');
    console.log('\nYou can verify indexes in MongoDB with:');
    console.log('  db.users.getIndexes()');
    console.log('  db.courses.getIndexes()');
    console.log('  etc...');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nConnection closed.');
    process.exit(0);
  }
}

createIndexes();
