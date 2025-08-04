// ====== Step 6: server.js (JSON Server + Express Backend) ======

const jsonServer = require('json-server');
const express = require('express');
const path = require('path');
const server = express();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

server.use(middlewares);
server.use(express.json());

// ====== Custom Route: POST /withdraw ======
server.post('/withdraw', (req, res) => {
  const db = router.db;
  const { userId, amount } = req.body;

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

// ====== Custom Route: POST /withdraw-request ======
// (Alternative/Extended Logic with earnings zeroing)
server.post('/withdraw-request', (req, res) => {
  const db = router.db;
  const { userId } = req.body;

  // Find user by ID
  const user = db.get('users').find({ id: userId }).value();

  if (!user) return res.status(404).send("User not found");

  // Record withdrawal request
  db.get('withdrawals').push({
    id: Date.now(),
    userId: userId,
    time: new Date().toISOString(),
    amount: user.earnings
  }).write();

  // Reset user earnings
  db.get('users').find({ id: userId }).assign({ earnings: 0 }).write();

  res.send("Withdrawal request submitted");
});

// ====== Json-Server Default Router ======
server.use(router);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`JSON Server running on port ${PORT}`);
});
