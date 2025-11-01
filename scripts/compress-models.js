#!/usr/bin/env node

import { execSync } from 'child_process';
import { readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const publicDir = './public';

function findGLBFiles(dir) {
  const files = [];
  const items = readdirSync(dir);

  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...findGLBFiles(fullPath));
    } else if (extname(item) === '.glb' && !item.includes('_draco')) {
      files.push(fullPath);
    }
  }

  return files;
}

console.log('🔍 Finding GLB files...');
const glbFiles = findGLBFiles(publicDir);

if (glbFiles.length === 0) {
  console.log('✅ No GLB files found to compress');
  process.exit(0);
}

console.log(`📦 Found ${glbFiles.length} GLB file(s) to compress:\n`);

for (const file of glbFiles) {
  const outputFile = file.replace('.glb', '_draco.glb');
  console.log(`⚙️  Compressing: ${file}`);

  try {
    execSync(`npx gltf-pipeline -i "${file}" -o "${outputFile}" -d`, {
      stdio: 'inherit'
    });
    console.log(`✅ Compressed: ${outputFile}\n`);
  } catch (error) {
    console.error(`❌ Error compressing ${file}:`, error.message);
  }
}

console.log('🎉 Compression complete!');
