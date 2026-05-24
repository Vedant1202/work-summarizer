import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { writeEnvKey } from './loader';

describe('writeEnvKey', () => {
  let tmpFile: string;

  beforeEach(() => {
    tmpFile = path.join(os.tmpdir(), `work-summary-test-${Date.now()}.env`);
  });

  afterEach(() => {
    try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
  });

  it('creates the file and writes a new key', () => {
    writeEnvKey(tmpFile, 'GEMINI_API_KEY', 'test-key');
    const content = fs.readFileSync(tmpFile, 'utf8');
    expect(content).toContain('GEMINI_API_KEY=test-key');
  });

  it('updates an existing key without touching other keys', () => {
    fs.writeFileSync(tmpFile, 'GEMINI_API_KEY=old\nGEMINI_MODEL=flash\n');
    writeEnvKey(tmpFile, 'GEMINI_API_KEY', 'new-key');
    const content = fs.readFileSync(tmpFile, 'utf8');
    expect(content).toContain('GEMINI_API_KEY=new-key');
    expect(content).toContain('GEMINI_MODEL=flash');
    expect(content).not.toContain('GEMINI_API_KEY=old');
  });

  it('appends a new key to an existing file', () => {
    fs.writeFileSync(tmpFile, 'GEMINI_MODEL=flash\n');
    writeEnvKey(tmpFile, 'LINEAR_API_KEY', 'lin_abc');
    const content = fs.readFileSync(tmpFile, 'utf8');
    expect(content).toContain('GEMINI_MODEL=flash');
    expect(content).toContain('LINEAR_API_KEY=lin_abc');
  });

  it('file ends with a newline', () => {
    writeEnvKey(tmpFile, 'FOO', 'bar');
    const content = fs.readFileSync(tmpFile, 'utf8');
    expect(content.endsWith('\n')).toBe(true);
  });
});
