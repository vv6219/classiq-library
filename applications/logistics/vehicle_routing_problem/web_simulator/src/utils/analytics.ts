/**
 * Google Analytics 4 (GA4) Dispatcher and Tracker Utility
 * WMS Quantum Digital Twin 3D Simulator | YesAndNo Quantum Team
 */

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
    GA_MEASUREMENT_ID?: string;
  }
}

export const DEFAULT_GA_MEASUREMENT_ID =
  (typeof window !== 'undefined' && window.GA_MEASUREMENT_ID) ||
  (import.meta as any).env?.VITE_GA_MEASUREMENT_ID ||
  'G-F12EXNTLY3';

/**
 * Dispatches an event to Google Analytics 4 via window.gtag and window.dataLayer.
 * Resilient against ad-blockers and offline states.
 */
export function trackEvent(
  eventName: string,
  eventParams: Record<string, any> = {}
): void {
  try {
    const enrichedParams = {
      timestamp: new Date().toISOString(),
      facility_id: 'WMS-IND-01',
      app_name: 'WMS Quantum Digital Twin',
      ...eventParams,
    };

    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', eventName, enrichedParams);
    } else if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: eventName,
        ...enrichedParams,
      });
    }

    if ((import.meta as any).env?.DEV) {
      console.log(`%c[GA4 Event] ${eventName}`, 'color: #00f0ff; font-weight: bold;', enrichedParams);
    }
  } catch (err) {
    console.warn('[GA4 Analytics] Failed to track event:', eventName, err);
  }
}

/**
 * Track user clicking a top-level action button
 */
export function trackButtonClick(
  buttonName: string,
  category: string = 'TopLevel_HUD',
  extraParams?: Record<string, any>
): void {
  trackEvent('button_click', {
    button_name: buttonName,
    event_category: category,
    ...extraParams,
  });
}

/**
 * Track user clicking an external or internal navigation link
 */
export function trackLinkClick(
  url: string,
  linkName: string,
  extraParams?: Record<string, any>
): void {
  trackEvent('link_click', {
    link_url: url,
    link_name: linkName,
    event_category: 'TopLevel_Link',
    ...extraParams,
  });
}

/**
 * Track user clicking a Telegram community link with conversion attribution
 */
export function trackTelegramClick(
  placement: string = 'TopbarHUD',
  extraParams?: Record<string, any>
): void {
  trackEvent('telegram_join_click', {
    channel: 'yesandnoQ',
    channel_url: 'https://t.me/yesandnoQ',
    placement,
    event_category: 'Community_Conversion',
    event_label: `Telegram_Join_${placement}`,
    ...extraParams,
  });

  trackLinkClick('https://t.me/yesandnoQ', `Telegram_Channel_${placement}`, {
    outbound: true,
    channel: 'yesandnoQ',
    placement,
    ...extraParams,
  });
}

/**
 * Track user switching between the 8 studio navigation tabs
 */
export function trackTabChange(
  fromTab: string,
  toTab: string,
  extraParams?: Record<string, any>
): void {
  trackEvent('studio_tab_switch', {
    from_tab: fromTab,
    to_tab: toTab,
    active_studio: toTab,
    event_category: 'Navigation_Studio_Tabs',
    ...extraParams,
  });
}

/**
 * Track solver mode toggle (CLASSICAL vs QUANTUM)
 */
export function trackModeToggle(
  fromMode: string,
  toMode: string
): void {
  trackEvent('mode_toggle', {
    previous_mode: fromMode,
    new_mode: toMode,
    event_category: 'TopLevel_HUD',
  });
}

/**
 * Track historical execution run selection from dropdown
 */
export function trackHistoricalRunSelect(runId: string): void {
  trackEvent('historical_run_select', {
    selected_run_id: runId,
    event_category: 'TopLevel_HUD',
  });
}

/**
 * Track modal or drawer open event
 */
export function trackModalOpen(
  modalName: string,
  category: string = 'TopLevel_Modal'
): void {
  trackEvent('modal_open', {
    modal_name: modalName,
    event_category: category,
  });
}

/**
 * In-memory telemetry counter for sidebar entry points visited in current session
 */
const sidebarEntryCounts: Record<string, number> = {};

/**
 * Returns a snapshot of sidebar entry point navigation statistics
 */
export function getSidebarEntryStats(): Record<string, number> {
  return { ...sidebarEntryCounts };
}

export interface TrackSidebarNavigationParams {
  routePath: string;
  itemId: string;
  itemLabel: string;
  menuLevel: 1 | 2 | 3;
  pillarId?: string;
  pillarTitle?: string;
  pageTitle?: string;
  entryMethod?: 'sidebar_click' | 'direct_url' | 'browser_history' | 'quick_action' | 'sitemap_link' | 'llm_entry';
  extraParams?: Record<string, any>;
}

/**
 * Dedicated Google Analytics 4 counter for each sidebar menu & sub-menu entry point.
 * Dispatches both a specialized 'sidebar_entry_point_click' event and a standard 'page_view'
 * to ensure complete analytics attribution in Google Analytics 4 dashboards.
 */
export function trackSidebarNavigation(params: TrackSidebarNavigationParams): void {
  const {
    routePath,
    itemId,
    itemLabel,
    menuLevel,
    pillarId = 'general',
    pillarTitle = 'Navigation',
    pageTitle = itemLabel,
    entryMethod = 'sidebar_click',
    extraParams = {},
  } = params;

  // 1. Increment in-memory counter
  sidebarEntryCounts[itemId] = (sidebarEntryCounts[itemId] || 0) + 1;
  const visitCount = sidebarEntryCounts[itemId];

  // 2. Dispatch dedicated entry point counter event
  trackEvent('sidebar_entry_point_click', {
    route_path: routePath,
    item_id: itemId,
    item_label: itemLabel,
    menu_level: menuLevel,
    pillar_id: pillarId,
    pillar_title: pillarTitle,
    entry_method: entryMethod,
    session_item_visit_count: visitCount,
    event_category: 'Sidebar_Navigation_Hierarchy',
    event_label: `[L${menuLevel}] ${itemLabel} (${routePath})`,
    ...extraParams,
  });

  // 3. Dispatch standard virtual page_view / screen_view to GA4 for page performance tracking
  if (typeof window !== 'undefined') {
    const canonicalUrl = `${window.location.origin}${routePath}`;
    trackEvent('page_view', {
      page_title: pageTitle,
      page_location: canonicalUrl,
      page_path: routePath,
      screen_name: itemLabel,
      entry_method: entryMethod,
      event_category: 'Virtual_Page_View',
    });
  }
}
