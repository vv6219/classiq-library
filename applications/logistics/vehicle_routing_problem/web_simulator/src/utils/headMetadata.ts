/**
 * Dynamic HTML Head Metadata Manager
 * Updates document.title, meta descriptions, canonical links, and OpenGraph/Twitter tags
 * for SEO, browser history clarity, and social sharing.
 *
 * WMS Quantum Digital Twin 3D Simulator | YesAndNo Group
 */

export interface PageMetadataSpec {
  title: string;
  description: string;
  keywords?: string[];
  canonicalPath?: string;
  ogType?: string;
  ogImage?: string;
}

const BASE_URL = 'https://acoustic-architect-3cgfo.web.app';
const DEFAULT_IMAGE = `${BASE_URL}/logo_brand.png`;
const SITE_NAME = 'Quantum WMS 3D Digital Twin | YesAndNo Group';

function setMetaTag(nameOrProperty: 'name' | 'property', attrValue: string, content: string): void {
  if (typeof document === 'undefined') return;
  let element = document.querySelector(`meta[${nameOrProperty}="${attrValue}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(nameOrProperty, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setCanonicalLink(url: string): void {
  if (typeof document === 'undefined') return;
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

/**
 * Dynamically updates head tags on route navigation or tab switch
 */
export function updatePageMetadata(spec: PageMetadataSpec): void {
  if (typeof document === 'undefined') return;

  const fullTitle = spec.title.includes('YesAndNo Group')
    ? spec.title
    : `${spec.title} | ${SITE_NAME}`;

  // 1. Browser Tab Title
  document.title = fullTitle;

  // 2. Primary Meta Description
  setMetaTag('name', 'description', spec.description);

  // 3. Keywords
  if (spec.keywords && spec.keywords.length > 0) {
    const combinedKeywords = Array.from(
      new Set([
        ...spec.keywords,
        'Quantum Computing',
        'Classiq',
        'VRP',
        'WMS',
        'Digital Twin',
        'YesAndNo Group',
      ])
    ).join(', ');
    setMetaTag('name', 'keywords', combinedKeywords);
  }

  // 4. Canonical URL
  const canonicalPath = spec.canonicalPath || (typeof window !== 'undefined' ? window.location.pathname : '/');
  const fullCanonicalUrl = canonicalPath.startsWith('http')
    ? canonicalPath
    : `${BASE_URL}${canonicalPath === '/' ? '' : canonicalPath}`;
  setCanonicalLink(fullCanonicalUrl);

  // 5. OpenGraph (Facebook, LinkedIn, Telegram)
  setMetaTag('property', 'og:title', fullTitle);
  setMetaTag('property', 'og:description', spec.description);
  setMetaTag('property', 'og:url', fullCanonicalUrl);
  setMetaTag('property', 'og:type', spec.ogType || 'website');
  setMetaTag('property', 'og:image', spec.ogImage || DEFAULT_IMAGE);

  // 6. Twitter / X Card
  setMetaTag('name', 'twitter:title', fullTitle);
  setMetaTag('name', 'twitter:description', spec.description);
  setMetaTag('name', 'twitter:image', spec.ogImage || DEFAULT_IMAGE);
}
