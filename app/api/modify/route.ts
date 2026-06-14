import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { Volume, createFsFromVolume } from 'memfs';
import git from 'isomorphic-git';
import { CommitPlan } from '@/lib/types';
import { format } from 'date-fns';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const overridesStr = formData.get('overrides') as string | null;

    if (!file || !overridesStr) {
      return NextResponse.json({ error: 'Missing file or overrides' }, { status: 400 });
    }

    const overrides: Record<string, CommitPlan[]> = JSON.parse(overridesStr);
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    const vol = new Volume();
    const fs = createFsFromVolume(vol);
    const dir = '/repo';

    // Find git prefix
    let gitPrefix = '';
    zip.forEach((path) => {
      if (path.endsWith('.git/') || path.includes('/.git/')) {
        const match = path.match(/^(.*?)\.git\//);
        if (match) gitPrefix = match[1];
      }
    });

    await (fs as any).promises.mkdir(dir, { recursive: true });

    // Extract zip
    const extractPromises: Promise<void>[] = [];
    zip.forEach((relativePath, zipEntry) => {
      if (zipEntry.dir) return;
      const targetPath = `${dir}/${relativePath.slice(gitPrefix.length)}`;
      extractPromises.push(
        zipEntry.async('nodebuffer').then(async (content) => {
          const parts = targetPath.split('/');
          const dirPath = parts.slice(0, -1).join('/');
          await (fs as any).promises.mkdir(dirPath, { recursive: true });
          await (fs as any).promises.writeFile(targetPath, content);
        })
      );
    });
    await Promise.all(extractPromises);

    // Get original commits
    const originalCommits = await git.log({ fs: fs as any, dir });
    const originalCommitsReversed = [...originalCommits].reverse();

    // Now we re-create the repo in a new directory to be clean
    const newDir = '/new-repo';
    await (fs as any).promises.mkdir(newDir, { recursive: true });
    await git.init({ fs: fs as any, dir: newDir, defaultBranch: 'main' });

    // We'll track which dates from original repo we've processed
    const processedDates = new Set<string>();

    for (const commit of originalCommitsReversed) {
      const date = format(new Date(commit.commit.author.timestamp * 1000), 'yyyy-MM-dd');
      
      if (processedDates.has(date)) continue;
      processedDates.add(date);

      if (overrides[date]) {
        // Use overrides for this day
        const dayOverrides = overrides[date];
        for (const override of dayOverrides) {
          // For simplicity, we'll just create a file change
          const timestamp = Math.floor(new Date(override.datetime).getTime() / 1000);
          await (fs as any).promises.writeFile(`${newDir}/activity.log`, `Modified at ${new Date(timestamp * 1000).toISOString()}\n`, { flag: 'a' });
          await git.add({ fs: fs as any, dir: newDir, filepath: 'activity.log' });
          
          await git.commit({
            fs: fs as any,
            dir: newDir,
            message: override.message,
            author: {
              name: commit.commit.author.name,
              email: commit.commit.author.email,
              timestamp,
              timezoneOffset: 0,
            },
            committer: {
              name: commit.commit.committer.name,
              email: commit.commit.committer.email,
              timestamp,
              timezoneOffset: 0,
            },
          });
        }
      } else {
        // Keep original commits for this day
        const dayCommits = originalCommitsReversed.filter(c => 
          format(new Date(c.commit.author.timestamp * 1000), 'yyyy-MM-dd') === date
        );

        for (const c of dayCommits) {
          await (fs as any).promises.writeFile(`${newDir}/activity.log`, `Original at ${new Date(c.commit.author.timestamp * 1000).toISOString()}\n`, { flag: 'a' });
          await git.add({ fs: fs as any, dir: newDir, filepath: 'activity.log' });

          await git.commit({
            fs: fs as any,
            dir: newDir,
            message: c.commit.message,
            author: {
              name: c.commit.author.name,
              email: c.commit.author.email,
              timestamp: c.commit.author.timestamp,
              timezoneOffset: 0,
            },
            committer: {
              name: c.commit.committer.name,
              email: c.commit.committer.email,
              timestamp: c.commit.committer.timestamp,
              timezoneOffset: 0,
            },
          });
        }
      }
    }

    // Add any new dates that weren't in original repo
    const overrideDates = Object.keys(overrides);
    for (const date of overrideDates) {
      if (!processedDates.has(date)) {
        const dayOverrides = overrides[date];
        for (const override of dayOverrides) {
          const timestamp = Math.floor(new Date(override.datetime).getTime() / 1000);
          await (fs as any).promises.writeFile(`${newDir}/activity.log`, `New at ${new Date(timestamp * 1000).toISOString()}\n`, { flag: 'a' });
          await git.add({ fs: fs as any, dir: newDir, filepath: 'activity.log' });
          
          const defaultAuthor = originalCommits.length > 0 ? originalCommits[0].commit.author : { name: 'Dev User', email: 'dev@example.com' };

          await git.commit({
            fs: fs as any,
            dir: newDir,
            message: override.message,
            author: {
              name: defaultAuthor.name,
              email: defaultAuthor.email,
              timestamp,
              timezoneOffset: 0,
            },
            committer: {
              name: defaultAuthor.name,
              email: defaultAuthor.email,
              timestamp,
              timezoneOffset: 0,
            },
          });
        }
      }
    }

    // Zip and return
    const outZip = new JSZip();
    const files = await (fs as any).promises.readdir(newDir, { recursive: true });
    
    const zipPromises: Promise<void>[] = [];
    for (const f of files) {
      const fullPath = `${newDir}/${f}`;
      const stats = await (fs as any).promises.stat(fullPath);
      if (stats.isDirectory()) continue;
      
      zipPromises.push(
        (fs as any).promises.readFile(fullPath).then((content: any) => {
          outZip.file(f, content);
        })
      );
    }
    await Promise.all(zipPromises);

    // Also include the .git folder
    const gitFiles = await (fs as any).promises.readdir(`${newDir}/.git`, { recursive: true });
    for (const f of gitFiles) {
      const fullPath = `${newDir}/.git/${f}`;
      const stats = await (fs as any).promises.stat(fullPath);
      if (stats.isDirectory()) continue;
      const content = await (fs as any).promises.readFile(fullPath);
      outZip.file(`.git/${f}`, content);
    }

    const blob = await outZip.generateAsync({ type: 'blob' });
    const outArrayBuffer = await blob.arrayBuffer();

    return new Response(outArrayBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="modified-${file.name}"`,
      },
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
