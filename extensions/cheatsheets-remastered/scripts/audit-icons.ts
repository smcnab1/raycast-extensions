#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

interface CheatsheetMetadata {
  path: string;
  title: string;
  tech: string;
  version?: string;
  status: 'active' | 'archived';
  lastReviewed: string;
}

interface IconAnalysis {
  required: string[];
  unused: string[];
  missing: string[];
}

// Map of tech identifiers to expected icon filenames
const TECH_TO_ICON_MAP: { [key: string]: string } = {
  'angular': 'angular.svg',
  'awk': 'awk.svg',
  'aws': 'aws.svg',
  'bash': 'bash.svg',
  'brew': 'brew.svg',
  'css': 'css.svg',
  'curl': 'curl.svg',
  'docker': 'docker.svg',
  'emacs': 'emacs.svg',
  'fish': 'fish.svg',
  'git': 'git.svg',
  'github': 'github.svg',
  'go': 'go.svg',
  'golang': 'go.svg',
  'graphql': 'graphql.svg',
  'grep': 'grep.svg',
  'html': 'html.svg',
  'java': 'java.svg',
  'javascript': 'javascript.svg',
  'js': 'javascript.svg',
  'jq': 'jq.svg',
  'kotlin': 'kotlin.svg',
  'kubernetes': 'kubernetes.svg',
  'k8s': 'kubernetes.svg',
  'linux': 'linux.svg',
  'mac': 'mac.svg',
  'macos': 'mac.svg',
  'make': 'make.svg',
  'mongodb': 'mongodb.svg',
  'mysql': 'mysql.svg',
  'nextjs': 'nextjs.svg',
  'next': 'nextjs.svg',
  'nginx': 'nginx.svg',
  'node': 'node.svg',
  'nodejs': 'node.svg',
  'npm': 'npm.svg',
  'nvm': 'nvm.svg',
  'php': 'php.svg',
  'pnpm': 'pnpm.svg',
  'postgresql': 'postgresql.svg',
  'postgres': 'postgresql.svg',
  'python': 'python.svg',
  'py': 'python.svg',
  'react': 'react.svg',
  'redis': 'redis.svg',
  'ruby': 'ruby.svg',
  'rb': 'ruby.svg',
  'rust': 'rust.svg',
  'rs': 'rust.svg',
  'sed': 'sed.svg',
  'sql': 'sql.svg',
  'sqlite': 'sqlite.svg',
  'ssh': 'ssh.svg',
  'svelte': 'svelte.svg',
  'swift': 'swift.svg',
  'tailwind': 'tailwind.svg',
  'terminal': 'terminal.svg',
  'terraform': 'terraform.svg',
  'tmux': 'tmux.svg',
  'vim': 'vim.svg',
  'vue': 'vue.svg',
  'yarn': 'yarn.svg',
  'zsh': 'zsh.svg',
};

function getActiveCheatsheets(): CheatsheetMetadata[] {
  const cheatsheetsDir = path.join(__dirname, '..', 'assets', 'cheatsheets');
  const indexPath = path.join(cheatsheetsDir, 'index.json');
  
  if (!fs.existsSync(indexPath)) {
    console.error('❌ index.json not found. Run audit:cheatsheets first.');
    process.exit(1);
  }
  
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  const cheatsheets: CheatsheetMetadata[] = JSON.parse(indexContent);
  
  return cheatsheets.filter(c => c.status === 'active');
}

function getExistingIcons(): string[] {
  const assetsDir = path.join(__dirname, '..', 'assets');
  const files = fs.readdirSync(assetsDir);
  
  return files
    .filter(file => file.endsWith('.svg'))
    .sort();
}

function analyzeIcons(): IconAnalysis {
  const activeCheatsheets = getActiveCheatsheets();
  const existingIcons = getExistingIcons();
  
  console.log(`📊 Analyzing icons for ${activeCheatsheets.length} active cheatsheets...\n`);
  
  const requiredIcons = new Set<string>();
  const missingIcons: string[] = [];
  
  // Find required icons
  for (const cheatsheet of activeCheatsheets) {
    const expectedIcon = TECH_TO_ICON_MAP[cheatsheet.tech];
    if (expectedIcon) {
      requiredIcons.add(expectedIcon);
    } else {
      // Check if there's a direct match
      const directMatch = `${cheatsheet.tech}.svg`;
      if (existingIcons.includes(directMatch)) {
        requiredIcons.add(directMatch);
      } else {
        missingIcons.push(cheatsheet.tech);
      }
    }
  }
  
  // Find unused icons
  const unusedIcons = existingIcons.filter(icon => !requiredIcons.has(icon));
  
  return {
    required: Array.from(requiredIcons).sort(),
    unused: unusedIcons.sort(),
    missing: missingIcons.sort()
  };
}

function generateIconReport(analysis: IconAnalysis): void {
  console.log('🎨 Icon Analysis Report\n');
  
  console.log(`📈 Summary:`);
  console.log(`  Required icons: ${analysis.required.length}`);
  console.log(`  Unused icons: ${analysis.unused.length}`);
  console.log(`  Missing icons: ${analysis.missing.length}\n`);
  
  if (analysis.required.length > 0) {
    console.log('✅ Required Icons:');
    analysis.required.forEach(icon => {
      console.log(`  - ${icon}`);
    });
    console.log('');
  }
  
  if (analysis.unused.length > 0) {
    console.log('🗑️  Unused Icons (can be removed):');
    analysis.unused.forEach(icon => {
      console.log(`  - ${icon}`);
    });
    console.log('');
  }
  
  if (analysis.missing.length > 0) {
    console.log('❌ Missing Icons (need to be created):');
    analysis.missing.forEach(tech => {
      console.log(`  - ${tech}.svg`);
    });
    console.log('');
  }
}

function removeUnusedIcons(unusedIcons: string[]): void {
  if (unusedIcons.length === 0) {
    console.log('✅ No unused icons to remove.');
    return;
  }
  
  const assetsDir = path.join(__dirname, '..', 'assets');
  const archiveDir = path.join(assetsDir, '_archive');
  
  // Create archive directory if it doesn't exist
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }
  
  console.log(`🗑️  Moving ${unusedIcons.length} unused icons to archive...`);
  
  for (const icon of unusedIcons) {
    const sourcePath = path.join(assetsDir, icon);
    const archivePath = path.join(archiveDir, icon);
    
    if (fs.existsSync(sourcePath)) {
      fs.renameSync(sourcePath, archivePath);
      console.log(`  ✓ Moved ${icon} to _archive/`);
    }
  }
}

function generateMissingIconsList(missingIcons: string[]): void {
  if (missingIcons.length === 0) {
    console.log('✅ All required icons are available.');
    return;
  }
  
  const outputPath = path.join(__dirname, '..', 'assets', 'missing-icons.txt');
  const content = missingIcons.map(tech => `${tech}.svg`).join('\n');
  
  fs.writeFileSync(outputPath, content);
  console.log(`📝 Created missing-icons.txt with ${missingIcons.length} missing icons.`);
}

async function main(): Promise<void> {
  try {
    console.log('🎨 Starting icon audit...\n');
    
    const analysis = analyzeIcons();
    generateIconReport(analysis);
    
    // Remove unused icons
    removeUnusedIcons(analysis.unused);
    
    // Generate missing icons list
    generateMissingIconsList(analysis.missing);
    
    console.log('✅ Icon audit complete!');
    
  } catch (error) {
    console.error('❌ Icon audit failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
