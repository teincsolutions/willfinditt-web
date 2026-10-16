import { NextResponse } from 'next/server';

/**
 * Apple Universal Links association file.
 * Must be served at /.well-known/apple-app-site-association with
 * Content-Type: application/json (a static extensionless file in
 * public/ would get an unreliable MIME type from Next).
 */
export async function GET() {
  return NextResponse.json(
    {
      applinks: {
        apps: [],
        details: [
          {
            appID: '75F9X78QJ6.com.willfinditt.willfinditt',
            paths: ['/ads/*', '/category/*'],
          },
        ],
      },
    },
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );
}
