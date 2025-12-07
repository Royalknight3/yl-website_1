const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const dbFile = './database.sqlite';

// 如果 uploads 资料夹不存在就创建
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

// 删除旧数据库（可选，确保干净）
if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);

const db = new sqlite3.Database(dbFile, (err) => {
  if (err) {
    console.error("打开数据库失败", err.message);
    return;
  }
  console.log("数据库打开成功");
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    price REAL,
    image TEXT,
    description TEXT,
    category_id INTEGER
  )`);

  // 加一个默认分类
  db.run("INSERT INTO categories (name) VALUES (?)", ["General"]);

  // 加一个示例商品
  db.run(
    `INSERT INTO products (name, price, image, description, category_id) VALUES (?, ?, ?, ?, ?)`,
    ["示例商品", 99.99, "/uploads/sample.jpg", "这是一个示例商品", 1]
  );
});

// **安全关闭数据库**
db.close((err)=>{
  if(err) console.error(err.message);
  else console.log("数据库初始化完成");
});
