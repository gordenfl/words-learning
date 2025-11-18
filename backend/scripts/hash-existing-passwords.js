/**
 * 迁移脚本：将数据库中明文保存的密码哈希化
 * 
 * 使用方法：
 * node scripts/hash-existing-passwords.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// 连接 MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/words-learning';

async function hashExistingPasswords() {
  try {
    console.log('🔌 连接到 MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 已连接到 MongoDB\n');

    // 查找所有用户
    const users = await User.find({});
    console.log(`📊 找到 ${users.length} 个用户\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const user of users) {
      // 跳过没有密码的用户（OAuth 用户可能没有密码）
      if (!user.password || user.password.trim().length === 0) {
        console.log(`⏭️  跳过用户 ${user.email} (没有密码)`);
        skippedCount++;
        continue;
      }

      // 检查密码是否已经是哈希格式
      // bcrypt 哈希通常以 $2a$, $2b$, $2y$ 开头，长度约 60 字符
      const isHashed = 
        (user.password.startsWith('$2a$') || 
         user.password.startsWith('$2b$') || 
         user.password.startsWith('$2y$')) &&
        user.password.length >= 60;

      if (isHashed) {
        console.log(`✅ 用户 ${user.email} 的密码已经是哈希格式，跳过`);
        skippedCount++;
        continue;
      }

      // 密码是明文，需要哈希
      console.log(`🔐 正在哈希用户 ${user.email} 的密码...`);
      
      try {
        // 使用 bcrypt 哈希密码（salt rounds = 10，与 User 模型一致）
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);

        // 直接更新密码（绕过 pre-save hook，因为我们已经哈希过了）
        await User.updateOne(
          { _id: user._id },
          { $set: { password: hashedPassword } }
        );

        console.log(`   ✅ 已更新用户 ${user.email} 的密码`);
        updatedCount++;
      } catch (error) {
        console.error(`   ❌ 更新用户 ${user.email} 的密码时出错:`, error.message);
        errorCount++;
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 迁移完成统计:');
    console.log(`   ✅ 已更新: ${updatedCount} 个用户`);
    console.log(`   ⏭️  已跳过: ${skippedCount} 个用户`);
    console.log(`   ❌ 错误: ${errorCount} 个用户`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 关闭连接
    await mongoose.connection.close();
    console.log('✅ 数据库连接已关闭');
    process.exit(0);
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// 运行迁移
hashExistingPasswords();

