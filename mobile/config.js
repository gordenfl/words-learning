/**
 * 应用配置文件
 * 所有可配置的参数集中管理
 */

// 获取本机IP地址的帮助信息
// macOS/Linux: ifconfig | grep "inet " | grep -v 127.0.0.1
// Windows: ipconfig

// 环境配置：开发 vs 生产
// 直接使用生产服务器（APK 打包后使用）
const Config = {
  // API配置
  API: {
    // 生产环境：外网服务器
    HOST: '54.187.165.95',
    PORT: '3003',
    
    // 自动生成完整的BASE_URL
    get BASE_URL() {
      const url = `http://${this.HOST}:${this.PORT}/api`;
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🌐 API Configuration:');
      console.log('   HOST:', this.HOST);
      console.log('   PORT:', this.PORT);
      console.log('   Full URL:', url);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return url;
    }
  },
  
  // OCR配置
  OCR: {
    TIMEOUT: 30000, // 30秒超时
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  },
  
  // 学习配置
  LEARNING: {
    DEFAULT_DAILY_GOAL: 10,
    DEFAULT_WEEKLY_GOAL: 50,
    DEFAULT_MONTHLY_GOAL: 200,
    DEFAULT_DIFFICULTY: 'intermediate',
  }
};

export default Config;

