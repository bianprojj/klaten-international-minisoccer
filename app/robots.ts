import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/manager/', '/staff/', '/superadmin/'],
    },
    sitemap: 'https://klatenminisoccer.web.id/sitemap.xml',
  };
}
