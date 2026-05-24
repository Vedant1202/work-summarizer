import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import readline from 'readline';

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

export async function openInEditor(content: string): Promise<string> {
  const tmpFile = path.join(os.tmpdir(), `work-summary-${Date.now()}.md`);
  fs.writeFileSync(tmpFile, content, 'utf8');

  const editor = process.env.EDITOR || process.env.VISUAL || 'vi';

  const result = spawnSync(editor, [tmpFile], { stdio: 'inherit' });

  if (result.error) {
    throw new Error(`Failed to open editor "${editor}": ${result.error.message}`);
  }

  const edited = fs.readFileSync(tmpFile, 'utf8');
  fs.unlinkSync(tmpFile);

  // If the user saved no changes (content identical), confirm intent
  if (edited === content) {
    const answer = await askQuestion('No changes made. Keep original and export? (y/n) ');
    if (answer !== 'y' && answer !== 'yes') {
      throw new Error('Export cancelled by user.');
    }
  }

  return edited;
}
