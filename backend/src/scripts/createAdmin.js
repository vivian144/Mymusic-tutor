require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

const { connectDB, sequelize } = require('../config/database');
require('../models');
const { User } = require('../models');

const createAdmin = async () => {
  try {
    await connectDB();

    const existing = await User.findOne({ where: { email: 'admin@mymusictutor.in' } });
    if (existing) {
      console.log('Admin already exists:', existing.email);
      return;
    }

    const admin = await User.create({
      fullName: 'MyMusic Admin',
      email: 'admin@mymusictutor.in',
      password: 'Admin@MMT2026#',
      phone: '9999999999',
      role: 'admin'
    });

    console.log('Admin created successfully!');
    console.log('  Email:', admin.email);
    console.log('  ID   :', admin.id);
  } catch (err) {
    console.error('Error creating admin:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('Database connection closed.');
  }
};

createAdmin();
