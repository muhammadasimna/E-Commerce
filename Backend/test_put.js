const http = require('http');

const data = JSON.stringify({
  name: 'Test Update',
  price: 99.99,
  image_url: 'http://example.com/img.jpg',
  category: 'Test',
  description: 'Test description',
  stock: 5
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/products/4',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
