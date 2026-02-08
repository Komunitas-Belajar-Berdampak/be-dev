/**
 * Force rebuild all indexes (drops first, then recreates)
 * Use this to see index creation logs
 * Run: node force-rebuild-indexes.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import all models
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

async function rebuildIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected\n');

    const models = mongoose.modelNames();

    console.log('🗑️  Dropping indexes...\n');
    for (const modelName of models) {
      const Model = mongoose.model(modelName);
      try {
        await Model.collection.dropIndexes();
        console.log(`   ✓ Dropped indexes for ${modelName}`);
      } catch (err) {
        if (err.code === 27 || err.codeName === 'IndexNotFound') {
          console.log(`   • No indexes to drop for ${modelName}`);
        } else {
          console.log(`   ✗ Error dropping indexes for ${modelName}: ${err.message}`);
        }
      }
    }

    console.log('\n🔨 Creating indexes...\n');
    for (const modelName of models) {
      const Model = mongoose.model(modelName);
      try {
        await Model.createIndexes();
        const indexes = await Model.collection.getIndexes();
        const count = Object.keys(indexes).length;
        console.log(`   ✓ Created ${count} indexes for ${modelName}`);
      } catch (err) {
        console.log(`   ✗ Error creating indexes for ${modelName}: ${err.message}`);
      }
    }

    console.log('\n✅ All indexes rebuilt successfully!');
    console.log('\nRun "node verify-indexes.js" to see details.\n');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

rebuildIndexes();
