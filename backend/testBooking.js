(async () => {
  try {
    const res = await fetch('http://localhost:5001/api/repairs/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'node test',
        customerPhone: '0912345678',
        deviceType: 'printer',
        deviceName: '2900',
        issueDescription: 'test booking from node'
      })
    });
    const body = await res.text();
    console.log('HTTP', res.status);
    console.log(body);
  } catch (e) {
    console.error('Request failed', e);
  }
})();
