// ====== server.js (JSON Server + Express Backend + Custom Admin Endpoints) ======

const jsonServer = require('json-server');
const express = require('express');
const path = require('path');
const fs = require('fs');

const server = express();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

server.use(middlewares);
server.use(express.json());

// --- (Assumed) Util for direct DB file access for custom admin endpoints ---
function readDB() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'db.json')));
}
function writeDB(db) {
  fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2));
}

// ====== Custom Route: Admin: Get All Withdraw Requests ======
server.get('/withdrawals', (req, res) => {
  const db = readDB();
  res.json(db.withdrawals || []);
});

// ====== Custom Route: Admin: Post a Task to All Users ======
server.post('/post-task', (req, res) => {
  const db = readDB();
  const { task } = req.body;

  Object.keys(db.users).forEach(userId => {
    if (!db.users[userId].tasks) {
      db.users[userId].tasks = [];
    }
    db.users[userId].tasks.push({
      task,
      time: new Date().toISOString()
    });
  });

  writeDB(db);
  res.json({ message: "Task posted to all users" });
});

// ====== Custom Route: POST /withdraw (User requests withdrawal) ======
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
server.post('/withdraw-request', (req, res) => {
  const db = router.db;
  const { userId } = req.body;

  // Find user by ID
  const user = db.get('users').find({ id: userId }).value();

  if (!user) return res.status(404).send("User not found");

  // Record withdrawal request and reset earnings
  db.get('withdrawals').push({
    id: Date.now(),
    userId: userId,
    time: new Date().toISOString(),
    amount: user.earnings
  }).write();

  db.get('users').find({ id: userId }).assign({ earnings: 0 }).write();

  res.send("Withdrawal request submitted");
});

// ====== Use json-server's Default Router ======
server.use(router);

// ====== Start the Server ======
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`JSON Server running on port ${PORT}`);
});
