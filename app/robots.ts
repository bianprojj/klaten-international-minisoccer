import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/manager/', '/staff/', '/superadmin/', '/checkout/', '/booking-history/', '/payment/', '/shared/', '/sql-editor/'],
    },
    sitemap: 'https://klatenminisoccer.web.id/sitemap.xml',
  };
}
