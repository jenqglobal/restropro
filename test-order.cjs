const http = require('http');

const loginData = JSON.stringify({ email: 'owner@spice.com', password: 'password123' });

const loginOptions = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/auth/login',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': loginData.length }
};

const req = http.request(loginOptions, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', async () => {
    const loginResponse = JSON.parse(body);
    console.log('Login status:', res.statusCode);
    
    if (loginResponse.accessToken) {
      const token = loginResponse.accessToken;
      const orderData = JSON.stringify({
        tableId: null,
        orderType: 'dine-in',
        items: [{ menuItemId: 'test-id', quantity: 1 }]
      });
      
      const orderOptions = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/orders',
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Content-Length': orderData.length,
          'Authorization': `Bearer ${token}`
        }
      };
      
      const orderReq = http.request(orderOptions, (orderRes) => {
        let orderBody = '';
        orderRes.on('data', (chunk) => orderBody += chunk);
        orderRes.on('end', () => {
          console.log('Order status:', orderRes.statusCode);
          console.log('Order response:', orderBody.substring(0, 500));
        });
      });
      
      orderReq.on('error', (e) => console.error('Order error:', e.message));
      orderReq.write(orderData);
      orderReq.end();
    }
  });
});

req.on('error', (e) => console.error('Login error:', e.message));
req.write(loginData);
req.end();