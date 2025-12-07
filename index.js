const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + '-' + Math.round(Math.random()*1e9) + ext;
    cb(null, name);
  }
});
const upload = multer({ storage });

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));

const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'));

// ----- 简易后台登录 -----
const ADMIN_USER = 'admin';
const ADMIN_PASS = '1234';
const ADMIN_TOKEN = 'ADMINTOKEN_SIMPLE_DEMO';

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return res.json({ success: true, token: ADMIN_TOKEN });
  }
  res.json({ success: false });
});

function requireAdmin(req, res, next){
  const token = req.headers['x-admin-token'] || '';
  if(token === ADMIN_TOKEN) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

// ----- Categories -----
app.get('/api/categories', (req,res)=>{
  db.all('SELECT * FROM categories', [], (err, rows)=>{
    if(err) return res.status(500).json({error: err.message});
    res.json(rows);
  });
});

app.post('/api/categories', requireAdmin, (req,res)=>{
  const { name } = req.body;
  db.run('INSERT INTO categories(name) VALUES(?)', [name], function(err){
    if(err) return res.status(500).json({error: err.message});
    res.json({id: this.lastID});
  });
});

// ----- Products -----
app.get('/api/products', (req,res)=>{
  const cat = req.query.category_id;
  const sql = cat ? 'SELECT * FROM products WHERE category_id=?' : 'SELECT * FROM products';
  const params = cat ? [cat] : [];
  db.all(sql, params, (err, rows)=>{
    if(err) return res.status(500).json({error: err.message});
    res.json(rows);
  });
});

app.post('/api/products', requireAdmin, upload.single('image'), (req,res)=>{
  const file = req.file;
  const imagePath = file ? '/uploads/' + file.filename : (req.body.image || '');
  const { name, price, description, category_id } = req.body;
  db.run(
    `INSERT INTO products (name, price, image, description, category_id) VALUES (?, ?, ?, ?, ?)`,
    [name, price||0, imagePath, description||'', category_id||null],
    function(err){
      if(err) return res.status(500).json({error: err.message});
      res.json({id: this.lastID});
    }
  );
});

app.delete('/api/products/:id', requireAdmin, (req,res)=>{
  db.run('DELETE FROM products WHERE id=?', [req.params.id], function(err){
    if(err) return res.status(500).json({error: err.message});
    res.json({ok:true});
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log("Server running on port", PORT));
