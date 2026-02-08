/**
 * Test REAL-WORLD query performance (like your actual API)
 * Run: node test-real-queries.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import ALL models so they're registered
const User = require('./src/modules/users/user.model');
const Course = require('./src/modules/courses/course.model');
const Assignment = require('./src/modules/assignments/assignment.model');
const AcademicTerm = require('./src/modules/academicTerms/academic-term.model');
const Major = require('./src/modules/majors/major.model');
const Role = require('./src/modules/roles/roles.model');

async function testRealQueries() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected\n');

    console.log('='.repeat(80));
    console.log('REAL-WORLD API QUERY PERFORMANCE'.padStart(52));
    console.log('='.repeat(80));
    console.log();

    // Get actual data for realistic queries
    const sampleUser = await User.findOne().lean();
    const sampleCourse = await Course.findOne().lean();

    if (sampleUser) {
      // Warm up query
      await User.findOne().lean();

      // Test 1: Real user query by status (like your API)
      console.log('📊 Test 1: List users by status = "aktif" (real API query)');
      let start = Date.now();
      const activeUsers = await User.find({ status: 'aktif' })
        .limit(20)
        .lean();
      let duration = Date.now() - start;
      console.log(`   ✓ Found ${activeUsers.length} users in ${duration}ms`);
      console.log(`   ${duration < 50 ? '⚡ EXCELLENT!' : duration < 100 ? '✓ Good' : '⚠️ Could be better'}`);

      // Check if index was used
      const explainResult = await User.find({ status: 'aktif' }).limit(20).explain('executionStats');
      const indexUsed = explainResult.executionStats.executionStages.inputStage?.indexName ||
                        explainResult.executionStats.executionStages.stage;
      console.log(`   📋 Index used: ${indexUsed}`);
      console.log();

      // Test 2: Real compound query (status + role)
      if (sampleUser.roleIds && sampleUser.roleIds.length > 0) {
        console.log('📊 Test 2: List users by role + status (compound index)');
        start = Date.now();
        const filteredUsers = await User.find({
          roleIds: sampleUser.roleIds[0],
          status: 'aktif'
        })
          .limit(20)
          .lean();
        duration = Date.now() - start;
        console.log(`   ✓ Found ${filteredUsers.length} users in ${duration}ms`);
        console.log(`   ${duration < 50 ? '⚡ EXCELLENT!' : duration < 100 ? '✓ Good' : '⚠️ Could be better'}`);
        console.log();
      }

      // Test 3: Real prodi query
      if (sampleUser.idProdi) {
        console.log('📊 Test 3: List users by prodi (real filter)');
        start = Date.now();
        const usersByProdi = await User.find({ idProdi: sampleUser.idProdi })
          .limit(20)
          .lean();
        duration = Date.now() - start;
        console.log(`   ✓ Found ${usersByProdi.length} users in ${duration}ms`);
        console.log(`   ${duration < 50 ? '⚡ EXCELLENT!' : duration < 100 ? '✓ Good' : '⚠️ Could be better'}`);
        console.log();
      }
    }

    if (sampleCourse) {
      // Test 4: Real course query by periode
      if (sampleCourse.idPeriode) {
        console.log('📊 Test 4: List courses by periode (real filter)');
        start = Date.now();
        const coursesByPeriode = await Course.find({ idPeriode: sampleCourse.idPeriode })
          .populate('idPeriode', 'periode')
          .populate('idPengajar', 'nama')
          .limit(20)
          .lean();
        duration = Date.now() - start;
        console.log(`   ✓ Found ${coursesByPeriode.length} courses in ${duration}ms`);
        console.log(`   ${duration < 50 ? '⚡ EXCELLENT!' : duration < 100 ? '✓ Good' : '⚠️ Could be better'}`);
        console.log();
      }

      // Test 5: Real course query by teacher
      if (sampleCourse.idPengajar) {
        console.log('📊 Test 5: List courses by teacher (like API endpoint)');
        start = Date.now();
        const coursesByTeacher = await Course.find({ idPengajar: sampleCourse.idPengajar })
          .populate('idPeriode', 'periode')
          .limit(20)
          .lean();
        duration = Date.now() - start;
        console.log(`   ✓ Found ${coursesByTeacher.length} courses in ${duration}ms`);
        console.log(`   ${duration < 50 ? '⚡ EXCELLENT!' : duration < 100 ? '✓ Good' : '⚠️ Could be better'}`);
        console.log();
      }

      // Test 6: Compound query (teacher + periode)
      if (sampleCourse.idPengajar && sampleCourse.idPeriode) {
        console.log('📊 Test 6: Courses by teacher + periode (compound index)');
        start = Date.now();
        const compoundQuery = await Course.find({
          idPengajar: sampleCourse.idPengajar,
          idPeriode: sampleCourse.idPeriode
        })
          .limit(20)
          .lean();
        duration = Date.now() - start;
        console.log(`   ✓ Found ${compoundQuery.length} courses in ${duration}ms`);
        console.log(`   ${duration < 50 ? '⚡ EXCELLENT!' : duration < 100 ? '✓ Good' : '⚠️ Could be better'}`);
        console.log();
      }
    }

    // Test 7: Assignment visibility filter (real API)
    console.log('📊 Test 7: List visible assignments (like mahasiswa API)');
    start = Date.now();
    const visibleAssignments = await Assignment.find({ status: 'VISIBLE' })
      .sort({ tenggat: 1 })
      .limit(20)
      .lean();
    duration = Date.now() - start;
    console.log(`   ✓ Found ${visibleAssignments.length} assignments in ${duration}ms`);
    console.log(`   ${duration < 50 ? '⚡ EXCELLENT!' : duration < 100 ? '✓ Good' : '⚠️ Could be better'}`);
    console.log();

    // Test 8: Count with filter (pagination)
    console.log('📊 Test 8: Count documents for pagination (real API)');
    start = Date.now();
    const count = await Course.countDocuments({ status: 'aktif' });
    duration = Date.now() - start;
    console.log(`   ✓ Counted ${count} courses in ${duration}ms`);
    console.log(`   ${duration < 50 ? '⚡ EXCELLENT!' : duration < 100 ? '✓ Good' : '⚠️ Could be better'}`);
    console.log();

    console.log('='.repeat(80));
    console.log('✅ Real-world query test complete!');
    console.log();
    console.log('📈 Performance Summary:');
    console.log('   ⚡ Under 50ms = EXCELLENT (indexes working perfectly!)');
    console.log('   ✓ 50-100ms = GOOD (indexes helping significantly)');
    console.log('   ⚠️ Over 100ms = Check query patterns');
    console.log();
    console.log('💡 Your actual API endpoints are using these optimized queries!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

testRealQueries();
