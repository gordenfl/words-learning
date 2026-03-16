const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/words-learning';

async function updatePassword() {
  try {
    console.log('🔌 连接到 MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 已连接到 MongoDB\n');

    const email = 'gordenfl@gmail.com';
    const newPassword = 'Yi2qiongqiong';

    // 查找用户
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log(`❌ 用户 ${email} 不存在`);
      console.log('\n📋 现有用户列表:');
      const allUsers = await User.find({}, { email: 1, username: 1 });
      allUsers.forEach(u => {
        console.log(`   - ${u.email} (${u.username})`);
      });
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log(`✅ 找到用户: ${user.email} (${user.username})`);
    
    // 哈希新密码
    console.log(`🔐 正在加密新密码...`);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 直接更新密码（绕过 pre-save hook）
    await User.updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword } }
    );

    console.log(`\n✅ 密码已成功更新为: ${newPassword}`);
    console.log(`📧 用户邮箱: ${user.email}`);
    console.log(`👤 用户名: ${user.username}`);
    
    // 验证密码是否正确
    const updatedUser = await User.findById(user._id);
    const isValid = await updatedUser.comparePassword(newPassword);
    console.log(`\n🔍 密码验证: ${isValid ? '✅ 通过' : '❌ 失败'}`);

    await mongoose.connection.close();
    console.log('\n✅ 完成！');
    process.exit(0);
  } catch (error) {
    console.error('❌ 错误:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

updatePassword();
