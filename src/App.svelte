<script>
  import { Router, Route } from 'svelte-routing';
  import Dashboard from './pages/Dashboard.svelte';
  import SampleDetail from './pages/SampleDetail.svelte';
</script>

<Router>
  <div class="app-container">
    <header class="app-header">
      <h1>实验室样本复核趋势看板</h1>
      <div class="header-info">
        <span class="env-badge">内网桌面版</span>
      </div>
    </header>
    <main class="app-main">
      <Route path="/" component={Dashboard} />
      <Route path="/sample/:id" component={SampleDetail} />
    </main>
  </div>
</Router>

<style>
  .app-container {
    min-height: 100vh;
    background: #f0f2f5;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  }
  .app-header {
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
    color: white;
    padding: 16px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
  .app-header h1 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
  }
  .env-badge {
    background: rgba(255, 255, 255, 0.2);
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 12px;
  }
  .app-main {
    padding: 20px;
  }
</style>
