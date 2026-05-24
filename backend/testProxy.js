import http from 'http';
import https from 'https';

// Test image URL from an Unsplash redirect
const testUrl = 'https://source.unsplash.com/600x400/?Intel,i3-12100';
console.log('Testing proxy with URL:', testUrl);

// Simulate what the proxy does
const fetchImage = (url) => new Promise((resolve, reject) => {
  const parsed = new URL(url);
  const client = parsed.protocol === 'https:' ? https : http;
  const opts = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Accept': 'image/*,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  };
  console.log('Fetching:', parsed.href);
  const r = client.get(url, opts, (res) => {
    console.log('Response status:', res.statusCode);
    console.log('Response headers:', res.headers);
    
    // Handle redirects
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      console.log('Redirect to:', res.headers.location);
      res.resume();
      return resolve(fetchImage(new URL(res.headers.location, url).href));
    }
    
    if (res.statusCode >= 400) {
      return reject(new Error(`HTTP ${res.statusCode}`));
    }
    
    let size = 0;
    res.on('data', (chunk) => {
      size += chunk.length;
    });
    res.on('end', () => {
      console.log('Total bytes received:', size);
      resolve(size);
    });
  });
  
  r.on('error', reject);
  r.setTimeout(5000, () => {
    console.error('Request timeout');
    r.destroy();
  });
});

fetchImage(testUrl)
  .then(() => {
    console.log('✅ Proxy test passed - image fetched successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Proxy test failed:', err.message);
    process.exit(1);
  });
