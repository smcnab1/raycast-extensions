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

// Smart icon matching patterns for better coverage
const ICON_PATTERNS: Array<{ pattern: RegExp; icon: string; description: string }> = [
  // GitHub-related
  { pattern: /^gh-|github|git-/, icon: 'github.svg', description: 'GitHub-related' },
  
  // CSS-related
  { pattern: /^css-|css/, icon: 'css.svg', description: 'CSS-related' },
  
  // HTML-related
  { pattern: /^html-|html/, icon: 'html.svg', description: 'HTML-related' },
  
  // JavaScript/JS-related
  { pattern: /^js-|javascript|jquery/, icon: 'javascript.svg', description: 'JavaScript-related' },
  
  // Node.js-related
  { pattern: /^nodejs-|node/, icon: 'node.svg', description: 'Node.js-related' },
  
  // Git-related
  { pattern: /^git-|git/, icon: 'git.svg', description: 'Git-related' },
  
  // Docker-related
  { pattern: /^docker-|docker/, icon: 'docker.svg', description: 'Docker-related' },
  
  // Rails-related
  { pattern: /^rails-|rails/, icon: 'ruby.svg', description: 'Rails-related' },
  
  // Phoenix-related
  { pattern: /^phoenix-|phoenix/, icon: 'elixir.svg', description: 'Phoenix-related' },
  
  // React-related
  { pattern: /^react-|react/, icon: 'react.svg', description: 'React-related' },
  
  // Vue-related
  { pattern: /^vue-|vue/, icon: 'vue.svg', description: 'Vue-related' },
  
  // Express-related
  { pattern: /^express|koa|fastify/, icon: 'node.svg', description: 'Node.js frameworks' },
  
  // Testing frameworks
  { pattern: /^mocha|jasmine|tape|qunit|jest/, icon: 'javascript.svg', description: 'Testing frameworks' },
  
  // Build tools
  { pattern: /^webpack|rollup|browserify|gulp/, icon: 'javascript.svg', description: 'Build tools' },
  
  // CSS frameworks
  { pattern: /^bootstrap|bulma|tailwind/, icon: 'css.svg', description: 'CSS frameworks' },
  
  // Database-related
  { pattern: /^mysql|postgresql|mongodb|redis|sqlite/, icon: 'database.svg', description: 'Database-related' },
  
  // Terminal/Shell-related
  { pattern: /^bash|zsh|fish|sh-|terminal/, icon: 'terminal.svg', description: 'Terminal-related' },
  
  // Vim-related
  { pattern: /^vim-|vim/, icon: 'vim.svg', description: 'Vim-related' },
  
  // Emacs-related
  { pattern: /^emacs|spacemacs/, icon: 'emacs.svg', description: 'Emacs-related' },
  
  // Python-related
  { pattern: /^python|py-|django|flask/, icon: 'python.svg', description: 'Python-related' },
  
  // PHP-related
  { pattern: /^php|laravel|symfony/, icon: 'php.svg', description: 'PHP-related' },
  
  // Ruby-related
  { pattern: /^ruby|rb-|gem/, icon: 'ruby.svg', description: 'Ruby-related' },
  
  // Go-related
  { pattern: /^go|golang/, icon: 'go.svg', description: 'Go-related' },
  
  // Rust-related
  { pattern: /^rust|rs-/, icon: 'rust.svg', description: 'Rust-related' },
  
  // Java-related
  { pattern: /^java|kotlin|spring/, icon: 'java.svg', description: 'Java-related' },
  
  // Swift-related
  { pattern: /^swift|ios/, icon: 'swift.svg', description: 'Swift-related' },
  
  // AWS-related
  { pattern: /^aws|awscli/, icon: 'aws.svg', description: 'AWS-related' },
  
  // Kubernetes-related
  { pattern: /^k8s|kubernetes/, icon: 'kubernetes.svg', description: 'Kubernetes-related' },
  
  // Terraform-related
  { pattern: /^terraform|tf-/, icon: 'terraform.svg', description: 'Terraform-related' },
  
  // Ansible-related
  { pattern: /^ansible/, icon: 'ansible.svg', description: 'Ansible-related' },
  
  // Chef-related
  { pattern: /^chef/, icon: 'chef.svg', description: 'Chef-related' },
  
  // Docker-related
  { pattern: /^docker/, icon: 'docker.svg', description: 'Docker-related' },
  
  // Nginx-related
  { pattern: /^nginx/, icon: 'nginx.svg', description: 'Nginx-related' },
  
  // MySQL-related
  { pattern: /^mysql/, icon: 'mysql.svg', description: 'MySQL-related' },
  
  // PostgreSQL-related
  { pattern: /^postgresql|postgres/, icon: 'postgresql.svg', description: 'PostgreSQL-related' },
  
  // MongoDB-related
  { pattern: /^mongodb|mongo/, icon: 'mongodb.svg', description: 'MongoDB-related' },
  
  // Redis-related
  { pattern: /^redis/, icon: 'redis.svg', description: 'Redis-related' },
  
  // SQL-related
  { pattern: /^sql/, icon: 'sql.svg', description: 'SQL-related' },
  
  // SSH-related
  { pattern: /^ssh|scp/, icon: 'ssh.svg', description: 'SSH-related' },
  
  // Curl-related
  { pattern: /^curl|httpie/, icon: 'curl.svg', description: 'HTTP clients' },
  
  // Grep-related
  { pattern: /^grep|sed|awk/, icon: 'grep.svg', description: 'Text processing' },
  
  // Make-related
  { pattern: /^make|makefile/, icon: 'make.svg', description: 'Make-related' },
  
  // NPM-related
  { pattern: /^npm|yarn|pnpm/, icon: 'npm.svg', description: 'Package managers' },
  
  // Linux-related
  { pattern: /^linux|ubuntu|debian/, icon: 'linux.svg', description: 'Linux-related' },
  
  // macOS-related
  { pattern: /^mac|macos|osx/, icon: 'mac.svg', description: 'macOS-related' },
  
  // Terminal-related
  { pattern: /^tmux|screen/, icon: 'tmux.svg', description: 'Terminal multiplexers' },
];

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

function findIconForCheatsheet(cheatsheet: CheatsheetMetadata, existingIcons: string[]): string | null {
  // First, try direct tech mapping
  const directIcon = TECH_TO_ICON_MAP[cheatsheet.tech];
  if (directIcon && existingIcons.includes(directIcon)) {
    return directIcon;
  }
  
  // Try pattern matching
  for (const pattern of ICON_PATTERNS) {
    if (pattern.pattern.test(cheatsheet.tech) && existingIcons.includes(pattern.icon)) {
      return pattern.icon;
    }
  }
  
  // Try direct filename match
  const directMatch = `${cheatsheet.tech}.svg`;
  if (existingIcons.includes(directMatch)) {
    return directMatch;
  }
  
  return null;
}

function analyzeIcons(): IconAnalysis {
  const activeCheatsheets = getActiveCheatsheets();
  const existingIcons = getExistingIcons();
  
  console.log(`📊 Analyzing icons for ${activeCheatsheets.length} active cheatsheets...\n`);
  
  const requiredIcons = new Set<string>();
  const missingIcons: string[] = [];
  const iconUsage = new Map<string, string[]>(); // icon -> list of cheatsheets using it
  
  // Find required icons
  for (const cheatsheet of activeCheatsheets) {
    const icon = findIconForCheatsheet(cheatsheet, existingIcons);
    if (icon) {
      requiredIcons.add(icon);
      if (!iconUsage.has(icon)) {
        iconUsage.set(icon, []);
      }
      iconUsage.get(icon)!.push(cheatsheet.tech);
    } else {
      missingIcons.push(cheatsheet.tech);
    }
  }
  
  // Find unused icons
  const unusedIcons = existingIcons.filter(icon => !requiredIcons.has(icon));
  
  // Log icon usage for better understanding
  console.log('📋 Icon Usage Summary:');
  for (const [icon, cheatsheets] of iconUsage.entries()) {
    console.log(`  ${icon}: ${cheatsheets.length} cheatsheets (${cheatsheets.slice(0, 3).join(', ')}${cheatsheets.length > 3 ? '...' : ''})`);
  }
  console.log('');
  
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
