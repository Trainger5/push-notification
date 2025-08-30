#!/usr/bin/env node

// Production build script
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting production build...');

try {
  // Clean previous build
  console.log('🧹 Cleaning previous build...');
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true });
  }

  // Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm ci --only=production', { stdio: 'inherit' });

  // Run build
  console.log('🔨 Building for production...');
  execSync('npm run build', { stdio: 'inherit' });

  // Verify build
  console.log('✅ Verifying build...');
  const distPath = path.join(__dirname, '..', 'dist');
  if (!fs.existsSync(distPath)) {
    throw new Error('Build directory not found');
  }

  const indexPath = path.join(distPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    throw new Error('index.html not found in build');
  }

  console.log('🎉 Production build completed successfully!');
  console.log(`📁 Build output: ${distPath}`);
  
  // Show build size
  const stats = fs.statSync(distPath);
  const dirSize = execSync(`du -sh ${distPath}`).toString().trim();
  console.log(`📊 Build size: ${dirSize.split('\t')[0]}`);

} catch (error) {
  console.error('❌ Production build failed:', error.message);
  process.exit(1);
}