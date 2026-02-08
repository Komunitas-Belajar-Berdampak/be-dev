/**
 * Quick script to verify all indexes exist
 * Run: node verify-indexes.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./src/modules/users/user.model');
const Course = require('./src/modules/courses/course.model');
const Assignment = require('./src/modules/assignments/assignment.model');
const Submission = require('./src/modules/submissions/submission.model');
const Material = require('./src/modules/materials/material.model');
const Meeting = require('./src/modules/meetings/meeting.model');
const GroupPost = require('./src/modules/groups/group-post.model');
const GroupThread = require('./src/modules/groups/group-thread.model');
const ActivityLog = require('./src/modules/groups/activity-log.model');
const StudyGroup = require('./src/modules/groups/group.model');
const AcademicTerm = require('./src/modules/academicTerms/academic-term.model');
const PrivateFile = require('./src/modules/privateFiles/private-file.model');

const models = [
  { name: 'User', model: User },
  { name: 'Course', model: Course },
  { name: 'Assignment', model: Assignment },
  { name: 'Submission', model: Submission },
  { name: 'Material', model: Material },
  { name: 'Meeting', model: Meeting },
  { name: 'GroupPost', model: GroupPost },
  { name: 'GroupThread', model: GroupThread },
  { name: 'ActivityLog', model: ActivityLog },
  { name: 'StudyGroup', model: StudyGroup },
  { name: 'AcademicTerm', model: AcademicTerm },
  { name: 'PrivateFile', model: PrivateFile },
];

async function verifyIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected\n');

    console.log('='.repeat(80));
    console.log('CHECKING INDEXES'.padStart(45));
    console.log('='.repeat(80));
    console.log();

    for (const { name, model } of models) {
      try {
        const indexes = await model.collection.getIndexes();
        const indexCount = Object.keys(indexes).length;

        console.log(`📊 ${name}:`);
        console.log(`   Total indexes: ${indexCount}`);

        Object.entries(indexes).forEach(([indexName, indexDef]) => {
          if (indexDef && indexDef.key) {
            const keys = Object.keys(indexDef.key).join(', ');
            const unique = indexDef.unique ? ' [UNIQUE]' : '';
            console.log(`   ✓ ${indexName}: ${keys}${unique}`);
          }
        });
        console.log();
      } catch (err) {
        console.log(`   ✗ Error: ${err.message}\n`);
      }
    }

    console.log('='.repeat(80));
    console.log('✓ Verification complete!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

verifyIndexes();
