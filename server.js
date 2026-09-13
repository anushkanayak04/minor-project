const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(__dirname));

const DB_FILE = path.join(__dirname, 'db.json');

// Initialize JSON Database if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({
    users: [],
    posts: [],
    comments: [],
    likes: [],
    follows: []
  }, null, 2));
}

function readDB() {
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Auth Routes
app.post('/api/auth/signup', (req, res) => {
  const { name, username, email, password } = req.body;
  const db = readDB();
  
  if (db.users.find(u => u.username === username || u.email === email)) {
    return res.status(400).json({ error: 'Username or email already exists' });
  }
  
  const newUser = { id: Date.now(), name, username, email, password };
  db.users.push(newUser);
  writeDB(db);
  
  res.json({ id: newUser.id, username });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const db = readDB();
  
  const user = db.users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  
  res.json({ id: user.id, username: user.username });
});

// Posts Routes
app.post('/api/posts', (req, res) => {
  const p = req.body;
  const db = readDB();
  
  const newPost = {
    id: Date.now(),
    user_id: p.user_id,
    username: p.username,
    location: p.location,
    media: p.media,
    description: p.description,
    hotel_name: p.hotel_name,
    hotel_contact: p.hotel_contact,
    hotel_feedback: p.hotel_feedback,
    transport_type: p.transport_type,
    transport_price: p.transport_price,
    transport_contact: p.transport_contact,
    route_desc: p.route_desc,
    route_cost: p.route_cost,
    food_place: p.food_place,
    food_price: p.food_price,
    food_location: p.food_location,
    food_feedback: p.food_feedback,
    must_visit_name: p.must_visit_name,
    must_visit_transport: p.must_visit_transport,
    likes: 0,
    created_at: new Date().toISOString()
  };
  
  db.posts.push(newPost);
  writeDB(db);
  res.json({ id: newPost.id });
});

app.get('/api/posts', (req, res) => {
  const db = readDB();
  // Reverse to get newest first
  const posts = [...db.posts].reverse().map(post => {
    return {
      ...post,
      comments: db.comments.filter(c => c.post_id === post.id)
    };
  });
  res.json(posts);
});

app.post('/api/posts/:id/like', (req, res) => {
  const id = parseInt(req.params.id);
  const { user_id } = req.body;
  const db = readDB();
  
  const likeIndex = db.likes.findIndex(l => l.post_id === id && l.user_id === user_id);
  const post = db.posts.find(p => p.id === id);
  
  if (likeIndex !== -1) {
    db.likes.splice(likeIndex, 1);
    if(post) post.likes -= 1;
    writeDB(db);
    res.json({ status: 'unliked' });
  } else {
    db.likes.push({ post_id: id, user_id });
    if(post) post.likes += 1;
    writeDB(db);
    res.json({ status: 'liked' });
  }
});

app.post('/api/posts/:id/comment', (req, res) => {
  const id = parseInt(req.params.id);
  const { username, text } = req.body;
  const db = readDB();
  
  const comment = { id: Date.now(), post_id: id, username, text, created_at: new Date().toISOString() };
  db.comments.push(comment);
  writeDB(db);
  
  res.json(comment);
});

app.post('/api/users/follow', (req, res) => {
  const { follower_id, following_username } = req.body;
  const db = readDB();
  
  const followIndex = db.follows.findIndex(f => f.follower_id === follower_id && f.following_username === following_username);
  
  if (followIndex !== -1) {
    db.follows.splice(followIndex, 1);
    writeDB(db);
    res.json({ status: 'unfollowed' });
  } else {
    db.follows.push({ follower_id, following_username });
    writeDB(db);
    res.json({ status: 'followed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at: http://localhost:${PORT}`);
  console.log(`Open in browser:  http://localhost:${PORT}/index.html`);
});
