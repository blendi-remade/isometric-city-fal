#!/usr/bin/env node
/**
 * Image Compression Script
 * 
 * Converts PNG images to optimized WebP format for faster loading.
 * WebP typically provides 25-35% better compression than PNG.
 * 
 * Usage: node scripts/compress-images.mjs
 */

import sharp from 'sharp';
import { readdir, stat, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const ASSETS_DIR = path.join(ROOT_DIR, 'public', 'assets');

// WebP compression quality (0-100, higher = better quality, larger file)
// 80 is a good balance for game sprites
const WEBP_QUALITY = 80;

/**
 * Get all PNG files recursively from a directory
 */
async function getPngFiles(dir) {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await getPngFiles(fullPath));
    } else if (entry.name.endsWith('.png')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/**
 * Convert a PNG file to WebP
 */
async function convertToWebP(pngPath) {
  const webpPath = pngPath.replace(/\.png$/, '.webp');
  
  // Skip if WebP already exists and is newer than PNG
  if (existsSync(webpPath)) {
    const pngStat = await stat(pngPath);
    const webpStat = await stat(webpPath);
    if (webpStat.mtime > pngStat.mtime) {
      return { skipped: true, pngPath };
    }
  }
  
  try {
    const pngStats = await stat(pngPath);
    const originalSize = pngStats.size;
    
    await sharp(pngPath)
      .webp({ quality: WEBP_QUALITY, lossless: false })
      .toFile(webpPath);
    
    const webpStats = await stat(webpPath);
    const newSize = webpStats.size;
    const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1);
    
    return {
      success: true,
      pngPath,
      webpPath,
      originalSize,
      newSize,
      savings
    };
  } catch (error) {
    return {
      error: true,
      pngPath,
      message: error.message
    };
  }
}

async function main() {
  console.log('🖼️  Image Compression Script');
  console.log('============================\n');
  
  if (!existsSync(ASSETS_DIR)) {
    console.error(`Assets directory not found: ${ASSETS_DIR}`);
    process.exit(1);
  }
  
  console.log(`📁 Scanning: ${ASSETS_DIR}\n`);
  
  const pngFiles = await getPngFiles(ASSETS_DIR);
  console.log(`📄 Found ${pngFiles.length} PNG files\n`);
  
  let totalOriginal = 0;
  let totalNew = 0;
  let converted = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const pngPath of pngFiles) {
    const relativePath = path.relative(ROOT_DIR, pngPath);
    const result = await convertToWebP(pngPath);
    
    if (result.skipped) {
      skipped++;
      console.log(`⏭️  Skipped (up to date): ${relativePath}`);
    } else if (result.error) {
      errors++;
      console.log(`❌ Error: ${relativePath} - ${result.message}`);
    } else {
      converted++;
      totalOriginal += result.originalSize;
      totalNew += result.newSize;
      console.log(`✅ ${relativePath}`);
      console.log(`   ${formatBytes(result.originalSize)} → ${formatBytes(result.newSize)} (${result.savings}% saved)`);
    }
  }
  
  console.log('\n============================');
  console.log('📊 Summary:');
  console.log(`   Converted: ${converted} files`);
  console.log(`   Skipped: ${skipped} files`);
  console.log(`   Errors: ${errors} files`);
  
  if (converted > 0) {
    const totalSavings = ((totalOriginal - totalNew) / totalOriginal * 100).toFixed(1);
    console.log(`\n   Total original size: ${formatBytes(totalOriginal)}`);
    console.log(`   Total WebP size: ${formatBytes(totalNew)}`);
    console.log(`   Total savings: ${formatBytes(totalOriginal - totalNew)} (${totalSavings}%)`);
  }
  
  console.log('\n✨ Done! WebP images created alongside PNG files.');
  console.log('   The imageLoader will automatically prefer WebP when available.');
}

main().catch(console.error);
