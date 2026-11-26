// Native Zero-Dependency SEO Helper for Public Homepage & Multi-School EducationalOrganization JSON-LD
import type { PublicPortalConfig, School } from '../../types/domain';
import { OFFICIAL_COMPLEX_NAME_FA, OFFICIAL_SYSTEM_NAME_FA } from '../../core/branding/BrandLogo';

const JSON_LD_SCRIPT_ID = 'golestan-educational-org-jsonld';

export interface PublicPortalSeoParams {
  title: string;
  description: string;
  siteName?: string;
  canonicalUrl?: string;
  complexName?: string;
  complexConfig?: PublicPortalConfig | null;
  schools: School[];
  schoolConfigs?: PublicPortalConfig[];
}

function upsertMetaTag(
  attr: 'name' | 'property',
  key: string,
  content: string
): void {
  if (typeof document === 'undefined') return;
  const selector = `meta[${attr}="${key}"]`;
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonicalLink(href: string): void {
  if (typeof document === 'undefined') return;
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = href;
}

export function buildEducationalOrganizationSchema(params: {
  complexName?: string;
  description: string;
  url: string;
  complexConfig?: PublicPortalConfig | null;
  schools: School[];
  schoolConfigs?: PublicPortalConfig[];
}): Record<string, unknown> {
  const {
    complexName = OFFICIAL_COMPLEX_NAME_FA,
    description,
    url,
    complexConfig,
    schools,
    schoolConfigs = [],
  } = params;

  const configBySchool = new Map(
    schoolConfigs.filter((c) => c.scope === 'school').map((c) => [c.schoolId, c])
  );

  const subOrganizations = schools.map((school) => {
    const cfg = configBySchool.get(school.id);
    const schoolAddress = cfg?.address || school.address || '';
    const schoolPhone = cfg?.phone || school.phone || '';
    return {
      '@type': 'School',
      name: school.name,
      description: cfg?.introText || school.subtitle,
      ...(schoolPhone ? { telephone: schoolPhone } : {}),
      ...(schoolAddress
        ? {
            address: {
              '@type': 'PostalAddress',
              streetAddress: schoolAddress,
              addressCountry: 'IR',
            },
          }
        : {}),
    };
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: complexName,
    alternateName: OFFICIAL_SYSTEM_NAME_FA,
    description,
    url,
    inLanguage: 'fa-IR',
    ...(complexConfig?.phone ? { telephone: complexConfig.phone } : {}),
    ...(complexConfig?.contactEmail ? { email: complexConfig.contactEmail } : {}),
    ...(complexConfig?.address
      ? {
          address: {
            '@type': 'PostalAddress',
            streetAddress: complexConfig.address,
            addressCountry: 'IR',
          },
        }
      : {}),
    subOrganization: subOrganizations,
  };
}

export function applyPublicPortalSeo(params: PublicPortalSeoParams): void {
  if (typeof document === 'undefined') return;

  const cleanTitle = params.title.trim() || OFFICIAL_SYSTEM_NAME_FA;
  const cleanDescription =
    params.description.trim() ||
    'سامانه هوشمند مدارس گلستان راه روشن — معرفی مدارس مجموعه، اخبار، افتخارات علمی و ثبت درخواست مشاوره و پیش‌ثبت‌نام.';
  const siteName = params.siteName?.trim() || OFFICIAL_SYSTEM_NAME_FA;
  const resolvedUrl =
    params.canonicalUrl ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : 'https://golestan-school.local/');

  document.title = cleanTitle;
  upsertMetaTag('name', 'description', cleanDescription);
  upsertMetaTag('property', 'og:type', 'website');
  upsertMetaTag('property', 'og:locale', 'fa_IR');
  upsertMetaTag('property', 'og:site_name', siteName);
  upsertMetaTag('property', 'og:title', cleanTitle);
  upsertMetaTag('property', 'og:description', cleanDescription);
  upsertMetaTag('property', 'og:url', resolvedUrl);
  upsertMetaTag('name', 'twitter:card', 'summary_large_image');
  upsertMetaTag('name', 'twitter:title', cleanTitle);
  upsertMetaTag('name', 'twitter:description', cleanDescription);
  upsertCanonicalLink(resolvedUrl);

  const schemaObj = buildEducationalOrganizationSchema({
    complexName: params.complexName,
    description: cleanDescription,
    url: resolvedUrl,
    complexConfig: params.complexConfig,
    schools: params.schools,
    schoolConfigs: params.schoolConfigs,
  });

  let script = document.getElementById(JSON_LD_SCRIPT_ID) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = JSON_LD_SCRIPT_ID;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(schemaObj);
}

export function removePublicPortalJsonLd(): void {
  if (typeof document === 'undefined') return;
  const script = document.getElementById(JSON_LD_SCRIPT_ID);
  if (script) {
    script.remove();
  }
}
