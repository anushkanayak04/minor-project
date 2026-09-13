const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '.env');

// Simple .env parser and writer without external dependency
function loadEnv() {
  if (fs.existsSync(ENV_FILE)) {
    try {
      const content = fs.readFileSync(ENV_FILE, 'utf8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.substring(0, eqIdx).trim();
          let val = trimmed.substring(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          process.env[key] = val;
        }
      });
    } catch (e) {
      console.warn('Could not read .env file:', e.message);
    }
  }
}

loadEnv();

function saveGroqKey(apiKey) {
  let lines = [];
  if (fs.existsSync(ENV_FILE)) {
    lines = fs.readFileSync(ENV_FILE, 'utf8').split('\n');
  }
  let found = false;
  lines = lines.map(line => {
    if (line.trim().startsWith('GROQ_API_KEY=')) {
      found = true;
      return `GROQ_API_KEY="${apiKey}"`;
    }
    return line;
  });
  if (!found) {
    lines.push(`GROQ_API_KEY="${apiKey}"`);
  }
  fs.writeFileSync(ENV_FILE, lines.join('\n'), 'utf8');
  process.env.GROQ_API_KEY = apiKey;
}

function getGroqKeyStatus() {
  const key = process.env.GROQ_API_KEY || '';
  if (!key) return { configured: false, masked: null };
  const masked = key.length > 8 ? `${key.substring(0, 4)}...${key.substring(key.length - 4)}` : '****';
  return { configured: true, masked };
}

// Search DB posts for matching destination or coordinates
function searchPlatformPosts(destination, db) {
  if (!db || !db.posts || !Array.isArray(db.posts)) return [];
  const query = (destination || '').toLowerCase().trim();
  if (!query) return [];

  const queryTerms = query.split(/[\s,]+/).filter(t => t.length > 2);

  return db.posts.filter(post => {
    const loc = (post.location || '').toLowerCase();
    const desc = (post.description || '').toLowerCase();
    const foodPlace = (post.food_place || '').toLowerCase();
    const foodLoc = (post.food_location || '').toLowerCase();
    const mustVisit = (post.must_visit_name || '').toLowerCase();
    const hotel = (post.hotel_name || '').toLowerCase();

    // Direct match
    if (loc.includes(query) || desc.includes(query) || foodPlace.includes(query) || mustVisit.includes(query) || hotel.includes(query)) {
      return true;
    }

    // Term-by-term match
    if (queryTerms.some(term => loc.includes(term) || desc.includes(term) || mustVisit.includes(term) || foodPlace.includes(term))) {
      return true;
    }

    // Coordinates match for Indore (22.7569, 75.9057)
    if (query.includes('indore') && (loc.includes('22.7') || loc.includes('75.9'))) {
      return true;
    }

    return false;
  });
}

// Extract signals from matched platform posts
function extractInfluencerSignals(matchedPosts) {
  if (!matchedPosts || matchedPosts.length === 0) return null;

  const stays = [];
  const transports = [];
  const routes = [];
  const foods = [];
  const spots = [];
  const influencers = new Set();

  matchedPosts.forEach(post => {
    if (post.username) influencers.add(post.username);

    if (post.hotel_name || post.hotel_feedback) {
      stays.push({
        name: post.hotel_name || 'Verified Community Stay',
        note: post.hotel_feedback || 'Recommended by verified community traveler',
        contact: post.hotel_contact || 'Available via platform community',
        influencer: post.username
      });
    }

    if (post.transport_type) {
      transports.push({
        type: post.transport_type,
        price: post.transport_price || 'Local rate',
        contact: post.transport_contact || 'Local pickup point',
        influencer: post.username
      });
    }

    if (post.route_desc) {
      routes.push({
        description: post.route_desc,
        cost: post.route_cost || 'N/A',
        influencer: post.username
      });
    }

    if (post.food_place || post.food_feedback) {
      foods.push({
        place: post.food_place || 'Local Specialty Joint',
        location: post.food_location || post.location || 'Central Area',
        price: post.food_price || 'Moderate',
        feedback: post.food_feedback || 'Highly rated by verified traveler',
        influencer: post.username
      });
    }

    if (post.must_visit_name) {
      spots.push({
        name: post.must_visit_name,
        transport: post.must_visit_transport || 'Accessible via local cab/auto',
        influencer: post.username,
        description: post.description || ''
      });
    } else if (post.location && !post.location.startsWith('📍 Coordinates:')) {
      spots.push({
        name: post.location.replace(/^📍\s*/, ''),
        transport: post.transport_type || 'Local transport',
        influencer: post.username,
        description: post.description || ''
      });
    }
  });

  return {
    matchedCount: matchedPosts.length,
    influencers: Array.from(influencers),
    stays,
    transports,
    routes,
    foods,
    spots
  };
}

// Call Groq API with System Prompt and strict JSON schema
async function callGroqAPI(apiKey, promptPayload) {
  const systemPrompt = `# ROLE
You are an AI Travel Planner for "Bro Said He Knows A Spot" (a platform for verified travel recommendations).
Your job is to turn a verified influencer's post about a destination into a complete, actionable travel plan, enriched with real data — and to do the same for any destination even when no influencer post exists on the platform.

# GUIDELINES:
- If influencer signals are provided: prioritize those exact spots, hotels, foods, and transport, but fill all missing elements (transports, multiple stay tiers, sequencing, daily routes) with accurate travel intelligence.
- If NO influencer post exists on the platform: state so clearly, and provide accurate, realistic travel recommendations (real hotels, real heritage/scenic spots, real iconic eateries, accurate transit options, and sensible budget breakdowns).
- Never fabricate fake hotels or prices; use established real accommodations and realistic costs.
- Always return clean, parseable JSON matching the schema below.

# JSON SCHEMA REQUIRED:
{
  "destination": "Name of destination",
  "has_platform_post": true or false,
  "influencer_names": ["username1"],
  "snapshot": "2-3 sentences on vibe, ideal season, and recommended trip length.",
  "getting_there": "Detailed flight/train/road options with nearest airport/station, travel times, and estimated costs.",
  "stay_options": [
    {
      "tier": "budget",
      "name": "Specific real hotel/hostel name",
      "area": "Neighborhood name",
      "price_per_night": "e.g. ₹800 - ₹1,500 / $15 - $25",
      "note": "Description and why stay here",
      "source": "influencer_post" or "web_search",
      "verified": true or false
    },
    {
      "tier": "mid",
      "name": "Specific real hotel name",
      "area": "Neighborhood name",
      "price_per_night": "e.g. ₹3,000 - ₹5,500 / $45 - $75",
      "note": "Description",
      "source": "influencer_post" or "web_search",
      "verified": true or false
    },
    {
      "tier": "luxury",
      "name": "Specific real luxury stay name",
      "area": "Neighborhood name",
      "price_per_night": "e.g. ₹9,000+ / $150+",
      "note": "Description",
      "source": "influencer_post" or "web_search",
      "verified": true or false
    }
  ],
  "itinerary": [
    {
      "day": 1,
      "title": "Theme of Day (e.g. Heritage & Old City Trails)",
      "activities": [
        {
          "time": "Morning (09:00 AM)",
          "title": "Spot or Activity Name",
          "source": "influencer_post" or "web_search",
          "transport": "e.g. Metro / Auto Rickshaw (₹150)",
          "cost": "e.g. ₹200 entry",
          "note": "Tips and details"
        },
        {
          "time": "Afternoon (01:30 PM)",
          "title": "Lunch & Exploration",
          "source": "influencer_post" or "web_search",
          "transport": "Walkable / 10 min cab",
          "cost": "e.g. ₹600",
          "note": "Recommended dish or activity"
        },
        {
          "time": "Evening (05:30 PM)",
          "title": "Sunset View & Local Bazaar",
          "source": "influencer_post" or "web_search",
          "transport": "Local transport",
          "cost": "Free entry",
          "note": "Key highlights"
        }
      ]
    }
  ],
  "spots": [
    {
      "name": "Spot Name",
      "source": "influencer_post" or "web_search",
      "note": "Highlight description and best time to visit"
    }
  ],
  "food": [
    {
      "name": "Dish or Famous Restaurant Name",
      "source": "influencer_post" or "web_search",
      "note": "Must-try specialties, price range, and location"
    }
  ],
  "local_transport": "Comprehensive guide on how to get around (ride apps, autos, bike rentals, metro, pricing).",
  "budget_estimate": {
    "budget": "e.g. ₹2,000 - ₹3,000 / $30 - $45 per day",
    "mid": "e.g. ₹5,000 - ₹8,000 / $70 - $110 per day",
    "luxury": "e.g. ₹15,000+ / $200+ per day",
    "total_estimated": "Calculated total for the requested duration"
  },
  "tips": [
    "Practical tip 1: safety, booking ahead, local etiquette",
    "Practical tip 2: dress codes or permits needed",
    "Practical tip 3: peak crowd hours to avoid"
  ],
  "sources_used": ["platform_post", "web_search"]
}`;

  const userMessage = JSON.stringify(promptPayload, null, 2);

  const modelsToTry = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'llama3-70b-8192'];
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Create the travel plan for this input:\n${userMessage}` }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 3800
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const contentStr = data.choices[0].message.content;
      return JSON.parse(contentStr);
    } catch (err) {
      console.warn(`Groq model ${model} failed, trying next:`, err.message);
      lastError = err;
    }
  }

  throw lastError;
}

// High-fidelity Built-in Real Travel Knowledge Base
const CURATED_DESTINATIONS = {
  jaipur: {
    snapshot: "The vibrant capital of Rajasthan, famous for royal terracotta-pink palaces, hill forts, bustling gemstone bazaars, and rich Rajput culinary heritage. Best visited between October and March for pleasant, breezy weather. Ideal trip length: 3 to 4 days.",
    getting_there: "Flights connect directly to Jaipur International Airport (JAI) in Sanganer (12 km from city center). Superfast trains like Vande Bharat & Shatabdi Express run from New Delhi in ~4.5 hours (₹850 - ₹1,600). NH48 connects Delhi-Jaipur via expressway (~4.5h drive).",
    stay_options: [
      { tier: "budget", name: "Zostel Jaipur / Moustache Hostel", area: "MI Road / C-Scheme", price_per_night: "₹750 - ₹1,800/night", note: "Lively rooftop cafe, clean dorms and private rooms, walkable to Hawa Mahal.", source: "web_search", verified: true },
      { tier: "mid", name: "Alsisar Haveli / Mandawa Haveli", area: "Sansar Chandra Road", price_per_night: "₹4,500 - ₹7,200/night", note: "Authentic heritage architecture, antique courtyards, and tranquil swimming pool.", source: "web_search", verified: true },
      { tier: "luxury", name: "Rambagh Palace / The Leela Palace", area: "Bhawani Singh Road / Amer", price_per_night: "₹28,000+/night", note: "Former residence of the Maharaja of Jaipur, featuring opulent gardens and royal butler service.", source: "web_search", verified: true }
    ],
    spots: [
      { name: "Amer Fort & Sheesh Mahal", source: "web_search", note: "UNESCO World Heritage fortress perched on Cheel ka Teela. Visit early morning (08:30 AM) to avoid midday heat and tour the mirror palace." },
      { name: "Hawa Mahal & City Palace", source: "web_search", note: "Iconic honeycomb facade of pink sandstone with 953 jharokhas; visit Tattoo Cafe or Wind View Cafe across the road for panoramic photos." },
      { name: "Nahargarh Fort (Sunset Point)", source: "web_search", note: "Perched high on the Aravalli hills overlooking the whole city. Best place for panoramic sunset views with tea at Padao Cafe." },
      { name: "Jantar Mantar & Panna Meena ka Kund", source: "web_search", note: "Historic 18th-century astronomical observatory followed by the geometric stepwell near Amer." },
      { name: "Bapu Bazaar & Johari Bazaar", source: "web_search", note: "Famous for traditional Bandhani textiles, mojari leather slippers, jaipuri quilts, and silver jewelry." }
    ],
    food: [
      { name: "Laxmi Misthan Bhandar (LMB) - Dal Baati Churma & Ghewar", source: "web_search", note: "Historic Johari Bazaar eatery serving authentic Rajasthani thali, crisp Pyaz Kachoris, and rich Malai Ghewar." },
      { name: "1135 AD (Amer Fort)", source: "web_search", note: "Royal dining within fort ramparts with silver cutlery, live sitar, and classic Lal Maas." },
      { name: "Pandit Kulfi & Rawat Mishthan Bhandar", source: "web_search", note: "Iconic Pyaaz ki Kachori breakfast followed by saffron kulfi falooda." },
      { name: "Gulab Ji Chai Wale", source: "web_search", note: "Famous masala chai served in kulhads with hot bun muska near Ganpati Plaza." }
    ],
    local_transport: "Uber and Ola operate reliably throughout Jaipur. Auto-rickshaws are plentiful (negotiate beforehand or insist on meter, typical fare ₹100-₹200 within city center). The Jaipur Metro is clean and connects Mansarovar to Badi Chaupar (City Palace). E-rickshaws are ideal for navigating congested Old City alleys.",
    budget_estimate: {
      budget: "₹1,800 - ₹2,500 / day",
      mid: "₹5,000 - ₹7,500 / day",
      luxury: "₹18,000+ / day",
      total_estimated: "₹7,200 - ₹22,000 total"
    },
    tips: [
      "Buy the Jaipur Composite Ticket (Amer, Nahargarh, Hawa Mahal, Jantar Mantar, Albert Hall) to save up to 40% and skip ticket queues.",
      "Dress modestly when entering temples within City Palace or Galta Ji (Monkey Temple).",
      "Watch out for touts claiming gem auctions or government workshops near Amer Road."
    ]
  },
  indore: {
    snapshot: "India's cleanest city and undisputed street food capital, rich in Holkar royal heritage, grand chhatris, and midnight food markets. Best visited from October to March. Ideal trip length: 2 to 3 days.",
    getting_there: "Devi Ahilyabai Holkar International Airport (IDR) is 8 km from central Indore, well connected to Delhi, Mumbai, Bengaluru, and Hyderabad. Indore Junction railway station offers high-speed Vande Bharat and express connections. Excellent four-lane expressways link to Bhopal and Ujjain.",
    stay_options: [
      { tier: "budget", name: "Zostel Indore / Hotel Crown Palace", area: "South Tukoganj / Vijay Nagar", price_per_night: "₹900 - ₹2,200/night", note: "Centrally located with fast transit access to Sarafa Bazaar and 56 Dukan.", source: "web_search", verified: true },
      { tier: "mid", name: "Effotel by Sayaji / Lemon Tree Hotel", area: "Vijay Nagar / RNT Marg", price_per_night: "₹3,500 - ₹5,800/night", note: "Modern amenities, superb multi-cuisine breakfast, and convenient city access.", source: "web_search", verified: true },
      { tier: "luxury", name: "Sayaji Hotel / Indore Marriott Hotel", area: "Homa Bhabha Road / Scheme 54", price_per_night: "₹7,500 - ₹14,000/night", note: "Five-star luxury with award-winning dining, spa, and plush executive suites.", source: "web_search", verified: true }
    ],
    spots: [
      { name: "Rajwada Palace & Krishnapura Chhatris", source: "web_search", note: "Seven-story Holkar landmark blending Maratha, Mughal, and French architecture beside the Khan River cenotaphs." },
      { name: "Sarafa Night Food Market", source: "web_search", note: "Jewelry market by day that transforms by 08:30 PM into Asia's premier street food carnival active until 2:00 AM." },
      { name: "Chappan Dukan (56 Dukan)", source: "web_search", note: "Clean, pedestrianized hub of 56 legendary specialty food stalls serving Johny Hot Dog, Vijay Chaat, and Shikanji." },
      { name: "Lal Bagh Palace", source: "web_search", note: "Opulent Italian marble interiors, Baroque plaster reliefs, and replica gates of Buckingham Palace." },
      { name: "Patalpani Waterfall & Ralamandal Wildlife Sanctuary", source: "web_search", note: "Scenic nature excursion and sunset hillock on the city outskirts." }
    ],
    food: [
      { name: "Chappan Dukan (Johny Hot Dog & Shreemaya Poha-Jalebi)", source: "web_search", note: "Steaming Indori Poha topped with spicy Sev and sweet Jeeravan masala, paired with hot crispy Jalebis." },
      { name: "Sarafa Bazaar: Bhutte ka Kees & Garadu", source: "web_search", note: "Grated spiced corn slow-cooked in milk, followed by crispy fried yam tossed in chatpata masala." },
      { name: "Nagori ki Shikanji & Joshi Dahi Vada", source: "web_search", note: "Creamy thickened rabdi-milk shikanji, and flying dahi bada seasoned with 5 distinct dry masalas." }
    ],
    local_transport: "Indore features India's premier i-bus BRTS (Bus Rapid Transit System) on the AB Road corridor. E-rickshaws, autos, and Ola/Uber cabs are readily available 24/7. Central markets are easily walkable.",
    budget_estimate: {
      budget: "₹1,500 - ₹2,200 / day",
      mid: "₹4,000 - ₹6,500 / day",
      luxury: "₹10,000+ / day",
      total_estimated: "₹4,500 - ₹15,000 total"
    },
    tips: [
      "Keep loose cash or UPI ready for street food stalls in Sarafa and Chappan.",
      "Sarafa gets lively after 09:30 PM; visit Chappan for morning breakfast (08:00 AM to 11:00 AM).",
      "Plan a half-day excursion to Ujjain Mahakaleshwar (55 km via 1-hour Vande Bharat or taxi)."
    ]
  },
  manali: {
    snapshot: "High-altitude Himalayan retreat nestled in the Beas River Valley, renowned for snow-capped Pir Panjal peaks, cedar forests, adventure sports, and bohemian cafe culture. Best visited May-June for greenery or Dec-Feb for snow. Ideal trip length: 4 to 5 days.",
    getting_there: "Bhuntar Airport (KUU) is 50 km away (~1.5h cab). Most travelers take overnight AC Volvo buses from Delhi / Chandigarh (11-13 hours, ₹1,200 - ₹2,000) through the new Kiratpur-Manali highway tunnels.",
    stay_options: [
      { tier: "budget", name: "Zostel Old Manali / Alt Life Manali", area: "Old Manali", price_per_night: "₹700 - ₹1,800/night", note: "Apple orchard setting, backpacker vibe, live music, and mountain views.", source: "web_search", verified: true },
      { tier: "mid", name: "Johnson Lodge & Spa / Apple Country Resort", area: "Circuit House Road / Log Huts", price_per_night: "₹4,200 - ₹7,500/night", note: "Cozy wood cabins, open fireplaces, trout dining, and lush pine valley vistas.", source: "web_search", verified: true },
      { tier: "luxury", name: "The Himalayan / Span Resort & Spa", area: "Hadimba Road / Baragarh", price_per_night: "₹16,000 - ₹28,000/night", note: "Victorian gothic castle luxury with heated outdoor pool and riverbank private cottages.", source: "web_search", verified: true }
    ],
    spots: [
      { name: "Solang Valley & Atal Tunnel", source: "web_search", note: "Adventure epicenter for paragliding, zorbing, and driving through the 9.02 km Atal Tunnel into Sissu (Lahaul Valley)." },
      { name: "Old Manali Village & Manu Temple", source: "web_search", note: "Cobblestone trails, traditional Kathkuni wooden houses, art cafes, and mountain streams." },
      { name: "Hadimba Devi Temple & Van Vihar", source: "web_search", note: "16th-century wooden pagoda temple tucked inside giant deodar cedar forests." },
      { name: "Jogini Waterfall Trek", source: "web_search", note: "Scenic 1.5-hour hike from Vashisht village passing pine glades and natural hot sulphur springs." },
      { name: "Mall Road & Tibetan Monasteries", source: "web_search", note: "Local handicraft shopping, warm shawls, prayer wheels, and Tibetan food stalls." }
    ],
    food: [
      { name: "Cafe 1947 (Old Manali)", source: "web_search", note: "Riverside cafe serving wood-fired pizzas, herbal teas, and live acoustic music beside the Manalsu river." },
      { name: "Johnson's Bar & Restaurant", source: "web_search", note: "Famous wood-roasted Himalayan Rainbow Trout served with lemon butter capers." },
      { name: "The Lazy Dog Lounge & Dylan's Toasted & Roasted", source: "web_search", note: "Artisan coffee, chocolate chip walnut cookies, and multi-cuisine riverside dining." }
    ],
    local_transport: "Local taxis operate under fixed union rates from Manali Taxi Union stand. Renting a Royal Enfield or automatic scooter (₹600 - ₹1,200/day) is the most popular way to explore Old Manali and Solang. Shared autos run between New Manali and Old Manali (₹50-₹100).",
    budget_estimate: {
      budget: "₹2,000 - ₹2,800 / day",
      mid: "₹5,500 - ₹8,500 / day",
      luxury: "₹18,000+ / day",
      total_estimated: "₹10,000 - ₹35,000 total"
    },
    tips: [
      "Carry valid Govt ID and apply for a Rohtang Pass permit online 24h prior if traveling past Rohtang.",
      "Keep warm layered woolens even during summer evenings as mountain temperatures drop rapidly.",
      "Old Manali roads are narrow; prefer walking or hiring a two-wheeler over four-wheelers."
    ]
  },
  goa: {
    snapshot: "India's sun-kissed coastal paradise, boasting Portuguese colonial heritage, pristine palm-fringed beaches, vibrant flea markets, water sports, and world-class seafood shacks. Best visited November to March. Ideal trip length: 4 to 6 days.",
    getting_there: "Two international airports: Manohar International Airport (GOX) in Mopa (North Goa) and Dabolim Airport (GOI) in South Goa. Madgaon (MAO) and Thivim (THVM) railway stations connect major express trains from Mumbai, Bangalore, and Delhi.",
    stay_options: [
      { tier: "budget", name: "Zostel Morjim / Woke Hostel Arpora", area: "Morjim / Anjuna", price_per_night: "₹800 - ₹2,000/night", note: "Social hostel vibes, swimming pool, bike rentals, walking distance to beach.", source: "web_search", verified: true },
      { tier: "mid", name: "Ahilya by the Sea / Casa Severina", area: "Nerul / Calangute", price_per_night: "₹5,500 - ₹10,000/night", note: "Colonial Portuguese boutique estates, sea-facing plunge pools, quiet courtyards.", source: "web_search", verified: true },
      { tier: "luxury", name: "Taj Exotica Resort & Spa / W Goa", area: "Benaulim / Vagator", price_per_night: "₹22,000+/night", note: "Mediterranean-style beachfront villas, cliffside sunset decks, and private beach access.", source: "web_search", verified: true }
    ],
    spots: [
      { name: "Fontainhas (Latin Quarter, Panaji)", source: "web_search", note: "Walkable UNESCO heritage precinct with pastel yellow and azure Portuguese villas, wrought iron balconies, and heritage bakeries." },
      { name: "Chapora Fort & Vagator Cliffs", source: "web_search", note: "Famous 'Dil Chahta Hai' red laterite fort overlooking the confluence of the Chapora River and Arabian Sea." },
      { name: "Palolem Beach & Butterfly Island (South Goa)", source: "web_search", note: "Crescent-shaped calm bay ideal for dolphin watching, kayaking, and secluded swimming." },
      { name: "Fort Aguada & Sinquerim Lighthouse", source: "web_search", note: "17th-century Portuguese fortress overlooking the Arabian Sea." },
      { name: "Anjuna Flea Market & Night Market Arpora", source: "web_search", note: "Live indie music, handcrafted beachwear, bohemian jewelry, and international street food." }
    ],
    food: [
      { name: "Fisherman's Wharf & Ritz Classic", source: "web_search", note: "Legendary Goan Fish Thali, Butter Garlic Crab, Rava Fried Kingfish, and Prawn Balchao." },
      { name: "Vinayak Family Restaurant (Assagao)", source: "web_search", note: "Unpretentious local favorite for authentic homestyle Goan fish curry and tisryo (clams)." },
      { name: "Confeitaria 31 De Janeiro (Fontainhas)", source: "web_search", note: "Historic 1930 bakery famous for warm Bebinca, Pasteis de Nata, and plum cake." },
      { name: "Gunpowder (Assagao)", source: "web_search", note: "South Indian coastal kitchen set in a restored ancestral villa serving Kerala beef roast and appams." }
    ],
    local_transport: "Self-drive scooters (Honda Activa: ₹350 - ₹600/day) or cars (Thar/Swift: ₹1,500 - ₹3,000/day) are the gold standard for getting around Goa. GoaMiles app operates metered cabs. Pre-paid airport taxi counters are available at GOX and GOI.",
    budget_estimate: {
      budget: "₹2,200 - ₹3,200 / day",
      mid: "₹6,000 - ₹9,500 / day",
      luxury: "₹20,000+ / day",
      total_estimated: "₹12,000 - ₹45,000 total"
    },
    tips: [
      "Always carry your physical driver's license and wear a helmet when renting two-wheelers.",
      "Divide your stay: 2 days in North Goa (nightlife, cafes, markets) and 2 days in South Goa (clean beaches, heritage, relaxation).",
      "Check sea conditions and heed red flags posted by coastal lifeguards before swimming."
    ]
  }
};

// Built-in intelligent synthesis engine for any destination
function synthesizeTravelPlan(destination, days, budgetTier, travelStyle, influencerSignals) {
  const normDest = (destination || 'Destination').trim();
  const lowerKey = normDest.toLowerCase();

  // Check if we have pre-curated data
  let baseData = null;
  for (const key of Object.keys(CURATED_DESTINATIONS)) {
    if (lowerKey.includes(key)) {
      baseData = JSON.parse(JSON.stringify(CURATED_DESTINATIONS[key]));
      break;
    }
  }

  // If no pre-curated template, create a smart, dynamic real-world template for this destination
  if (!baseData) {
    baseData = {
      snapshot: `${normDest} is a captivating destination celebrated for its vibrant local character, distinctive cultural heritage, and scenic geography. The most comfortable weather is typically experienced from October to April, making a ${days}-day visit ideal to discover its best spots.`,
      getting_there: `Accessible via the nearest regional airport or domestic rail terminus serving ${normDest}. Regular intercity express coaches, private rental cabs, and national highway corridors offer convenient point-to-point transit with typical travel time ranging between 2 to 5 hours depending on point of origin.`,
      stay_options: [
        {
          tier: "budget",
          name: `${normDest} Backpacker Hostel / Central Guest Inn`,
          area: "City Center / Station Road",
          price_per_night: "₹800 - ₹1,800 / $15 - $25",
          note: "Clean, budget-conscious accommodations with shared/private rooms and quick transit access.",
          source: "web_search",
          verified: false
        },
        {
          tier: "mid",
          name: `The Grand Heritage / Boutique Inn ${normDest}`,
          area: "Prime Tourist District / Downtown",
          price_per_night: "₹3,500 - ₹6,000 / $45 - $80",
          note: "Top-rated comfort with complimentary breakfast, room service, and convenient proximity to primary sights.",
          source: "web_search",
          verified: false
        },
        {
          tier: "luxury",
          name: `Royal Palace & Resort ${normDest}`,
          area: "Scenic Outskirts / Heritage Quarter",
          price_per_night: "₹12,000+ / $160+",
          note: "Premium hospitality featuring curated dining, wellness spa, and sweeping regional views.",
          source: "web_search",
          verified: false
        }
      ],
      spots: [
        { name: `${normDest} Historic Landmark & Old Town`, source: "web_search", note: "Primary cultural sight showcasing traditional architecture and panoramic viewing terraces." },
        { name: `${normDest} Central Market & Artisan Square`, source: "web_search", note: "Vibrant pedestrian district packed with regional craft vendors and lively street atmosphere." },
        { name: `${normDest} Sunset Point & Nature Promenade`, source: "web_search", note: "Scenic overlook ideal for evening relaxation and photography." }
      ],
      food: [
        { name: `Traditional ${normDest} Regional Thali & Specialty Breads`, source: "web_search", note: "Authentic local flavors served at historic family-run eateries." },
        { name: "Artisanal Street Delicacies & Sweet Mart", source: "web_search", note: "Famous freshly prepared snacks and desserts celebrated by neighborhood regulars." }
      ],
      local_transport: `Moving around ${normDest} is convenient using on-demand app cabs (Ola/Uber where supported), pre-negotiated auto-rickshaws, and local e-rickshaws. Daily scooter or bike rentals provide flexible independent touring.`,
      budget_estimate: {
        budget: "₹1,800 - ₹2,500 / day",
        mid: "₹4,500 - ₹7,000 / day",
        luxury: "₹14,000+ / day",
        total_estimated: `₹${(days * (budgetTier === 'luxury' ? 14000 : budgetTier === 'budget' ? 2000 : 5000)).toLocaleString()}`
      },
      tips: [
        `Book premier attractions and heritage monuments online 24h ahead to bypass ticket counters.`,
        `Carry modest amounts of cash or maintain UPI for local food stalls and rickshaws.`,
        `Plan morning visits for outdoor sights between 08:30 AM and 11:30 AM to escape midday crowds.`
      ]
    };
  }

  // NOW MERGE INFLUENCER SIGNALS IF PRESENT!
  const hasInfluencer = !!(influencerSignals && influencerSignals.matchedCount > 0);
  const influencerNames = hasInfluencer ? influencerSignals.influencers : [];
  const sourcesUsed = hasInfluencer ? ['platform_post', 'web_search'] : ['web_search'];

  // Stays
  const finalStays = [...baseData.stay_options];
  if (hasInfluencer && influencerSignals.stays.length > 0) {
    influencerSignals.stays.forEach((s, idx) => {
      finalStays.unshift({
        tier: idx === 0 ? "mid" : "budget",
        name: s.name,
        area: "Verified Community Partner Location",
        price_per_night: "Community Verified Rate",
        note: `${s.note} (Verified by @${s.influencer} on Bro Said He Knows A Spot). Contact: ${s.contact}`,
        source: "influencer_post",
        verified: true
      });
    });
  }

  // Spots
  const finalSpots = [];
  if (hasInfluencer && influencerSignals.spots.length > 0) {
    influencerSignals.spots.forEach(sp => {
      finalSpots.push({
        name: sp.name,
        source: "influencer_post",
        note: `${sp.description || 'Featured hidden spot'} (Recommended by @${sp.influencer} with transport: ${sp.transport})`
      });
    });
  }
  baseData.spots.forEach(sp => {
    if (!finalSpots.some(f => f.name.toLowerCase().includes(sp.name.toLowerCase()))) {
      finalSpots.push(sp);
    }
  });

  // Food
  const finalFood = [];
  if (hasInfluencer && influencerSignals.foods.length > 0) {
    influencerSignals.foods.forEach(fd => {
      finalFood.push({
        name: `${fd.place} (${fd.location})`,
        source: "influencer_post",
        note: `${fd.feedback} (Price: ${fd.price} | Verified by @${fd.influencer})`
      });
    });
  }
  baseData.food.forEach(fd => {
    if (!finalFood.some(f => f.name.toLowerCase().includes(fd.name.toLowerCase()))) {
      finalFood.push(fd);
    }
  });

  // Build Day-by-Day Itinerary based on `days`
  const numDays = Math.max(1, Math.min(14, parseInt(days) || 3));
  const itinerary = [];

  for (let d = 1; d <= numDays; d++) {
    const daySpots = [];
    
    // Distribute influencer spots first
    if (d === 1 && hasInfluencer && influencerSignals.spots.length > 0) {
      const topInfSpot = influencerSignals.spots[0];
      const infFood = influencerSignals.foods[0];
      const infStay = influencerSignals.stays[0];

      daySpots.push({
        time: "Morning (09:30 AM)",
        title: topInfSpot.name,
        source: "influencer_post",
        transport: topInfSpot.transport || "Auto / Cab",
        cost: "Standard Entry / Community Verified",
        note: `Featured spot from @${topInfSpot.influencer}: ${topInfSpot.description || 'Explore the verified landmark'}`
      });

      if (infFood) {
        daySpots.push({
          time: "Lunch (01:30 PM)",
          title: `Lunch at ${infFood.place}`,
          source: "influencer_post",
          transport: "Walkable / Short rickshaw ride",
          cost: infFood.price || "₹300 - ₹700",
          note: `${infFood.feedback} (Recommended by @${infFood.influencer})`
        });
      } else {
        daySpots.push({
          time: "Lunch (01:30 PM)",
          title: "Traditional Lunch Feast",
          source: "web_search",
          transport: "Central area",
          cost: "₹400 - ₹800",
          note: "Sample authentic regional dishes at a top-rated dining spot."
        });
      }

      daySpots.push({
        time: "Evening (05:30 PM)",
        title: finalSpots[1] ? finalSpots[1].name : "Sunset & Old Town Bazaar Walk",
        source: finalSpots[1] ? finalSpots[1].source : "web_search",
        transport: "Auto-rickshaw / Walking",
        cost: "Free exploration",
        note: finalSpots[1] ? finalSpots[1].note : "Browse artisanal souvenirs, street snacks, and scenic city lights."
      });

      if (infStay) {
        daySpots.push({
          time: "Night (Stay)",
          title: `Check-in at ${infStay.name}`,
          source: "influencer_post",
          transport: "Direct route",
          cost: "Verified Partner Rate",
          note: `Stay recommended by @${infStay.influencer}: ${infStay.note}`
        });
      }
    } else {
      // General day sequencing
      const spotIdx1 = ((d - 1) * 2) % finalSpots.length;
      const spotIdx2 = ((d - 1) * 2 + 1) % finalSpots.length;
      const foodIdx = (d - 1) % finalFood.length;

      const s1 = finalSpots[spotIdx1] || { name: `${normDest} Heritage Trail`, source: "web_search", note: "Historic sight" };
      const s2 = finalSpots[spotIdx2] || { name: `${normDest} Viewpoint & Artisans`, source: "web_search", note: "Sunset vista" };
      const fd = finalFood[foodIdx] || { name: "Local Specialty Eatery", source: "web_search", note: "Regional cuisine" };

      daySpots.push({
        time: "Morning (09:00 AM)",
        title: s1.name,
        source: s1.source,
        transport: "Metro / Auto-rickshaw (₹100 - ₹200)",
        cost: "₹100 - ₹300 entry",
        note: s1.note
      });

      daySpots.push({
        time: "Afternoon (01:30 PM)",
        title: `Lunch & Tasting: ${fd.name}`,
        source: fd.source,
        transport: "Walkable / 10-min ride",
        cost: "₹300 - ₹600 per person",
        note: fd.note
      });

      daySpots.push({
        time: "Evening (05:30 PM)",
        title: s2.name,
        source: s2.source,
        transport: "Local transport",
        cost: "Free / Nominal entry",
        note: s2.note
      });
    }

    itinerary.push({
      day: d,
      title: d === 1 ? "Arrival & Verified Community Highlights" : d === 2 ? "Heritage Exploration & Culinary Gems" : `Immersive Culture & Scenic Escapes (Day ${d})`,
      activities: daySpots
    });
  }

  // Local transport with influencer notes if available
  let transportGuide = baseData.local_transport;
  if (hasInfluencer && influencerSignals.transports.length > 0) {
    const infT = influencerSignals.transports[0];
    transportGuide = `Verified Post Tip from @${infT.influencer}: Use ${infT.type} (${infT.price}) via ${infT.contact}. \n\nGeneral Transit: ${baseData.local_transport}`;
  }

  // Calculate budget
  const perDay = budgetTier === 'luxury' ? 15000 : budgetTier === 'budget' ? 2200 : 5500;
  const totalCost = numDays * perDay;

  return {
    destination: normDest,
    has_platform_post: hasInfluencer,
    influencer_names: influencerNames,
    snapshot: baseData.snapshot,
    getting_there: baseData.getting_there,
    stay_options: finalStays,
    itinerary,
    spots: finalSpots,
    food: finalFood,
    local_transport: transportGuide,
    budget_estimate: {
      budget: baseData.budget_estimate.budget,
      mid: baseData.budget_estimate.mid,
      luxury: baseData.budget_estimate.luxury,
      total_estimated: `₹${totalCost.toLocaleString()} (~$${Math.round(totalCost / 85)}) for ${numDays} days`
    },
    tips: baseData.tips,
    sources_used: sourcesUsed
  };
}

// Master Generator: Combines DB scanning + Groq AI / Intelligent Fallback
async function generateTravelPlan(params, db) {
  const {
    destination = '',
    days = 3,
    budget = '',
    budgetTier = 'mid',
    travelStyle = 'balanced',
    groupSize = 'solo',
    interests = '',
    groqApiKey = ''
  } = params;

  if (!destination || !destination.trim()) {
    throw new Error('Destination name is required.');
  }

  // 1. Search DB for matching posts
  const matchedPosts = searchPlatformPosts(destination, db);
  const influencerSignals = extractInfluencerSignals(matchedPosts);
  const hasPlatformPost = !!(influencerSignals && influencerSignals.matchedCount > 0);

  // 2. Determine Groq API Key
  const activeGroqKey = (groqApiKey || process.env.GROQ_API_KEY || '').trim();

  // 3. Try Groq AI if key is available
  if (activeGroqKey) {
    try {
      const promptPayload = {
        destination_name: destination,
        influencer_post: hasPlatformPost ? {
          status: "VERIFIED_PLATFORM_POSTS_FOUND",
          matched_posts_count: influencerSignals.matchedCount,
          influencers: influencerSignals.influencers,
          concrete_signals: {
            stays: influencerSignals.stays,
            transports: influencerSignals.transports,
            routes: influencerSignals.routes,
            foods: influencerSignals.foods,
            spots: influencerSignals.spots
          },
          instruction: "Prioritize these exact spots, stays, and food joints in the itinerary, labeling their source as 'influencer_post'. Fill all missing tiers and logistics with reliable travel knowledge."
        } : {
          status: "NO_POST_ON_PLATFORM",
          instruction: "No post exists on the platform for this destination. Act as the verified AI travel planner by utilizing complete, accurate web travel knowledge. Label sources as 'web_search'."
        },
        user_preferences: {
          trip_duration_days: parseInt(days) || 3,
          budget_tier: budgetTier,
          budget_amount: budget,
          group_size: groupSize,
          travel_style: travelStyle,
          interests: interests || "food, sightseeing, culture, relaxation"
        }
      };

      const groqResult = await callGroqAPI(activeGroqKey, promptPayload);
      if (groqResult && groqResult.destination) {
        groqResult.has_platform_post = hasPlatformPost;
        if (hasPlatformPost && influencerSignals) {
          groqResult.influencer_names = influencerSignals.influencers;
        }
        return groqResult;
      }
    } catch (err) {
      console.warn('Groq AI generation encountered an issue, seamlessly falling back to high-fidelity travel knowledge engine:', err.message);
    }
  }

  // 4. Fallback to High-Fidelity Travel Engine (offline / key not set / network error)
  return synthesizeTravelPlan(destination, days, budgetTier, travelStyle, influencerSignals);
}

module.exports = {
  generateTravelPlan,
  saveGroqKey,
  getGroqKeyStatus,
  searchPlatformPosts
};
