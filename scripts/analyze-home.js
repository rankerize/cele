const fs = require('fs');

async function extractSEO() {
  const res = await fetch('https://rankerize.com/');
  const html = await res.text();
  
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i) || html.match(/<meta[^>]*content="([^"]*)"[^>]*name="description"[^>]*>/i);
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/gi);
  const imgMatches = [...html.matchAll(/<img[^>]+src="([^">]+)"[^>]*>/gi)];

  const data = {
    title: titleMatch ? titleMatch[1] : 'No title',
    description: descMatch ? descMatch[1] : 'No description',
    h1: h1Match ? h1Match.map(h => h.replace(/<[^>]+>/g, '').trim()) : [],
    images: imgMatches.map(m => m[1]).filter(src => src.startsWith('http') || src.startsWith('/'))
  };

  fs.writeFileSync('scripts/home-seo-data.json', JSON.stringify(data, null, 2));
  console.log("SEO and Images extraction complete.");
}

extractSEO();
