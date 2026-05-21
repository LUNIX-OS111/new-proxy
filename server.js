const express = require('express');
const http = require('http');
const { createProxyMiddleware } = require('http-proxy-middleware');
const socketio = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Proxy endpoint (example: to avoid CORS for fetching games/resources)
app.use('/proxy', createProxyMiddleware({
  changeOrigin: true,
  target: 'https://', // Will be used dynamically
  router: (req) => {
    // Dynamically route to requested target
    const url = req.query.url;
    return url ? url.split('/').slice(0, 3).join('/') : 'https://';
  },
  pathRewrite: {
    '^/proxy': '',
  },
  onProxyReq: (proxyReq, req) => {
    if (req.query.url) {
      proxyReq.path = req.query.url.replace(/^https?:\/\/[^\/]+/, '');
    }
  }
}));

// Real-time chat
io.on('connection', (socket) => {
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server on ${PORT}`));
