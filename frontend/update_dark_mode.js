const fs = require('fs');
const path = require('path');

const files = [
  'D:\\Program Work\\Project in Vibe Coding\\FastShopBD\\frontend\\src\\app\\admin\\page.tsx',
  'D:\\Program Work\\Project in Vibe Coding\\FastShopBD\\frontend\\src\\app\\admin\\analytics\\page.tsx',
  'D:\\Program Work\\Project in Vibe Coding\\FastShopBD\\frontend\\src\\app\\admin\\coupons\\page.tsx',
  'D:\\Program Work\\Project in Vibe Coding\\FastShopBD\\frontend\\src\\app\\admin\\inventory\\page.tsx',
  'D:\\Program Work\\Project in Vibe Coding\\FastShopBD\\frontend\\src\\app\\admin\\orders\\page.tsx',
  'D:\\Program Work\\Project in Vibe Coding\\FastShopBD\\frontend\\src\\app\\admin\\payments\\page.tsx',
  'D:\\Program Work\\Project in Vibe Coding\\FastShopBD\\frontend\\src\\app\\admin\\products\\page.tsx'
];

const mappings = [
  { regex: /\bbg-ink-50(?!\/)\b/g, replacement: 'bg-ink-50 dark:bg-ink-950' },
  { regex: /\bbg-ink-50\/([0-9]+)\b/g, replacement: 'bg-ink-50/$1 dark:bg-ink-950/$1' },
  { regex: /\bbg-ink-100\b/g, replacement: 'bg-ink-100 dark:bg-ink-850' },
  { regex: /\bborder-ink-100\b/g, replacement: 'border-ink-100 dark:border-ink-800' },
  { regex: /\bborder-ink-200\b/g, replacement: 'border-ink-200 dark:border-ink-800' },
  { regex: /\btext-ink-900\b/g, replacement: 'text-ink-900 dark:text-ink-50' },
  { regex: /\btext-ink-800\b/g, replacement: 'text-ink-800 dark:text-ink-100' },
  { regex: /\btext-ink-700\b/g, replacement: 'text-ink-700 dark:text-ink-200' },
  { regex: /\btext-ink-600\b/g, replacement: 'text-ink-600 dark:text-ink-300' },
  { regex: /\btext-ink-500\b/g, replacement: 'text-ink-500 dark:text-ink-400' },
  { regex: /\bhover:bg-ink-50(?!\/)\b/g, replacement: 'hover:bg-ink-50 dark:hover:bg-ink-800' },
  { regex: /\bhover:bg-ink-50\/([0-9]+)\b/g, replacement: 'hover:bg-ink-50/$1 dark:hover:bg-ink-800/$1' },
  { regex: /\bhover:bg-ink-100\b/g, replacement: 'hover:bg-ink-100 dark:hover:bg-ink-800' },
  { regex: /\bshadow-xs\b/g, replacement: 'shadow-xs dark:shadow-none' },
  { regex: /\bhover:text-ink-900\b/g, replacement: 'hover:text-ink-900 dark:hover:text-ink-50' }
];

files.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log(`File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(file, 'utf8');

  // Input fields with bg-white
  content = content.replace(/<input([^>]*?)className="(.*?)\bbg-white\b(.*?)"/g, '<input$1className="$2bg-white dark:bg-ink-850 dark:text-ink-100 dark:border-ink-700$3"');
  content = content.replace(/<select([^>]*?)className="(.*?)\bbg-white\b(.*?)"/g, '<select$1className="$2bg-white dark:bg-ink-850 dark:text-ink-100 dark:border-ink-700$3"');

  // Active tab states using `bg-white text-ink-900 shadow-xs` → change to `bg-white dark:bg-ink-800 text-ink-900 dark:text-ink-50 shadow-xs dark:shadow-none`
  // First, map mappings
  mappings.forEach(m => {
    // Avoid double replacing
    // Split by string mapping, wait, better use a generic approach that avoids double replace
    const darkVariant = m.replacement.split(' ')[1];
    if (darkVariant) {
        content = content.replace(m.regex, (match) => {
            // if already contains darkVariant, ignore
            return match;
        });
    }
  });

  // A safer approach for adding classes:
  // We can parse className strings and add dark: variants.
});
