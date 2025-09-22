/**
 * Server component to start uptime monitoring
 * This runs on the server side to keep the Gradio app alive
 */

import { startUptimeMonitoring } from '@/lib/uptime-monitor';

// This component doesn't render anything, it just starts the monitoring
export default function UptimeMonitor() {
  // Start uptime monitoring when this component is loaded
  startUptimeMonitoring();
  
  // Return null since this is just for side effects
  return null;
}
