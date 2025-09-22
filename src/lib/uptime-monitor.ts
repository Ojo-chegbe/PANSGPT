/**
 * Uptime monitoring service to keep Gradio app alive
 * Pings the Gradio app every 15 minutes to prevent it from sleeping
 */

const GRADIO_APP_URL = 'https://ojochegbeng-myembeddingmodel.hf.space';
const PING_INTERVAL = 15 * 60 * 1000; // 15 minutes in milliseconds
let pingInterval: NodeJS.Timeout | null = null;

export function startUptimeMonitoring() {
  if (pingInterval) {
    console.log('Uptime monitoring already started');
    return;
  }

  console.log('🚀 Starting uptime monitoring for Gradio app...');
  
  // Ping immediately
  pingGradioApp();
  
  // Set up regular pings
  pingInterval = setInterval(pingGradioApp, PING_INTERVAL);
  
  console.log(`✅ Uptime monitoring started - pinging every ${PING_INTERVAL / 1000 / 60} minutes`);
}

export function stopUptimeMonitoring() {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
    console.log('🛑 Uptime monitoring stopped');
  }
}

async function pingGradioApp() {
  try {
    const startTime = Date.now();
    
    // Try to connect to the Gradio app
    const response = await fetch(GRADIO_APP_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'PansGPT-UptimeMonitor/1.0'
      },
      // Add a timeout to prevent hanging
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    if (response.ok) {
      console.log(`✅ Gradio app ping successful (${responseTime}ms) - ${new Date().toISOString()}`);
    } else {
      console.log(`⚠️ Gradio app ping returned status ${response.status} (${responseTime}ms) - ${new Date().toISOString()}`);
    }
    
  } catch (error) {
    console.error(`❌ Gradio app ping failed:`, error instanceof Error ? error.message : 'Unknown error');
    
    // If ping fails, try to restart the connection
    console.log('🔄 Attempting to reconnect to Gradio app...');
    try {
      // Try a simple health check
      const healthResponse = await fetch(`${GRADIO_APP_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (healthResponse.ok) {
        console.log('✅ Gradio app health check successful');
      }
    } catch (healthError) {
      console.error('❌ Gradio app health check also failed:', healthError instanceof Error ? healthError.message : 'Unknown error');
    }
  }
}

// Auto-start monitoring when this module is imported
if (typeof window === 'undefined') {
  // Only start on server side
  startUptimeMonitoring();
}
