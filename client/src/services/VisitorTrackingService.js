// Generate a visitor ID and store in localStorage
const generateVisitorId = () => {
  const randomId = Math.random().toString(36).substring(2, 15);
  const timestamp = Date.now().toString(36);
  return `v_${randomId}${timestamp}`;
};

class VisitorTrackingService {
  constructor() {
    this.visitorId = this.getOrCreateVisitorId();
    this.sessionId = this.createSessionId();
    this.apiEndpoint = `${import.meta.env.VITE_SERVER_URL}/visitors/track`;
    this.currentPage = window.location.pathname;
    this.lastActivity = Date.now();
  }

  getOrCreateVisitorId() {
    try {
      let visitorId = localStorage.getItem('landivo_visitor_id');
      if (!visitorId) {
        visitorId = generateVisitorId();
        localStorage.setItem('landivo_visitor_id', visitorId);
      }
      return visitorId;
    } catch (e) {
      return generateVisitorId();
    }
  }

  createSessionId() {
    return `s_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  startTracking() {
    this.trackPageView();
    
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    
    // Heartbeat every 5 minutes
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 5 * 60 * 1000);
  }

  stopTracking() {
    window.removeEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }

  trackPageView(page = window.location.pathname) {
    this.currentPage = page;
    this.lastActivity = Date.now();
    
    fetch(this.apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId: this.visitorId,
        sessionId: this.sessionId,
        page,
        referrer: document.referrer || null,
        screenSize: `${window.innerWidth}x${window.innerHeight}`
      }),
      keepalive: true
    }).catch(err => console.error('Tracking error:', err));
  }

  sendHeartbeat() {
    fetch(this.apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId: this.visitorId,
        sessionId: this.sessionId,
        page: this.currentPage,
        heartbeat: true
      })
    }).catch(err => console.error('Heartbeat error:', err));
  }

  handleBeforeUnload() {
    const endTime = new Date().toISOString();
    
    navigator.sendBeacon(this.apiEndpoint, JSON.stringify({
      visitorId: this.visitorId,
      sessionId: this.sessionId,
      page: this.currentPage,
      previousSessionEnd: endTime
    }));
  }
}

// Create singleton instance
const visitorTracking = new VisitorTrackingService();

export default visitorTracking;