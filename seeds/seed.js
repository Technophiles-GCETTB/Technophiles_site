require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const User = require('../models/User');
const Event = require('../models/Event');
const { Hackathon } = require('../models/Hackathon');
const { Course, Module, Roadmap } = require('../models/Course');
const { Quiz } = require('../models/Quiz');
const { Sponsor } = require('../models/index');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/technophiles';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Event.deleteMany({}),
      Hackathon.deleteMany({}),
      Course.deleteMany({}),
      Module.deleteMany({}),
      Quiz.deleteMany({}),
      Sponsor.deleteMany({}),
      Roadmap.deleteMany({}),
    ]);
    console.log('🗑  Cleared existing data');

    // ─── Create Users ─────────────────────────────────────────────────────────
    const users = await User.create([
      {
        name: 'Super Admin',
        email: 'superadmin@gcettb.ac.in',
        password: 'Admin@123',
        role: 'superadmin',
        points: 5000,
        badges: ['👑', '💎', '🥇'],
        isEmailVerified: true,
        college: 'GCETTB',
        branch: 'CSE',
        year: 4,
      },
      {
        name: 'Admin User',
        email: 'admin@gcettb.ac.in',
        password: 'Admin@123',
        role: 'admin',
        points: 2000,
        badges: ['💎', '🥇'],
        isEmailVerified: true,
        college: 'GCETTB',
        branch: 'CSE',
        year: 3,
      },
      {
        name: 'Rahul Sharma',
        email: 'rahul@gcettb.ac.in',
        password: 'Student@123',
        role: 'internal',
        points: 850,
        badges: ['🥇'],
        isEmailVerified: true,
        college: 'GCETTB',
        branch: 'CSE',
        year: 2,
        github: 'https://github.com/rahulsharma',
      },
      {
        name: 'Priya Patel',
        email: 'priya@gcettb.ac.in',
        password: 'Student@123',
        role: 'internal',
        points: 620,
        badges: ['🥈'],
        isEmailVerified: true,
        college: 'GCETTB',
        branch: 'ECE',
        year: 3,
      },
      {
        name: 'Amit Kumar',
        email: 'amit@gcettb.ac.in',
        password: 'Student@123',
        role: 'internal',
        points: 340,
        badges: ['🥉'],
        isEmailVerified: true,
        college: 'GCETTB',
        branch: 'ME',
        year: 2,
      },
      {
        name: 'Event Admin',
        email: 'eventadmin@gcettb.ac.in',
        password: 'Admin@123',
        role: 'event_admin',
        points: 150,
        isEmailVerified: true,
        college: 'GCETTB',
        branch: 'IT',
        year: 4,
      },
      {
        name: 'Volunteer Raj',
        email: 'volunteer@gcettb.ac.in',
        password: 'Admin@123',
        role: 'volunteer',
        points: 80,
        isEmailVerified: true,
        college: 'GCETTB',
        branch: 'CSE',
        year: 1,
      },
      {
        name: 'Judge Expert',
        email: 'judge@techcorp.com',
        password: 'Judge@123',
        role: 'judge',
        points: 0,
        isEmailVerified: true,
      },
      {
        name: 'External User',
        email: 'user@gmail.com',
        password: 'User@123',
        role: 'external',
        points: 0,
        isEmailVerified: true,
      },
    ]);
    console.log(`👥 Created ${users.length} users`);
    const [superadmin, admin, rahul, priya, amit, eventAdmin, volunteer, judge, externalUser] = users;

    // ─── Create Sponsors ──────────────────────────────────────────────────────
    const sponsors = await Sponsor.create([
      { name: 'TechCorp India', tier: 'title', website: 'https://techcorp.in', description: 'Leading tech company powering innovation', isActive: true },
      { name: 'CloudVault', tier: 'gold', website: 'https://cloudvault.io', isActive: true },
      { name: 'DevTools Pro', tier: 'silver', website: 'https://devtoolspro.com', isActive: true },
      { name: 'OpenSource Hub', tier: 'community', website: 'https://oshub.org', isActive: true },
    ]);
    console.log(`🤝 Created ${sponsors.length} sponsors`);

    // ─── Create Events ────────────────────────────────────────────────────────
    const now = new Date();
    const events = await Event.create([
      {
        title: 'Web Development Workshop',
        description: 'A hands-on workshop covering HTML, CSS, JavaScript and React fundamentals. Perfect for beginners looking to start their web dev journey.',
        type: 'workshop',
        status: 'published',
        startDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
        venue: 'Computer Lab A-101',
        maxParticipants: 50,
        pointsReward: 25,
        tags: ['web', 'javascript', 'react'],
        isPublic: true,
        createdBy: admin._id,
        participants: [
          { user: rahul._id, registeredAt: new Date() },
          { user: priya._id, registeredAt: new Date() },
          { user: amit._id, registeredAt: new Date() },
        ],
      },
      {
        title: 'AI/ML Seminar 2024',
        description: 'Explore the latest in artificial intelligence and machine learning. Industry experts will share insights on real-world applications of AI.',
        type: 'seminar',
        status: 'published',
        startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        isVirtual: true,
        meetingLink: 'https://meet.google.com/abc-defg-hij',
        maxParticipants: 200,
        pointsReward: 20,
        tags: ['ai', 'ml', 'data-science'],
        isPublic: true,
        createdBy: admin._id,
        participants: [{ user: rahul._id, registeredAt: new Date() }],
      },
      {
        title: 'Competitive Programming Contest',
        description: 'Test your DSA skills in this timed competitive programming contest. Problems range from easy to hard. Top performers win prizes!',
        type: 'competition',
        status: 'published',
        startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
        venue: 'Main Auditorium',
        maxParticipants: 100,
        pointsReward: 50,
        tags: ['dsa', 'competitive-programming', 'algorithms'],
        isPublic: false,
        createdBy: eventAdmin._id,
      },
      {
        title: 'Open Source Contribution Meetup',
        description: 'Join fellow developers for an afternoon of open source contributions. Bring your laptops and contribute to real projects!',
        type: 'meetup',
        status: 'published',
        startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        venue: 'Innovation Hub',
        maxParticipants: 30,
        pointsReward: 30,
        tags: ['open-source', 'git', 'collaboration'],
        isPublic: true,
        createdBy: superadmin._id,
        participants: [
          { user: rahul._id, registeredAt: new Date(), attended: true, attendedAt: new Date() },
          { user: priya._id, registeredAt: new Date(), attended: true, attendedAt: new Date() },
        ],
      },
    ]);
    console.log(`📅 Created ${events.length} events`);

    // ─── Create Hackathon ─────────────────────────────────────────────────────
    const hackathon = await Hackathon.create({
      title: 'HackTech 2024',
      tagline: 'Build. Innovate. Disrupt.',
      description: 'The biggest hackathon of the year! Build innovative solutions to real-world problems in 24 hours. Open to all students.',
      status: 'registration_open',
      registrationStart: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      registrationEnd: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      hackathonStart: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
      hackathonEnd: new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000),
      submissionDeadline: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000 + 22 * 60 * 60 * 1000),
      venue: 'GCETTB Campus',
      maxTeamSize: 4,
      minTeamSize: 2,
      maxTeams: 30,
      pointsReward: 200,
      prizes: [
        { position: '1st Place', amount: '₹50,000', description: 'Cash prize + Trophy + Internship opportunity' },
        { position: '2nd Place', amount: '₹25,000', description: 'Cash prize + Trophy' },
        { position: '3rd Place', amount: '₹10,000', description: 'Cash prize + Certificate' },
      ],
      problemStatements: [
        { title: 'Smart Campus Solution', description: 'Build an app to improve campus life experience', domain: 'EdTech' },
        { title: 'Healthcare for Rural India', description: 'Technology solution for healthcare access in rural areas', domain: 'HealthTech' },
        { title: 'Sustainable Agriculture', description: 'AI-powered solution for precision farming', domain: 'AgriTech' },
      ],
      rules: [
        'Team size: 2-4 members',
        'All code must be written during the hackathon',
        'Open source libraries and APIs are allowed',
        'Submission must include GitHub link and demo',
        'Decision of judges is final',
      ],
      judges: [judge._id],
      sponsors: [sponsors[0]._id, sponsors[1]._id],
      isPublic: true,
      createdBy: superadmin._id,
    });
    console.log('⚡ Created hackathon');

    // ─── Create Courses ───────────────────────────────────────────────────────
    const course1 = await Course.create({
      title: 'Complete Web Development Bootcamp',
      description: 'Master HTML, CSS, JavaScript, React, Node.js, and MongoDB. Build 10+ real projects from scratch. From zero to full-stack developer!',
      category: 'web_dev',
      level: 'beginner',
      status: 'published',
      tags: ['html', 'css', 'javascript', 'react', 'nodejs'],
      prerequisites: ['Basic computer knowledge', 'Willingness to learn'],
      learningOutcomes: [
        'Build responsive websites with HTML and CSS',
        'Create interactive UIs with JavaScript and React',
        'Develop REST APIs with Node.js and Express',
        'Work with MongoDB databases',
        'Deploy web applications to the cloud',
      ],
      estimatedDuration: 40,
      pointsReward: 100,
      accessLevel: 'internal_only',
      enrolledCount: 45,
      createdBy: admin._id,
    });

    const course2 = await Course.create({
      title: 'Data Structures & Algorithms Masterclass',
      description: 'Comprehensive coverage of all DSA topics needed for competitive programming and technical interviews. 200+ problems with detailed solutions.',
      category: 'dsa',
      level: 'intermediate',
      status: 'published',
      tags: ['arrays', 'trees', 'graphs', 'dynamic-programming'],
      prerequisites: ['Basic programming knowledge', 'Any programming language'],
      learningOutcomes: [
        'Master arrays, linked lists, stacks, and queues',
        'Understand tree and graph algorithms',
        'Solve dynamic programming problems',
        'Crack technical interviews at top companies',
      ],
      estimatedDuration: 60,
      pointsReward: 150,
      accessLevel: 'internal_only',
      enrolledCount: 32,
      createdBy: admin._id,
    });

    const course3 = await Course.create({
      title: 'Introduction to Machine Learning',
      description: 'Start your AI journey with this beginner-friendly ML course. Learn Python, NumPy, Pandas, Scikit-learn and build your first ML models.',
      category: 'ai_ml',
      level: 'beginner',
      status: 'published',
      tags: ['python', 'ml', 'scikit-learn', 'data-science'],
      learningOutcomes: [
        'Understand ML fundamentals and algorithms',
        'Work with Python data science libraries',
        'Build and evaluate ML models',
        'Apply ML to real-world problems',
      ],
      estimatedDuration: 30,
      pointsReward: 80,
      accessLevel: 'all',
      enrolledCount: 78,
      createdBy: superadmin._id,
    });

    // Create modules for course1
    const modules1 = await Module.create([
      { title: 'Introduction to HTML', description: 'Learn HTML basics', course: course1._id, order: 1, type: 'video', content: { videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 45 }, pointsReward: 5 },
      { title: 'CSS Fundamentals', description: 'Style your pages', course: course1._id, order: 2, type: 'video', content: { videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 60 }, pointsReward: 5 },
      { title: 'JavaScript Basics', description: 'Programming fundamentals', course: course1._id, order: 3, type: 'video', content: { videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 90 }, pointsReward: 10 },
      { title: 'React Introduction', description: 'Modern UI development', course: course1._id, order: 4, type: 'video', content: { videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 75 }, pointsReward: 10 },
      { title: 'Node.js & Express', description: 'Server-side development', course: course1._id, order: 5, type: 'video', content: { videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', duration: 80 }, pointsReward: 10 },
    ]);
    console.log(`📚 Created 3 courses with ${modules1.length} modules`);

    // ─── Create Roadmap ───────────────────────────────────────────────────────
    await Roadmap.create({
      title: 'Full Stack Web Developer',
      description: 'Become a complete web developer from scratch. Follow this structured path to master frontend and backend development.',
      category: 'Web Development',
      icon: '🌐',
      color: '#39FF14',
      steps: [
        { order: 1, title: 'Learn HTML & CSS', description: 'Foundation of web development', course: course1._id },
        { order: 2, title: 'Master JavaScript', description: 'Core programming language of the web', course: course1._id },
        { order: 3, title: 'React Framework', description: 'Modern frontend development', course: course1._id },
        { order: 4, title: 'Node.js Backend', description: 'Server-side development', course: course1._id },
        { order: 5, title: 'DSA for Interviews', description: 'Crack technical interviews', course: course2._id },
      ],
      createdBy: superadmin._id,
    });

    // ─── Create Quiz ──────────────────────────────────────────────────────────
    await Quiz.create({
      title: 'JavaScript Fundamentals Quiz',
      description: 'Test your knowledge of JavaScript basics including variables, functions, and DOM manipulation.',
      duration: 20,
      maxAttempts: 2,
      pointsReward: 30,
      accessLevel: 'internal_only',
      status: 'published',
      shuffleQuestions: true,
      shuffleOptions: true,
      showResultImmediately: true,
      createdBy: admin._id,
      questions: [
        {
          question: 'Which of the following is the correct way to declare a variable in modern JavaScript?',
          options: [
            { text: 'var x = 5', isCorrect: false },
            { text: 'let x = 5', isCorrect: true },
            { text: 'int x = 5', isCorrect: false },
            { text: 'dim x = 5', isCorrect: false },
          ],
          marks: 2,
          explanation: 'let and const are preferred in modern JavaScript (ES6+). var has function scope while let has block scope.',
          difficulty: 'easy',
        },
        {
          question: 'What will "typeof null" return in JavaScript?',
          options: [
            { text: '"null"', isCorrect: false },
            { text: '"undefined"', isCorrect: false },
            { text: '"object"', isCorrect: true },
            { text: '"string"', isCorrect: false },
          ],
          marks: 2,
          explanation: 'typeof null returns "object" - this is a well-known JavaScript quirk/bug that has been retained for backward compatibility.',
          difficulty: 'medium',
        },
        {
          question: 'Which array method creates a new array with elements that pass a test?',
          options: [
            { text: 'map()', isCorrect: false },
            { text: 'filter()', isCorrect: true },
            { text: 'reduce()', isCorrect: false },
            { text: 'forEach()', isCorrect: false },
          ],
          marks: 2,
          explanation: 'filter() creates a new array with all elements that pass the test implemented by the provided function.',
          difficulty: 'easy',
        },
        {
          question: 'What is the output of: console.log(0.1 + 0.2 === 0.3)?',
          options: [
            { text: 'true', isCorrect: false },
            { text: 'false', isCorrect: true },
            { text: 'undefined', isCorrect: false },
            { text: 'NaN', isCorrect: false },
          ],
          marks: 3,
          explanation: 'Due to floating-point precision, 0.1 + 0.2 = 0.30000000000000004, not exactly 0.3.',
          difficulty: 'hard',
        },
        {
          question: 'What does the "=>" symbol represent in JavaScript?',
          options: [
            { text: 'Comparison operator', isCorrect: false },
            { text: 'Arrow function', isCorrect: true },
            { text: 'Assignment operator', isCorrect: false },
            { text: 'Logical operator', isCorrect: false },
          ],
          marks: 1,
          explanation: '=>  is the arrow function syntax introduced in ES6. Example: const add = (a, b) => a + b;',
          difficulty: 'easy',
        },
      ],
    });
    console.log('🧠 Created quiz');

    console.log('\n✅ Seed complete!\n');
    console.log('📋 LOGIN CREDENTIALS:');
    console.log('─────────────────────────────────────────');
    console.log('Super Admin:  superadmin@gcettb.ac.in / Admin@123');
    console.log('Admin:        admin@gcettb.ac.in / Admin@123');
    console.log('Student:      rahul@gcettb.ac.in / Student@123');
    console.log('Event Admin:  eventadmin@gcettb.ac.in / Admin@123');
    console.log('Volunteer:    volunteer@gcettb.ac.in / Admin@123');
    console.log('Judge:        judge@techcorp.com / Judge@123');
    console.log('External:     user@gmail.com / User@123');
    console.log('─────────────────────────────────────────\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
