import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'OG Preview — IsoCity' },
  robots: 'noindex, nofollow',
};

export default function ThumbnailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
