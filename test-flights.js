const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/flights/search?origin=DAC&destination=CXB&date=2026-03-27&adults=1',
    method: 'GET'
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    res.setEncoding('utf8');
    let body = '';
    res.on('data', (chunk) => {
        body += chunk;
    });
    res.on('end', () => {
        console.log('BODY:');
        try {
            const parsed = JSON.parse(body);
            console.log(JSON.stringify(parsed, null, 2).substring(0, 500) + '...');
            console.log(`\nItems received: ${Array.isArray(parsed) ? parsed.length : 'N/A'}`);
            if (res.headers['x-data-source'] === 'mock-data') {
                console.log('\n✅ Verification Success: Received Mock Data (as expected if real keys not active yet).');
            } else if (res.headers['x-data-source'] === 'amadeus-api') {
                console.log('\n✅ Verification Success: Received real Amadeus API data!');
            }
        } catch (e) {
            console.log(body);
            console.error('Failed to parse response body as JSON');
        }
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
    console.log('Ensure the server is running on port 3000 (npm run dev)');
});

req.end();
