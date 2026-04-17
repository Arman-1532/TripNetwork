const http = require('http');

const data = JSON.stringify({
    total_amount: 150.75,
    cus_name: 'Test Traveler',
    cus_email: 'test@example.com'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/payment/init',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    let body = '';
    res.on('data', (chunk) => {
        body += chunk;
    });
    res.on('end', () => {
        console.log('BODY:');
        try {
            const parsed = JSON.parse(body);
            console.log(JSON.stringify(parsed, null, 2));
            if (parsed.url && parsed.url.includes('sslcommerz.com')) {
                console.log('\n✅ Verification Success: Received a valid SSLCommerz payment URL!');
            } else {
                console.log('\n❌ Verification Failed: No URL received or invalid URL.');
            }
        } catch (e) {
            console.log(body);
            console.error('Failed to parse response body as JSON');
        }
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
