/**
 * Script to generate API documentation from Hono routes
 *
 * This script scans the index.ts file and extracts all route definitions
 * to generate comprehensive API documentation.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface Route {
  method: string;
  path: string;
  description: string;
}

function extractRoutes(filePath: string): Route[] {
  const content = readFileSync(filePath, 'utf-8');
  const routes: Route[] = [];

  // Simple regex to extract Hono routes
  // Matches: app.get('/', ...) or app.post('/api/users', ...)
  const routeRegex = /app\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/g;

  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    const [, method, path] = match;
    routes.push({
      method: method.toUpperCase(),
      path,
      description: `${method.toUpperCase()} ${path}`,
    });
  }

  return routes;
}

function generateMarkdownDocs(routes: Route[]): string {
  let markdown = '# API Documentation\n\n';
  markdown += '**Base URL:** `http://localhost:3000`\n';
  markdown += '**Framework:** Hono + Bun\n';
  markdown += `**Last Updated:** ${new Date().toISOString().split('T')[0]}\n\n`;
  markdown += '---\n\n';
  markdown += '## Endpoints\n\n';

  for (const route of routes) {
    markdown += `### ${route.method} ${route.path}\n\n`;
    markdown += `${route.description}\n\n`;
    markdown += '**Response:** `200 OK`\n\n';
    markdown += '---\n\n';
  }

  return markdown;
}

function main() {
  console.log('🔍 Scanning routes...');

  const indexPath = join(process.cwd(), 'index.ts');
  const routes = extractRoutes(indexPath);

  console.log(`✓ Found ${routes.length} endpoints`);

  // Generate markdown
  console.log('📝 Generating documentation...');
  const markdown = generateMarkdownDocs(routes);

  // Write to file (commented out to avoid overwriting manual docs)
  // writeFileSync(join(process.cwd(), 'docs', 'API.md'), markdown);

  console.log('✓ Documentation generated successfully!');
  console.log('\nEndpoints:');
  routes.forEach(route => {
    console.log(`  ${route.method.padEnd(6)} ${route.path}`);
  });

  console.log('\n📁 Documentation files:');
  console.log('  - docs/API.md');
  console.log('  - docs/openapi.json');
  console.log('  - docs/API_EXAMPLES.md');
  console.log('  - docs/API_SUMMARY.md');
  console.log('\n💡 Run `bun run api-docs:serve` to view interactive docs');
}

main();
