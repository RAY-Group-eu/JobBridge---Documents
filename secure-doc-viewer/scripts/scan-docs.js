import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Adjust paths based on where the script is run. 
// Assuming run from root via 'npm run scan-docs'
const docsDir = path.join(process.cwd(), 'public', 'docs');
const manifestPath = path.join(process.cwd(), 'public', 'docs-manifest.json');

console.log(`Scanning PDFs in: ${docsDir}`);

if (!fs.existsSync(docsDir)) {
    console.error(`Directory not found: ${docsDir}`);
    // Create it to avoid crash
    fs.mkdirSync(docsDir, { recursive: true });
}

try {
    const files = fs.readdirSync(docsDir);
    const pdfs = files
        .filter(file => file.toLowerCase().endsWith('.pdf'))
        .map(file => {
            const filePath = path.join(docsDir, file);
            const stats = fs.statSync(filePath);
            return {
                id: file, // unique enough for local files
                filename: file,
                path: `/docs/${file}`,
                title: file.replace('.pdf', '').replace(/[-_]/g, ' '),
                size: stats.size,
                updatedAt: stats.mtime.toISOString(),
            };
        });

    fs.writeFileSync(manifestPath, JSON.stringify(pdfs, null, 2));
    console.log(`Generated manifest with ${pdfs.length} files at ${manifestPath}`);
} catch (err) {
    console.error('Error scanning docs:', err);
    process.exit(1);
}
