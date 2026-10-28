const express = require('express');

const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.status(200).send('Welcome to my server!');
});

app.get('/about', (req, res) => {
  res.status(200).json({
    name: 'Sai Kiran',
    section: 'AIDE-106',
    registrationNumber: '252U1R5076',
  });
});

app.get('/time', (req, res) => {
  res.status(200).json({
    dateTime: new Date(),
  });
});

app.use((req, res) => {
  res.status(404).send('404 - Page not found');
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
