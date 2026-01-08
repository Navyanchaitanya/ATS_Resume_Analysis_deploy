const { User } = require('../models');
const bcrypt = require('bcryptjs');

const createAdmin = async () => {
  try {
    // Find your user by email
    const userEmail = 'adminlucky@gmail.com.in'; // Change this to your email
    
    const user = await User.findOne({ where: { email: userEmail } });
    
    if (!user) {
      console.log('User not found. Please use an existing user email.');
      return;
    }
    
    // Update to admin
    user.is_admin = true;
    user.admin_role = 'super_admin';
    await user.save();
    
    console.log(`User ${userEmail} is now a super admin!`);
    console.log('You can now login at: POST /api/admin/login');
  } catch (error) {
    console.error('Error creating admin:', error);
  }
};

createAdmin();