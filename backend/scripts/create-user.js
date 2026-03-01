const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://photoshare-mongodb:27017/words-learning';

async function createUser() {
  try {
    console.log('🔌 连接到 MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 已连接到 MongoDB\n');

    const email = 'gordenfl@gmail.com';
    const password = 'Yi2qiongqiong';
    const username = 'gordenfl';

    // 检查用户是否已存在
    const existingUser = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { username }] 
    });
    
    if (existingUser) {
      console.log(`⚠️  用户已存在:`);
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Username: ${existingUser.username}`);
      
      // 更新密码
      console.log(`\n🔐 正在更新密码...`);
      existingUser.password = password; // 会通过 pre-save hook 自动加密
      await existingUser.save();
      
      console.log(`✅ 密码已更新为: ${password}`);
      
      // 验证密码
      const isValid = await existingUser.comparePassword(password);
      console.log(`🔍 密码验证: ${isValid ? '✅ 通过' : '❌ 失败'}`);
    } else {
      // 创建新用户
      console.log(`📝 创建新用户...`);
      const user = new User({
        username,
        email: email.toLowerCase(),
        password, // 会通过 pre-save hook 自动加密
      });

      await user.save();
      console.log(`✅ 用户创建成功!`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Password: ${password}`);
      
      // 验证密码
      const isValid = await user.comparePassword(password);
      console.log(`\n🔍 密码验证: ${isValid ? '✅ 通过' : '❌ 失败'}`);
    }

    await mongoose.connection.close();
    console.log('\n✅ 完成！');
    process.exit(0);
  } catch (error) {
    console.error('❌ 错误:', error.message);
    if (error.code === 11000) {
      console.error('   用户已存在（唯一性约束冲突）');
    }
    await mongoose.connection.close();
    process.exit(1);
  }
}

createUser();
