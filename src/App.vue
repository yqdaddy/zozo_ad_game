<script>
export default {
  onLaunch() {
    console.log('数学工具集合启动')
  },
  onShow() {
    console.log('App Show')
  },
  onHide() {
    console.log('App Hide')
  }
}
</script>

<style>
/* 全局样式 */
page {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 通用变量 */
:root {
  --primary-color: #4CAF50;
  --primary-dark: #388E3C;
  --secondary-color: #2196F3;
  --danger-color: #f44336;
  --gold-color: #FFD700;
  --bg-dark: #1a1a2e;
  --bg-card: #16213e;
  --text-light: #ffffff;
  --text-muted: #a0a0a0;
}
</style>
