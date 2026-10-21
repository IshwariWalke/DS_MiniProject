const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const parentDir = path.dirname(projectRoot);
const ZIP_NAME = 'cloudjudge-distributed-system.zip';
const targetZip1 = path.join(parentDir, ZIP_NAME);
const targetZip2 = path.join(parentDir, 'syncspace-distributed-system', ZIP_NAME);
const localZip = path.join(projectRoot, ZIP_NAME);

console.log('================================================================');
console.log('   CLOUDJUDGE DISTRIBUTED SYSTEM — PROJECT ARCHIVER');
console.log('================================================================');
console.log(`Archiving project to: ${ZIP_NAME}`);

// Remove previous zips
[localZip, targetZip1, targetZip2].forEach(p => {
  if (fs.existsSync(p)) fs.unlinkSync(p);
});

// Windows tar.exe supports .zip format with -a flag and exclusion rules
const command = `tar.exe -a -c -f "${ZIP_NAME}" --exclude="node_modules" --exclude=".git" --exclude="*.zip" --exclude="dist" proto services k8s scripts docker-compose.yml package.json README.md`;

try {
  console.log('Executing zip compression (excluding node_modules and git history)...');
  execSync(command, { cwd: projectRoot, stdio: 'inherit' });

  if (fs.existsSync(localZip)) {
    // Copy to Downloads and syncspace folder so user can easily find it anywhere
    fs.copyFileSync(localZip, targetZip1);
    fs.copyFileSync(localZip, targetZip2);

    const stats = fs.statSync(targetZip1);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log('\n================================================================');
    console.log(`🎉 SUCCESS: Created ${ZIP_NAME} (${sizeMB} MB)`);
    console.log(`Locations:`);
    console.log(`  1. ${targetZip1}`);
    console.log(`  2. ${targetZip2}`);
    console.log(`  3. ${localZip}`);
    console.log('================================================================\n');
  } else {
    throw new Error('Zip file was not generated.');
  }
} catch (err) {
  console.error('Error during compression:', err.message);
}
