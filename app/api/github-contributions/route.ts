import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const response = await fetch(`https://github.com/users/${username}/contributions`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'GitHub user not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch contributions from GitHub' }, { status: response.status });
    }

    const html = await response.text();

    const idToDate = new Map<string, string>();
    const tdMatches = html.matchAll(/<td\s+([^>]+)>/g);
    for (const match of tdMatches) {
      const attrs = match[1];
      if (attrs.includes('ContributionCalendar-day')) {
        const idMatch = attrs.match(/id="([^"]+)"/);
        const dateMatch = attrs.match(/data-date="([^"]+)"/);
        if (idMatch && dateMatch) {
          idToDate.set(idMatch[1], dateMatch[1]);
        }
      }
    }

    const dateToCount: Record<string, number> = {};
    const tooltipMatches = html.matchAll(/<tool-tip\s+([^>]+)>([\s\S]*?)<\/tool-tip>/g);
    for (const match of tooltipMatches) {
      const attrs = match[1];
      const text = match[2].trim();
      const forMatch = attrs.match(/for="([^"]+)"/);
      if (forMatch) {
        const id = forMatch[1];
        const date = idToDate.get(id);
        if (date) {
          let count = 0;
          if (text.startsWith('No ')) {
            count = 0;
          } else {
            const numMatch = text.match(/^(\d+)/);
            if (numMatch) {
              count = parseInt(numMatch[1], 10);
            }
          }
          dateToCount[date] = count;
        }
      }
    }

    return NextResponse.json({ contributions: dateToCount });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('GitHub fetch error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
