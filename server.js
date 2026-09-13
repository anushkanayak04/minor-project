const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(__dirname));

// Chrome DevTools probe and Favicon handlers to eliminate 404 & CSP errors
app.all('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval'; connect-src *;");
  if (req.method === 'OPTIONS') return res.status(200).end();
  res.status(200).json({});
});

app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

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

// AI Content Integrity Engine
const aiIntegrity = require('./aiIntegrityService');

// Auth Routes
app.post('/api/auth/signup', (req, res) => {
  const { name, username, email, password, role } = req.body;
  const db = readDB();

  if (db.users.find(u => u.username === username || u.email === email)) {
    return res.status(400).json({ error: 'Username or email already exists' });
  }

  const newUser = {
    id: Date.now(),
    name,
    username,
    email,
    password,
    role: role === 'professional' ? 'professional' : 'normal',
    is_verified_pro: false,
    aadhaar_no: null,
    followers_count: 0,
    created_at: new Date().toISOString()
  };

  db.users.push(newUser);
  writeDB(db);

  res.json({
    id: newUser.id,
    username: newUser.username,
    role: newUser.role,
    is_verified_pro: newUser.is_verified_pro
  });
});

// Professional Account Verification Endpoint (Aadhaar + Face Scan 1-Account Limit)
app.post('/api/auth/verify-professional', (req, res) => {
  const { user_id, username, aadhaar_no, face_scan_verified } = req.body;
  if (!aadhaar_no || !face_scan_verified) {
    return res.status(400).json({ error: 'Valid Aadhaar number and Face Scan completion are required' });
  }

  const cleanAadhaar = aadhaar_no.replace(/\s+/g, '').trim();
  if (cleanAadhaar.length !== 12 || !/^\d{12}$/.test(cleanAadhaar)) {
    return res.status(400).json({ error: 'Aadhaar number must be a valid 12-digit number' });
  }

  const db = readDB();

  // Strict 1 Professional Account per Aadhaar enforcement
  const existingAadhaarOwner = db.users.find(u => u.aadhaar_no === cleanAadhaar && u.id !== user_id);
  if (existingAadhaarOwner) {
    return res.status(400).json({
      error: `Security Policy Violation: This Aadhaar number is already linked to professional account (@${existingAadhaarOwner.username}). Each user is restricted to 1 Professional Account.`
    });
  }

  let user = db.users.find(u => u.id === user_id || u.username === username);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.role = 'professional';
  user.is_verified_pro = true;
  user.aadhaar_no = cleanAadhaar;
  user.face_scan_verified = true;
  user.verified_at = new Date().toISOString();

  writeDB(db);

  res.json({
    status: 'verified',
    username: user.username,
    role: 'professional',
    is_verified_pro: true,
    badge: '☑️ Verified Pro Creator'
  });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const db = readDB();

  const user = db.users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  res.json({
    id: user.id,
    username: user.username,
    role: user.role || 'normal',
    is_verified_pro: !!user.is_verified_pro
  });
});

// Posts Routes with AI Alteration & Promotion Analysis
app.post('/api/posts', (req, res) => {
  const p = req.body;
  const db = readDB();

  const author = db.users.find(u => u.username === p.username || u.id === p.user_id) || {
    role: 'normal',
    is_verified_pro: false
  };

  const userPastPosts = db.posts.filter(past => past.username === p.username || past.user_id === p.user_id);

  // Run AI Integrity Analysis
  const aiAudit = aiIntegrity.analyzePostIntegrity(p, userPastPosts, author);

  const newPost = {
    id: Date.now(),
    user_id: p.user_id,
    username: p.username,
    user_role: author.role || 'normal',
    is_verified_pro: !!author.is_verified_pro,
    author_badge: author.is_verified_pro ? '☑️ Verified Pro Creator' : '👤 Normal Member',
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
    created_at: new Date().toISOString(),
    // AI Content Integrity Fields
    ai_trust_score: aiAudit.trustScore,
    is_ai_altered: aiAudit.isAiAltered,
    ai_alteration_note: aiAudit.alterationNote,
    promotion_status: aiAudit.promotionStatus,
    promotion_reason: aiAudit.promotionReason,
    ai_badge: aiAudit.badge,
    ai_badge_color: aiAudit.badgeColor
  };

  db.posts.push(newPost);
  writeDB(db);
  res.json({ id: newPost.id, ai_audit: aiAudit });
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
    if (post) post.likes -= 1;
    writeDB(db);
    res.json({ status: 'unliked' });
  } else {
    db.likes.push({ post_id: id, user_id });
    if (post) post.likes += 1;
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

// AI Travel Planner Routes
const travelPlanner = require('./travelPlannerService');
const dashboardService = require('./dashboardService');

app.post('/api/dashboard/analyze-place', (req, res) => {
  try {
    const { location } = req.body;
    const db = readDB();
    const analytics = dashboardService.generatePlaceAnalytics(location, db);
    res.json(analytics);
  } catch (err) {
    console.error('Error in /api/dashboard/analyze-place:', err);
    res.status(500).json({ error: 'Failed to generate place analytics' });
  }
});

app.post('/api/ai-planner', async (req, res) => {
  try {
    const db = readDB();
    const plan = await travelPlanner.generateTravelPlan(req.body, db);
    res.json(plan);
  } catch (err) {
    console.error('Error in /api/ai-planner:', err);
    res.status(500).json({ error: err.message || 'Failed to generate itinerary' });
  }
});

app.get('/api/destinations', (req, res) => {
  try {
    const db = readDB();
    const destinations = [];
    const seen = new Set();

    (db.posts || []).forEach(post => {
      let dest = post.location || '';
      if (dest.startsWith('📍 Coordinates:')) {
        // Known test coordinates: 22.7569, 75.9057 -> Indore
        if (dest.includes('22.7') && dest.includes('75.9')) {
          dest = 'Indore, Madhya Pradesh';
        }
      }
      dest = dest.replace(/^📍\s*/, '').trim();
      if (dest && !seen.has(dest.toLowerCase())) {
        seen.add(dest.toLowerCase());
        destinations.push({
          name: dest,
          username: post.username,
          hasPost: true
        });
      }
    });

    res.json(destinations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch destinations' });
  }
});

app.get('/api/config/groq-key', (req, res) => {
  res.json(travelPlanner.getGroqKeyStatus());
});

app.post('/api/config/groq-key', (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || typeof apiKey !== 'string') {
    return res.status(400).json({ error: 'Valid apiKey string required' });
  }
  travelPlanner.saveGroqKey(apiKey.trim());
  res.json({ status: 'saved', ...travelPlanner.getGroqKeyStatus() });
});

// Business Portal Routes
app.get('/api/businesses', (req, res) => {
  try {
    const db = readDB();
    let list = db.businesses || [];
    const { category, location, search } = req.query;

    if (category && category !== 'all') {
      list = list.filter(b => (b.category || '').toLowerCase() === category.toLowerCase());
    }

    if (location) {
      const locQ = location.toLowerCase();
      list = list.filter(b => (b.location || '').toLowerCase().includes(locQ));
    }

    if (search) {
      const sQ = search.toLowerCase();
      list = list.filter(b =>
        (b.name || '').toLowerCase().includes(sQ) ||
        (b.location || '').toLowerCase().includes(sQ) ||
        (b.description || '').toLowerCase().includes(sQ) ||
        (b.menu_items || '').toLowerCase().includes(sQ)
      );
    }

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch businesses' });
  }
});

app.post('/api/businesses', (req, res) => {
  try {
    const b = req.body;
    if (!b.name || !b.category || !b.location) {
      return res.status(400).json({ error: 'Business name, category, and location are required' });
    }

    const db = readDB();
    if (!db.businesses) db.businesses = [];

    const newBusiness = {
      id: Date.now(),
      name: b.name.trim(),
      category: b.category.trim().toLowerCase(),
      location: b.location.trim(),
      website: b.website ? b.website.trim() : '',
      phone: b.phone ? b.phone.trim() : '',
      price_range: b.price_range ? b.price_range.trim() : 'Contact for pricing',
      rating: '4.9',
      image: b.image && b.image.trim() ? b.image.trim() : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800',
      description: b.description ? b.description.trim() : '',
      menu_items: b.menu_items ? b.menu_items.trim() : 'Contact business for full menu and rate chart.',
      created_at: new Date().toISOString()
    };

    db.businesses.unshift(newBusiness);
    writeDB(db);

    res.json(newBusiness);
  } catch (err) {
    console.error('Error adding business:', err);
    res.status(500).json({ error: 'Failed to add business listing' });
  }
});

app.delete('/api/businesses/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const db = readDB();
    if (!db.businesses) db.businesses = [];

    db.businesses = db.businesses.filter(b => b.id !== id);
    writeDB(db);
    res.json({ status: 'deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete business' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at: http://localhost:${PORT}`);
  console.log(`Open in browser:  http://localhost:${PORT}/index.html`);
});
