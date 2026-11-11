import { MetadataRoute } from 'next';
import { PLATFORMS, TOOLS } from '@pd/shared';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://perfectdownloader.com';
  const now = new Date();

  // 1. Core pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/status`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.5,
    },
  ];

  // 2. Downloader landing pages for supported platforms
  const platformRoutes: MetadataRoute.Sitemap = PLATFORMS.map((p) => ({
    url: `${baseUrl}/downloaders/${p.id}`,
    lastModified: p.lastVerified ? new Date(p.lastVerified) : now,
    changeFrequency: 'weekly',
    priority: p.policy === 'open' ? 0.9 : 0.8,
  }));

  // 3. Tool landing pages
  const toolRoutes: MetadataRoute.Sitemap = TOOLS.map((t) => ({
    url: `${baseUrl}/tools/${t.category}/${t.action}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.85,
  }));

  return [...staticRoutes, ...platformRoutes, ...toolRoutes];
}
