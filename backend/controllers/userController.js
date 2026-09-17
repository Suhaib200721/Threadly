const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Helper: return user data without sensitive fields
function safeUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

// ─────────────────────────────────────────────
// GET /api/users/profile (protected)
// ─────────────────────────────────────────────
const getUserProfile = async (req, res) => {
  try {
    // Identify user strictly from verified token
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({
      user: safeUser(user),
    });
  } catch (error) {
    console.error('getUserProfile error:', error.message);
    res.status(500).json({ message: 'Server error. Failed to retrieve profile.' });
  }
};

// ─────────────────────────────────────────────
// PUT /api/users/profile (protected)
// ─────────────────────────────────────────────
const updateUserProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    // 1. Validate name
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name cannot be empty.' });
    }

    // 2. Validate email
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email cannot be empty.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 3. Check if email is already taken by another account
    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: req.user.userId },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    // 4. Fetch current user
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // 5. Update permitted fields only (NEVER allow role modification)
    user.name = name.trim();
    user.email = normalizedEmail;

    await user.save();

    res.status(200).json({
      message: 'Profile updated successfully.',
      user: safeUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }
    console.error('updateUserProfile error:', error.message);
    res.status(500).json({ message: 'Server error. Failed to update profile.' });
  }
};

// ─────────────────────────────────────────────
// PUT /api/users/change-password (protected)
// ─────────────────────────────────────────────
const changeUserPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // 1. Validate all fields required
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: 'Current password, new password, and confirmation are required.',
      });
    }

    // 2. Validate password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: 'New password and confirmation do not match.',
      });
    }

    // 3. Validate new password length (minimum 6 characters)
    if (newPassword.length < 6) {
      return res.status(400).json({
        message: 'New password must be at least 6 characters long.',
      });
    }

    // 4. Fetch user including password field (select: false in schema)
    const user = await User.findById(req.user.userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // 5. Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: 'Current password is incorrect.',
      });
    }

    // 6. Hash new password and save
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({
      message: 'Password changed successfully.',
    });
  } catch (error) {
    console.error('changeUserPassword error:', error.message);
    res.status(500).json({ message: 'Server error. Failed to change password.' });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
};
