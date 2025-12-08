/**
 * Analytics utility for tracking events with Google Analytics 4 and Microsoft Clarity
 */

// Extend Window interface for TypeScript
declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
    dataLayer?: any[];
    clarity?: (...args: any[]) => void;
  }
}

/**
 * Track a custom event in Google Analytics 4
 * @param eventName - The name of the event (e.g., 'click_mastery_start')
 * @param eventParams - Additional parameters for the event
 */
export const trackEvent = (
  eventName: string,
  eventParams?: {
    event_category?: string;
    event_label?: string;
    value?: number;
    [key: string]: any;
  }
) => {
  // Only track in production or if explicitly enabled
  if (typeof window === 'undefined') return;

  // Track with Google Analytics 4
  if (window.gtag) {
    window.gtag('event', eventName, {
      event_category: eventParams?.event_category || 'engagement',
      event_label: eventParams?.event_label,
      value: eventParams?.value,
      ...eventParams,
    });
  }

  // Track with Microsoft Clarity (if available)
  if (window.clarity) {
    window.clarity('event', eventName);
  }

  // Log in development for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('Analytics Event:', eventName, eventParams);
  }
};

/**
 * Track page views (useful for SPA navigation)
 * @param pagePath - The path of the page
 * @param pageTitle - The title of the page
 */
export const trackPageView = (pagePath: string, pageTitle?: string) => {
  if (typeof window === 'undefined') return;

  if (window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '', {
      page_path: pagePath,
      page_title: pageTitle,
    });
  }
};

/**
 * Predefined event tracking functions for common actions
 */
export const analytics = {
  // Hero CTA clicks
  trackStartStudyingClick: () => {
    trackEvent('click_start_studying', {
      event_category: 'conversion',
      event_label: 'hero_cta',
    });
  },

  // Download button clicks
  trackDownloadClick: (source?: string) => {
    trackEvent('click_download', {
      event_category: 'conversion',
      event_label: source || 'download_page',
    });
  },

  // Sign up button clicks
  trackSignUpClick: (source?: string) => {
    trackEvent('click_signup', {
      event_category: 'conversion',
      event_label: source || 'cta_button',
    });
  },

  // Login button clicks
  trackLoginClick: (source?: string) => {
    trackEvent('click_login', {
      event_category: 'engagement',
      event_label: source || 'navigation',
    });
  },

  // Try free button clicks
  trackTryFreeClick: () => {
    trackEvent('click_try_free', {
      event_category: 'conversion',
      event_label: 'cta_button',
    });
  },

  // Quiz generation
  trackQuizGenerate: (topic?: string) => {
    trackEvent('generate_quiz', {
      event_category: 'engagement',
      event_label: topic || 'unknown',
    });
  },

  // Chat message sent
  trackChatMessage: () => {
    trackEvent('send_chat_message', {
      event_category: 'engagement',
      event_label: 'chat',
    });
  },
};


