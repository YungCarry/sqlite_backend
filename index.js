const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

app.use(express.json());


const db = new sqlite3.Database(':memory:');
db.serialize(() => {
  db.run(`CREATE TABLE users (
    email TEXT PRIMARY KEY,
    firstName TEXT,
    lastName TEXT,
    class TEXT
  )`);
});


const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'User API',
      version: '1.0.0',
      description: 'API for managing users'
    },
    servers: [
      {
        url: `http://localhost:${port}/users`
      }
    ]
  },
  apis: ['./index.js']
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/users/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - firstName
 *         - lastName
 *       properties:
 *         email:
 *           type: string
 *           description: The user's email
 *         firstName:
 *           type: string
 *           description: The user's first name
 *         lastName:
 *           type: string
 *           description: The user's last name
 *         class:
 *           type: string
 *           description: The user's class
 */

/**
 * @swagger
 * /:
 *   get:
 *     summary: Retrieve a list of users
 *     responses:
 *       200:
 *         description: A list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
app.get('/users', (req, res) => {
  db.all('SELECT * FROM users', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

/**
 * @swagger
 * /{email}:
 *   get:
 *     summary: Retrieve a single user by email
 *     parameters:
 *       - in: path
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: The user's email
 *     responses:
 *       200:
 *         description: A single user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
app.get('/users/:email', (req, res) => {
  const email = req.params.email;
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(row);
  });
});

/**
 * @swagger
 * /:
 *   post:
 *     summary: Create a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User created
 */
app.post('/users', (req, res) => {
  const { email, firstName, lastName, class: userClass } = req.body;
  db.run('INSERT INTO users (email, firstName, lastName, class) VALUES (?, ?, ?, ?)', [email, firstName, lastName, userClass], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({ email, firstName, lastName, class: userClass });
  });
});

/**
 * @swagger
 * /{email}:
 *   put:
 *     summary: Update a user by email
 *     parameters:
 *       - in: path
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: The user's email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User updated
 */
app.put('/users/:email', (req, res) => {
  const email = req.params.email;
  const { firstName, lastName, class: userClass } = req.body;
  db.run('UPDATE users SET firstName = ?, lastName = ?, class = ? WHERE email = ?', [firstName, lastName, userClass, email], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ email, firstName, lastName, class: userClass });
  });
});

/**
 * @swagger
 * /{email}:
 *   delete:
 *     summary: Delete a user by email
 *     parameters:
 *       - in: path
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: The user's email
 *     responses:
 *       200:
 *         description: User deleted
 */
app.delete('/users/:email', (req, res) => {
  const email = req.params.email;
  db.run('DELETE FROM users WHERE email = ?', [email], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ message: 'User deleted' });
  });
});

app.listen(port, () => {
  console.log(`A szerver fut: http://localhost:${port}/`);
});

