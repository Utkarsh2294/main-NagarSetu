import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');
files.push('server.ts');

for (const file of files) {
  if (file.endsWith('types.ts')) {
    fs.unlinkSync(file);
    continue;
  }
  
  const ext = path.extname(file);
  const outExt = ext === '.tsx' ? '.jsx' : '.js';
  const outFile = file.slice(0, -ext.length) + outExt;
  
  console.log(`Converting ${file} -> ${outFile}`);
  const loader = ext === '.tsx' ? '--jsx=preserve' : '';
  execSync(`npx esbuild "${file}" --outfile="${outFile}" ${loader}`);
  fs.unlinkSync(file);
}

// Update imports inside the new JS/JSX files
function updateImports(dir) {
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      updateImports(file);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      let content = fs.readFileSync(file, 'utf-8');
      
      // Remove imports from types
      content = content.replace(/import\s+{[^}]*}\s+from\s+["']\.\.?\/types(?:'|"|;)\n?/g, '');
      
      fs.writeFileSync(file, content);
    }
  });
}
updateImports('./src');

// Update vite.config.ts
if (fs.existsSync('./vite.config.ts')) {
  execSync(`npx esbuild "./vite.config.ts" --outfile="./vite.config.js"`);
  fs.unlinkSync('./vite.config.ts');
}

// Update index.html
if (fs.existsSync('./index.html')) {
  let html = fs.readFileSync('./index.html', 'utf-8');
  html = html.replace('/src/main.tsx', '/src/main.jsx');
  fs.writeFileSync('./index.html', html);
}

console.log("Conversion complete.");
