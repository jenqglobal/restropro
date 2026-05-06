import fetch from 'node-fetch';

const response = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'owner@spice.com', password: 'password123' })
});

const data = await response.json();
console.log(data);