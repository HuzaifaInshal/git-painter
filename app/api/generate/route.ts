import { NextRequest, NextResponse } from 'next/server';
import { GeneratorConfig } from '@/lib/types';
import { generateCommitPlan } from '@/lib/commitGenerator';
import { buildGitRepo } from '@/lib/gitEngine';
import { buildZip } from '@/lib/zipBuilder';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const config: GeneratorConfig = await req.json();

    if (!config.ranges || config.ranges.length === 0) {
      return NextResponse.json({ error: 'At least one date range is required' }, { status: 400 });
    }

    const plan = generateCommitPlan(config);

    if (plan.length === 0) {
      return NextResponse.json({ error: 'No commits generated. Check your date range and intensity settings.' }, { status: 400 });
    }

    const { vol, repoPath } = await buildGitRepo(plan, config, () => {});
    const blob = await buildZip(vol, repoPath, config.repoName);
    const arrayBuffer = await blob.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${config.repoName}.zip"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('Generation error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
