const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'components/dashboard');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Add font-display to h1, h2, h3 tags if they have a className and don't already have font-display
  content = content.replace(/<(h[1-3])([^>]*className=")([^"]+)(")/g, (match, tag, before, classes, after) => {
    if (!classes.includes('font-display')) {
      return `<${tag}${before}font-display ${classes}${after}`;
    }
    return match;
  });

  // Also replace `{`className={` expressions for h1, h2, h3 if they exist
  // e.g. <h2 className={`...`}
  // simplified: just search for <h1, <h2, <h3 with className and ensure font-display
  content = content.replace(/<(h[1-3])([^>]*className=\{`)([^`]+)(`\})/g, (match, tag, before, classes, after) => {
    if (!classes.includes('font-display')) {
      return `<${tag}${before}font-display ${classes}${after}`;
    }
    return match;
  });

  // Replace blue- with brand-
  content = content.replace(/\b(bg|text|border|ring|from|to|shadow)-blue-/g, '$1-brand-');

  fs.writeFileSync(filePath, content, 'utf8');
}
console.log('Dashboard components updated.');
