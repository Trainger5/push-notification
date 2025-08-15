const express = require('express');
const { getDatastores } = require('../storage/datastores');

const router = express.Router();

// Minimal metrics collection – no auth, keyed implicitly by last notification sent.
// This is intentionally simple and does not deanonymize users.

router.post('/open', async (req, res) => {
  try {
    const { metrics } = getDatastores();
    const cid = req.query && req.query.cid ? String(req.query.cid) : null;
    await metrics.insert({ type: 'open', customerId: cid, at: new Date().toISOString() });
  } catch (_) {}
  res.status(204).end();
});

router.post('/click', async (req, res) => {
  try {
    const { metrics } = getDatastores();
    const cid = req.query && req.query.cid ? String(req.query.cid) : null;
    await metrics.insert({ type: 'click', customerId: cid, at: new Date().toISOString() });
  } catch (_) {}
  res.status(204).end();
});

module.exports = router;


