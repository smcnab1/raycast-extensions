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

interface AuditResult {
  kept: CheatsheetMetadata[];
  updated: CheatsheetMetadata[];
  archived: CheatsheetMetadata[];
}

// Outdated technologies that should be archived
const OUTDATED_TECHS = new Set([
  'angularjs', // AngularJS 1.x is EOL
  'bower', // Superseded by npm/yarn
  'grunt', // Superseded by webpack/vite
  'gulp3', // Gulp 3 is EOL
  'tslint', // Superseded by ESLint
  'babel6', // Babel 6 is EOL
  'jasmine1', // Old Jasmine versions
  'mocha1', // Old Mocha versions
  'karma', // Largely superseded
  'browserify', // Superseded by webpack/vite
  'systemjs', // Superseded by ES modules
  'jspm', // Superseded by npm/yarn
  'browser-sync', // Largely superseded
  'live-reload', // Superseded by modern dev servers
  'nodemon', // Still useful but basic
  'pm2', // Still useful but basic
  'forever', // Superseded by PM2/systemd
  'supervisor', // Superseded by PM2
  'nodemon', // Basic tool
  'grunt-contrib', // Grunt ecosystem
  'gulp-contrib', // Gulp ecosystem
  'yeoman', // Largely superseded
  'bower-installer', // Bower ecosystem
  'component', // Superseded by npm
  'duo', // Superseded by npm
  'jam', // Superseded by npm
  'volo', // Superseded by npm
  'ender', // Superseded by npm
  'spm', // Superseded by npm
  'componentjs', // Superseded by npm
  'jamjs', // Superseded by npm
  'volojs', // Superseded by npm
  'enderjs', // Superseded by npm
  'spmjs', // Superseded by npm
]);

// Version-specific outdated patterns
const OUTDATED_PATTERNS = [
  /angularjs.*1\./i,
  /react.*0\./i,
  /vue.*1\./i,
  /ember.*1\./i,
  /backbone.*0\./i,
  /jquery.*1\./i,
  /bootstrap.*2\./i,
  /bootstrap.*3\./i,
  /node.*0\./i,
  /node.*4\./i,
  /node.*6\./i,
  /node.*8\./i,
  /node.*10\./i,
  /python.*2\./i,
  /ruby.*1\./i,
  /ruby.*2\./i,
  /php.*5\./i,
  /php.*7\./i,
  /mysql.*4\./i,
  /mysql.*5\./i,
  /postgresql.*8\./i,
  /postgresql.*9\./i,
  /mongodb.*2\./i,
  /mongodb.*3\./i,
  /redis.*2\./i,
  /redis.*3\./i,
  /docker.*1\./i,
  /kubernetes.*1\./i,
  /aws.*cli.*1\./i,
  /terraform.*0\./i,
  /ansible.*1\./i,
  /chef.*11\./i,
  /puppet.*3\./i,
  /vagrant.*1\./i,
  /virtualbox.*4\./i,
  /vmware.*5\./i,
  /hyper-v.*1\./i,
  /xen.*4\./i,
  /kvm.*1\./i,
  /lxc.*1\./i,
  /lxd.*2\./i,
  /systemd.*200\./i,
  /upstart.*0\./i,
  /sysvinit.*0\./i,
  /runit.*0\./i,
  /s6.*0\./i,
  /daemontools.*0\./i,
  /supervisor.*3\./i,
  /monit.*5\./i,
  /god.*0\./i,
  /bluepill.*0\./i,
  /eye.*0\./i,
  /foreman.*0\./i,
  /honcho.*0\./i,
  /circus.*0\./i,
  /supervisord.*3\./i,
  /runit.*0\./i,
  /s6.*0\./i,
  /daemontools.*0\./i,
  /supervisor.*3\./i,
  /monit.*5\./i,
  /god.*0\./i,
  /bluepill.*0\./i,
  /eye.*0\./i,
  /foreman.*0\./i,
  /honcho.*0\./i,
  /circus.*0\./i,
];

function isOutdated(filename: string, content: string): boolean {
  const baseName = path.basename(filename, '.md');
  
  // Check against outdated tech list
  if (OUTDATED_TECHS.has(baseName)) {
    return true;
  }
  
  // Check against version patterns
  for (const pattern of OUTDATED_PATTERNS) {
    if (pattern.test(filename) || pattern.test(content)) {
      return true;
    }
  }
  
  // Check for specific outdated content patterns
  const outdatedContentPatterns = [
    /angularjs.*1\./i,
    /react.*0\./i,
    /vue.*1\./i,
    /ember.*1\./i,
    /backbone.*0\./i,
    /jquery.*1\./i,
    /bootstrap.*2\./i,
    /bootstrap.*3\./i,
    /node.*0\./i,
    /node.*4\./i,
    /node.*6\./i,
    /node.*8\./i,
    /node.*10\./i,
    /python.*2\./i,
    /ruby.*1\./i,
    /ruby.*2\./i,
    /php.*5\./i,
    /php.*7\./i,
    /mysql.*4\./i,
    /mysql.*5\./i,
    /postgresql.*8\./i,
    /postgresql.*9\./i,
    /mongodb.*2\./i,
    /mongodb.*3\./i,
    /redis.*2\./i,
    /redis.*3\./i,
    /docker.*1\./i,
    /kubernetes.*1\./i,
    /aws.*cli.*1\./i,
    /terraform.*0\./i,
    /ansible.*1\./i,
    /chef.*11\./i,
    /puppet.*3\./i,
    /vagrant.*1\./i,
    /virtualbox.*4\./i,
    /vmware.*5\./i,
    /hyper-v.*1\./i,
    /xen.*4\./i,
    /kvm.*1\./i,
    /lxc.*1\./i,
    /lxd.*2\./i,
    /systemd.*200\./i,
    /upstart.*0\./i,
    /sysvinit.*0\./i,
    /runit.*0\./i,
    /s6.*0\./i,
    /daemontools.*0\./i,
    /supervisor.*3\./i,
    /monit.*5\./i,
    /god.*0\./i,
    /bluepill.*0\./i,
    /eye.*0\./i,
    /foreman.*0\./i,
    /honcho.*0\./i,
    /circus.*0\./i,
  ];
  
  for (const pattern of outdatedContentPatterns) {
    if (pattern.test(content)) {
      return true;
    }
  }
  
  return false;
}

function extractTechFromFilename(filename: string): string {
  const baseName = path.basename(filename, '.md');
  
  // Handle version-specific files
  if (baseName.includes('@')) {
    return baseName.split('@')[0];
  }
  
  // Handle common patterns
  const techMap: { [key: string]: string } = {
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'rb': 'ruby',
    'go': 'golang',
    'rs': 'rust',
    'kt': 'kotlin',
    'typescript': 'typescript',
    'javascript': 'javascript',
    'python': 'python',
    'ruby': 'ruby',
    'php': 'php',
    'golang': 'golang',
    'rust': 'rust',
    'cpp': 'cpp',
    'c': 'c',
    'java': 'java',
    'kotlin': 'kotlin',
    'swift': 'swift',
    'dart': 'dart',
    'scala': 'scala',
    'clojure': 'clojure',
    'haskell': 'haskell',
    'ocaml': 'ocaml',
    'fsharp': 'fsharp',
    'erlang': 'erlang',
    'elixir': 'elixir',
    'elm': 'elm',
    'purescript': 'purescript',
    'reason': 'reason',
    'rescript': 'rescript',
    'coffeescript': 'coffeescript',
  };
  
  return techMap[baseName] || baseName;
}

function generateTitle(filename: string, content: string): string {
  const baseName = path.basename(filename, '.md');
  
  // Try to extract from front-matter first
  const parsed = matter(content);
  if (parsed.data.title) {
    return parsed.data.title;
  }
  
  // Try to extract from first heading
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch) {
    return headingMatch[1].trim();
  }
  
  // Generate from filename
  return baseName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function extractVersion(filename: string, content: string): string | undefined {
  // Check filename for version
  const versionMatch = filename.match(/@([0-9.]+)/);
  if (versionMatch) {
    return versionMatch[1];
  }
  
  // Check content for version
  const contentVersionMatch = content.match(/version[:\s]+([0-9.]+)/i);
  if (contentVersionMatch) {
    return contentVersionMatch[1];
  }
  
  return undefined;
}

async function auditCheatsheets(): Promise<AuditResult> {
  const cheatsheetsDir = path.join(__dirname, '..', 'assets', 'cheatsheets');
  const archiveDir = path.join(cheatsheetsDir, '_archive');
  
  // Create archive directory if it doesn't exist
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }
  
  const result: AuditResult = {
    kept: [],
    updated: [],
    archived: []
  };
  
  const files = fs.readdirSync(cheatsheetsDir)
    .filter(file => file.endsWith('.md') && !file.startsWith('_'))
    .sort();
  
  console.log(`Found ${files.length} cheatsheets to audit...\n`);
  
  for (const file of files) {
    const filePath = path.join(cheatsheetsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    console.log(`Processing: ${file}`);
    
    const tech = extractTechFromFilename(file);
    const title = generateTitle(file, content);
    const version = extractVersion(file, content);
    const lastReviewed = new Date().toISOString().split('T')[0];
    
    const metadata: CheatsheetMetadata = {
      path: file,
      title,
      tech,
      version,
      status: 'active',
      lastReviewed
    };
    
    if (isOutdated(file, content)) {
      console.log(`  → ARCHIVING (outdated)`);
      
      // Move to archive
      const archivePath = path.join(archiveDir, file);
      fs.renameSync(filePath, archivePath);
      
      metadata.status = 'archived';
      result.archived.push(metadata);
    } else {
      console.log(`  → KEEPING`);
      
      // Check if front-matter needs updating
      const parsed = matter(content);
      const needsUpdate = !parsed.data.title || 
                         !parsed.data.tech || 
                         !parsed.data.status || 
                         !parsed.data.lastReviewed;
      
      if (needsUpdate) {
        console.log(`  → UPDATING front-matter`);
        
        // Update front-matter
        const updatedData: any = {
          ...parsed.data,
          title: metadata.title,
          tech: metadata.tech,
          status: metadata.status,
          lastReviewed: metadata.lastReviewed
        };
        
        // Only add version if it exists
        if (metadata.version) {
          updatedData.version = metadata.version;
        }
        
        const updatedContent = matter.stringify(parsed.content, updatedData);
        fs.writeFileSync(filePath, updatedContent);
        
        result.updated.push(metadata);
      } else {
        result.kept.push(metadata);
      }
    }
  }
  
  return result;
}

async function generateIndex(result: AuditResult): Promise<void> {
  const cheatsheetsDir = path.join(__dirname, '..', 'assets', 'cheatsheets');
  const indexPath = path.join(cheatsheetsDir, 'index.json');
  
  const activeCheatsheets = [...result.kept, ...result.updated];
  
  const indexData = activeCheatsheets.map(cheatsheet => ({
    path: cheatsheet.path,
    title: cheatsheet.title,
    tech: cheatsheet.tech,
    version: cheatsheet.version,
    status: cheatsheet.status,
    lastReviewed: cheatsheet.lastReviewed
  }));
  
  fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2));
  console.log(`\nGenerated index.json with ${indexData.length} active cheatsheets`);
}

async function main(): Promise<void> {
  try {
    console.log('🔍 Starting cheatsheets audit...\n');
    
    const result = await auditCheatsheets();
    
    console.log('\n📊 Audit Summary:');
    console.log(`  Kept: ${result.kept.length}`);
    console.log(`  Updated: ${result.updated.length}`);
    console.log(`  Archived: ${result.archived.length}`);
    
    if (result.archived.length > 0) {
      console.log('\n📦 Archived cheatsheets:');
      result.archived.forEach(cheatsheet => {
        console.log(`  - ${cheatsheet.path} (${cheatsheet.tech})`);
      });
    }
    
    await generateIndex(result);
    
    console.log('\n✅ Audit complete!');
    
  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
