/**
 * Test query performance with indexes
 * Run: node test-performance.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/modules/users/user.model');
const Course = require('./src/modules/courses/course.model');
const Assignment = require('./src/modules/assignments/assignment.model');

async function testPerformance() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected\n');

    console.log('='.repeat(80));
    console.log('PERFORMANCE TEST - Queries with Indexes'.padStart(50));
    console.log('='.repeat(80));
    console.log();

    // Test 1: Find users by role
    console.log('📊 Test 1: Find users by role filter');
    let start = Date.now();
    const usersByRole = await User.find({ roleIds: { $exists: true } }).limit(100).lean();
    let duration = Date.now() - start;
    console.log(`   ✓ Found ${usersByRole.length} users in ${duration}ms`);
    console.log();

    // Test 2: Find users by prodi and angkatan
    console.log('📊 Test 2: Find users by prodi + angkatan (compound index)');
    start = Date.now();
    const usersByProdi = await User.find({
      idProdi: { $exists: true },
      angkatan: { $exists: true }
    }).limit(100).lean();
    duration = Date.now() - start;
    console.log(`   ✓ Found ${usersByProdi.length} users in ${duration}ms`);
    console.log();

    // Test 3: Find active courses
    console.log('📊 Test 3: Find active courses');
    start = Date.now();
    const activeCourses = await Course.find({ status: 'aktif' }).limit(100).lean();
    duration = Date.now() - start;
    console.log(`   ✓ Found ${activeCourses.length} courses in ${duration}ms`);
    console.log();

    // Test 4: Find courses by teacher (using index)
    console.log('📊 Test 4: Find courses by teacher');
    start = Date.now();
    const coursesByTeacher = await Course.find({
      idPengajar: { $exists: true }
    }).limit(100).lean();
    duration = Date.now() - start;
    console.log(`   ✓ Found ${coursesByTeacher.length} courses in ${duration}ms`);
    console.log();

    // Test 5: Find assignments by meeting
    console.log('📊 Test 5: Find assignments by meeting');
    start = Date.now();
    const assignments = await Assignment.find({
      idMeeting: { $exists: true }
    }).limit(100).lean();
    duration = Date.now() - start;
    console.log(`   ✓ Found ${assignments.length} assignments in ${duration}ms`);
    console.log();

    // Test 6: Count documents (uses indexes)
    console.log('📊 Test 6: Count users (should be fast with indexes)');
    start = Date.now();
    const userCount = await User.countDocuments({ status: 'aktif' });
    duration = Date.now() - start;
    console.log(`   ✓ Counted ${userCount} active users in ${duration}ms`);
    console.log();

    console.log('='.repeat(80));
    console.log('✅ Performance test complete!');
    console.log();
    console.log('💡 Tips:');
    console.log('   • Queries under 50ms = EXCELLENT (indexes working!)');
    console.log('   • Queries 50-200ms = GOOD');
    console.log('   • Queries over 200ms = Check if index is being used');
    console.log();
    console.log('📊 To see which index was used, add .explain() to queries');
    console.log('   Example: User.find({status: "aktif"}).explain()');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

testPerformance();
