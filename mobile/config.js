/**
 * 应用配置文件
 * 所有可配置的参数集中管理
 */

// 获取本机IP地址的帮助信息
// macOS/Linux: ifconfig | grep "inet " | grep -v 127.0.0.1
// Windows: ipconfig

const Config = {
  // API配置
  API: {
    // 修改这里的IP地址为你的电脑IP
    // 如果在iOS模拟器运行，使用 'localhost'
    // 如果在Android模拟器运行，使用 '10.0.2.2'
    // 如果在物理设备运行，使用你的电脑局域网IP
    HOST: '192.168.101.95',
    PORT: '3000',
    
    // 自动生成完整的BASE_URL
    get BASE_URL() {
      return `http://${this.HOST}:${this.PORT}/api`;
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

