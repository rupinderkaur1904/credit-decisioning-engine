const express = require('express');
const path = require('path');

const app = express();

const applicantsRouter = require('./routes/applicants');
const applicationsRouter = require('./routes/applications');

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/applicants', applicantsRouter);
app.use('/applications', applicationsRouter);

module.exports = app;
