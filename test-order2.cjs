const http = require('http');
const prisma = require('./node_modules/.prisma/client/index.js');

// First login
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
    console.log('Login:', res.statusCode);
    
    if (loginResponse.accessToken) {
      // Get a real menu item
      const menuRes = await new Promise((resolve) => {
        const menuReq = http.request({
          hostname: 'localhost',
          port: 3001,
          path: '/api/menu/items',
          method: 'GET',
          headers: { 'Authorization': `Bearer ${loginResponse.accessToken}` }
        }, resolve);
        menuReq.end();
      });
      
      let menuBody = '';
      menuRes.on('data', (chunk) => menuBody += chunk);
      menuRes.on('end', () => {
        const menuItems = JSON.parse(menuBody);
        console.log('Menu items count:', menuItems.length);
        
        if (menuItems.length > 0) {
          const testItem = menuItems[0];
          console.log('Using item:', testItem.name, testItem.id);
          
          // Now create order with real item
          const orderData = JSON.stringify({
            tableId: null,
            orderType: 'dine-in',
            items: [{ 
              menuItemId: testItem.id, 
              quantity: 1,
              notes: null
            }],
            notes: null
          });
          
          const orderOptions = {
            hostname: 'localhost',
            port: 3001,
            path: '/api/orders',
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json', 
              'Content-Length': orderData.length,
              'Authorization': `Bearer ${loginResponse.accessToken}`
            }
          };
          
          const orderReq = http.request(orderOptions, (orderRes) => {
            let orderBody = '';
            orderRes.on('data', (chunk) => orderBody += chunk);
            orderRes.on('end', () => {
              console.log('Order status:', orderRes.statusCode);
              console.log('Order response:', orderBody);
            });
          });
          
          orderReq.on('error', (e) => console.error('Order error:', e.message));
          orderReq.write(orderData);
          orderReq.end();
        }
      });
    }
  });
});

req.on('error', (e) => console.error('Login error:', e.message));
req.write(loginData);
req.end();