// Step 6: server.js (JSON Server + Express Backend)

const jsonServer = require('json-server');
const express = require('express');
const path = require('path');
const server = express();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

server.use(middlewares);
server.use(express.json());

// Custom routes for withdrawal request
server.post('/withdraw', (req, res) => {
  const db = router.db;
  const userId = req.body.userId;
  const amount = req.body.amount;

  if (!userId || !amount) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  const entry = {
    id: Date.now(),
    userId,
    amount,
    status: 'pending'
  };

  db.get('withdrawals').push(entry).write();
  res.status(201).json({ message: 'Withdrawal request submitted', entry });
});

// Use default json-server router
server.use(router);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`JSON Server running on port ${PORT}`);
});
