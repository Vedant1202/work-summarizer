import fs from 'fs';
import path from 'path';
import os from 'os';
import { Config, OutputFormat } from '../config/types';
import { Report } from './generator';
import { buildHtml } from './html';

function resolveOutputDir(config: Config): string {
  const dir = config.output.dir.replace(/^~/, os.homedir());
  return path.resolve(dir);
}

export function exportReport(report: Report, config: Config, format: OutputFormat = 'markdown'): string[] {
  const outputDir = resolveOutputDir(config);
  fs.mkdirSync(outputDir, { recursive: true });

  const base = `${report.date}-${report.repoName}`;
  const written: string[] = [];

  if (format === 'markdown' || format === 'both') {
    const mdPath = path.join(outputDir, `${base}.md`);
    fs.writeFileSync(mdPath, report.content, 'utf8');
    written.push(mdPath);
  }

  if (format === 'html' || format === 'both') {
    const htmlPath = path.join(outputDir, `${base}.html`);
    fs.writeFileSync(htmlPath, buildHtml(report), 'utf8');
    written.push(htmlPath);
  }

  return written;
}

export function getLastReportPath(config: Config, targetDate?: string): string | null {
  const outputDir = resolveOutputDir(config);

  if (!fs.existsSync(outputDir)) return null;

  const files = fs
    .readdirSync(outputDir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .reverse();

  if (files.length === 0) return null;

  if (targetDate) {
    const match = files.find((f) => f.startsWith(targetDate));
    return match ? path.join(outputDir, match) : null;
  }

  return path.join(outputDir, files[0]);
}

export function listAllReports(config: Config): Array<{ date: string; repoName: string; filePath: string }> {
  const outputDir = resolveOutputDir(config);

  if (!fs.existsSync(outputDir)) return [];

  return fs
    .readdirSync(outputDir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .reverse()
    .map((f) => {
      const parts = f.replace(/\.md$/, '').split('-');
      const date = parts.slice(0, 3).join('-');
      const repoName = parts.slice(3).join('-') || 'unknown';
      return { date, repoName, filePath: path.join(outputDir, f) };
    });
}
