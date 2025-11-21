const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🏗️  Building dynamic-script-loader...');

try {
  console.log('📦 Building CommonJS version...');
  execSync('npx tsc -p tsconfig.json', { stdio: 'inherit' });

  console.log('📦 Building ESM version...');
  execSync('npx tsc -p tsconfig.esm.json', { stdio: 'inherit' });

  const distEsmPath = path.join(__dirname, 'dist-esm');
  const distPath = path.join(__dirname, 'dist');

  if (fs.existsSync(distEsmPath)) {
    const files = fs.readdirSync(distEsmPath);
    files.forEach(file => {
      if (file.endsWith('.js')) {
        const esmFile = path.join(distEsmPath, file);
        const targetFile = path.join(distPath, file.replace('.js', '.esm.js'));
        fs.copyFileSync(esmFile, targetFile);
        console.log(`📝 Copied ${file} to ${path.basename(targetFile)}`);
      }
    });

    fs.rmSync(distEsmPath, { recursive: true, force: true });
    console.log('🧹 Cleaned up temporary ESM build directory');
  }

  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}