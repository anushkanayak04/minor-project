const fs = require('fs');
const path = require('path');

// Curated Real-World Intelligence Base for Key Regions & Dynamic Generator
const PLACE_INTELLIGENCE = {
  jaipur: {
    safetyIndex: 8.6,
    trafficIndex: "Moderate Congestion (Peak 5:00 PM - 8:30 PM)",
    infraRating: "8.2/10",
    bestHours: "08:00 AM - 11:30 AM & 06:00 PM - 09:30 PM",
    avoidHours: "01:00 PM - 04:00 PM (Heat & Midday Bapu Bazaar traffic)",
    heatmapPoints: [
      { id: "j1", x: 42, y: 35, intensity: 0.85, type: "traffic", title: "Badi Chaupar & Johari Bazaar", detail: "Heavy pedestrian and e-rickshaw bottleneck during evening market hours." },
      { id: "j2", x: 68, y: 22, intensity: 0.70, type: "traffic", title: "Amer Road Highway Pass", detail: "Weekend tourist bus queues near Jal Mahal bypass." },
      { id: "j3", x: 40, y: 48, intensity: 0.65, type: "safety", title: "Unlit Alleyways near Old City Gates", detail: "Gem buyer scam reports and unlit narrow footpaths after 10 PM." },
      { id: "j4", x: 55, y: 60, intensity: 0.90, type: "construction", title: "Jaipur Metro Line 2 Extension Zone", detail: "Underground tunnel drilling and heavy barricading on Tonk Road corridor." },
      { id: "j5", x: 30, y: 40, intensity: 0.60, type: "weather", title: "Choti Chaupar Underpass", detail: "Monsoon waterlogging vulnerability point during thunderstorm events." }
    ],
    notifications: [
      {
        id: "n-j1",
        category: "construction",
        icon: "🚧",
        title: "Metro Expansion Line 2 Barricades",
        message: "Heavy construction barriers installed on Tonk Road near Rambagh circle. Expect +20 min travel delays during peak commuting hours (09:00 AM & 06:30 PM).",
        urgency: "high",
        locationDetail: "Tonk Road & Rambagh Circle Corridor",
        timestamp: "Updated 2h ago",
        source: "govt_advisory"
      },
      {
        id: "n-j2",
        category: "traffic",
        icon: "🚗",
        title: "Weekend Traffic Diversion near Amer Fort",
        message: "Tourist coach congestion around Jal Mahal promenade. Traffic police diverting private vehicles toward Amber bypass road.",
        urgency: "warning",
        locationDetail: "Amer Road (NH-248A)",
        timestamp: "Updated 4h ago",
        source: "govt_advisory"
      },
      {
        id: "n-j3",
        category: "safety",
        icon: "🚨",
        title: "Gem & Jewelry Certification Scam Alert",
        message: "Multiple travelers reported touts offering fake govt gem export certificates near Johari Bazaar. Stick to BIS hallmarked jewelers.",
        urgency: "high",
        locationDetail: "Johari Bazaar & Bapu Bazaar",
        timestamp: "Verified Community Flag",
        source: "community_post"
      },
      {
        id: "n-j4",
        category: "weather",
        icon: "🌧️",
        title: "Pre-Monsoon Drainage Maintenance",
        message: "Municipal workers clearing stormwater channels around Pink City gates. Temporary single-lane traffic in Old City.",
        urgency: "notice",
        locationDetail: "Ajmeri Gate & Sanganeri Gate",
        timestamp: "Updated 1d ago",
        source: "govt_advisory"
      }
    ]
  },
  indore: {
    safetyIndex: 9.2,
    trafficIndex: "Smooth BRTS Corridor (Sarafa congestion after 09:30 PM)",
    infraRating: "9.5/10 (India's Cleanest City)",
    bestHours: "08:00 AM - 11:00 AM & 08:30 PM - 01:00 AM",
    avoidHours: "05:30 PM - 07:30 PM (AB Road Commuter Rush)",
    heatmapPoints: [
      { id: "i1", x: 48, y: 52, intensity: 0.90, type: "traffic", title: "Sarafa Night Bazaar Precinct", detail: "Pedestrian swarm and two-wheeler parking saturation after 09:30 PM." },
      { id: "i2", x: 62, y: 38, intensity: 0.75, type: "traffic", title: "Vijay Nagar Square & Ring Road", detail: "Evening commuter rush near major commercial hubs." },
      { id: "i3", x: 45, y: 48, intensity: 0.40, type: "safety", title: "Rajwada Market Alleys", detail: "High footfall zone; watch personal belongings during festive sales." },
      { id: "i4", x: 58, y: 42, intensity: 0.80, type: "construction", title: "Indore Metro Rail Corridor Work", detail: "Elevated metro pillar construction along Super Corridor and Palasia." },
      { id: "i5", x: 50, y: 55, intensity: 0.30, type: "weather", title: "Kahn River Bank Drive", detail: "Clean riverfront promenade; mild monsoon splash during rain." }
    ],
    notifications: [
      {
        id: "n-i1",
        category: "construction",
        icon: "🚧",
        title: "Indore Metro Yellow Line Elevated Pillar Erection",
        message: "Metro construction underway on Super Corridor to Palasia section. Service road diversions active near Radisson Square.",
        urgency: "warning",
        locationDetail: "Super Corridor to Vijay Nagar",
        timestamp: "Updated 1h ago",
        source: "govt_advisory"
      },
      {
        id: "n-i2",
        category: "traffic",
        icon: "🚗",
        title: "Sarafa Night Market Pedestrian Zone Activation",
        message: "Vehicular entry restricted into Sarafa Jewelry market after 08:30 PM daily to facilitate street food stalls. Use designated Multi-level Parking.",
        urgency: "notice",
        locationDetail: "Sarafa Bazaar & Rajwada Precinct",
        timestamp: "Updated 3h ago",
        source: "govt_advisory"
      },
      {
        id: "n-i3",
        category: "safety",
        icon: "🚨",
        title: "Cab Overcharging at Indore Junction Late Night",
        message: "Community members flagged auto drivers demanding double rates after midnight at Indore Junction platform exit. Use prepaid booth or Ola/Uber.",
        urgency: "warning",
        locationDetail: "Indore Junction Railway Station",
        timestamp: "Verified Community Flag",
        source: "community_post"
      },
      {
        id: "n-i4",
        category: "weather",
        icon: "🌧️",
        title: "High Air Quality & Clean Environment Notice",
        message: "AQI consistently in Good category. Ideal weather conditions for night food tours in Chappan and Sarafa.",
        urgency: "notice",
        locationDetail: "Citywide",
        timestamp: "Live Advisory",
        source: "govt_advisory"
      }
    ]
  },
  manali: {
    safetyIndex: 8.9,
    trafficIndex: "Heavy Bottlenecks on Green Tax Barrier & Mall Road",
    infraRating: "7.6/10 (Mountain Terrain & Snow Passes)",
    bestHours: "07:30 AM - 11:00 AM & 03:30 PM - 07:00 PM",
    avoidHours: "11:30 AM - 03:00 PM (Solang Valley Tourist Jam)",
    heatmapPoints: [
      { id: "m1", x: 50, y: 30, intensity: 0.95, type: "traffic", title: "Solang Valley Approach Road", detail: "5 km slow-moving bumper-to-bumper tourist vehicle queues during peak summer/winter." },
      { id: "m2", x: 45, y: 55, intensity: 0.85, type: "weather", title: "Atal Tunnel North Portal (Lahaul)", detail: "Sudden black ice formation and snowfall advisories during winter/monsoon." },
      { id: "m3", x: 48, y: 48, intensity: 0.60, type: "traffic", title: "Old Manali Bridge Narrow Bottleneck", detail: "Single-lane bridge causes 30-min delays for cars; twowheelers recommended." },
      { id: "m4", x: 52, y: 65, intensity: 0.70, type: "construction", title: "Kiratpur-Manali Tunnel Resurfacing", detail: "Maintenance inside Tunnels 3 & 4 on NH-21." },
      { id: "m5", x: 42, y: 50, intensity: 0.50, type: "safety", title: "Hadimba Temple Forest Slopes", detail: "Slippery pine needle paths and uneven stone stairs after rain." }
    ],
    notifications: [
      {
        id: "n-m1",
        category: "weather",
        icon: "🌧️",
        title: "High-Altitude Black Ice & Snowfall Advisory",
        message: "Temperature drops below freezing past Atal Tunnel North Portal. 4x4 vehicles or snow chains required for travel towards Sissu.",
        urgency: "high",
        locationDetail: "Atal Tunnel & Rohtang Pass Highway",
        timestamp: "Updated 30m ago",
        source: "govt_advisory"
      },
      {
        id: "n-m2",
        category: "traffic",
        icon: "🚗",
        title: "Solang Valley Adventure Zone Congestion",
        message: "Tourist vehicle queue extending 4 km from Palchan bridge. Expect 45-60 min delay. Depart by 07:30 AM to beat the rush.",
        urgency: "high",
        locationDetail: "Palchan to Solang Valley (NH-3)",
        timestamp: "Updated 2h ago",
        source: "govt_advisory"
      },
      {
        id: "n-m3",
        category: "construction",
        icon: "🚧",
        title: "NH-21 Tunnel Slope Stabilization",
        message: "Rockfall netting and tunnel lining maintenance near Pandoh Dam bypass. Single-lane traffic control in operation.",
        urgency: "warning",
        locationDetail: "Mandi-Aut Tunnel Segment",
        timestamp: "Updated 5h ago",
        source: "govt_advisory"
      },
      {
        id: "n-m4",
        category: "safety",
        icon: "🚨",
        title: "Unlicensed Paragliding Operator Alert",
        message: "District administration cautions tourists against unregistered paragliding operators offering unauthorized launches in Solang. Verify HP Tourism license badge.",
        urgency: "high",
        locationDetail: "Solang Valley & Dobhi Paragliding Sites",
        timestamp: "Verified Community Flag",
        source: "community_post"
      }
    ]
  },
  goa: {
    safetyIndex: 8.8,
    trafficIndex: "Coastal Highway Bottlenecks (Baga-Anjuna road after 07:00 PM)",
    infraRating: "8.4/10",
    bestHours: "08:00 AM - 11:30 AM & 04:30 PM - 09:00 PM",
    avoidHours: "10:00 PM - 02:00 AM (High Traffic near Nightclub Strips)",
    heatmapPoints: [
      { id: "g1", x: 45, y: 35, intensity: 0.90, type: "traffic", title: "Baga-Calangute Beach Road", detail: "Extreme vehicular density and narrow lane bottleneck during night hours." },
      { id: "g2", x: 55, y: 28, intensity: 0.70, type: "traffic", title: "Chorao Ferry Ramp & Panaji Mandovi Bridge", detail: "Commuter rush hour traffic towards Panaji city center." },
      { id: "g3", x: 42, y: 40, intensity: 0.85, type: "safety", title: "Unlit Coastal Stretch near Anjuna Cliff", detail: "Dark stretches without streetlights; drive twowheelers with extreme caution." },
      { id: "g4", x: 60, y: 25, intensity: 0.75, type: "construction", title: "Mopa Airport Link Expressway Roadwork", detail: "Ongoing flyover construction joining NH-66 at Porvorim." },
      { id: "g5", x: 48, y: 60, intensity: 0.80, type: "weather", title: "South Goa Coastal Swell Alert", detail: "High rough waves and strong rip currents during monsoon/cyclonic conditions." }
    ],
    notifications: [
      {
        id: "n-g1",
        category: "safety",
        icon: "🚨",
        title: "Self-Drive Scooter Rental Scam & Fine Alert",
        message: "Renting non-black-and-yellow (private white plate) vehicles is illegal in Goa and carries ₹10,000 police fines. Always check yellow registration plates.",
        urgency: "high",
        locationDetail: "Calangute, Anjuna & Airport Hubs",
        timestamp: "Verified Community Flag",
        source: "community_post"
      },
      {
        id: "n-g2",
        category: "construction",
        icon: "🚧",
        title: "Porvorim Elevated Flyover Construction (NH-66)",
        message: "Major six-lane flyover work on Panaji-Mapusa highway. Traffic diverted via Sangolda inner roads; expect +25 min delay during day.",
        urgency: "high",
        locationDetail: "Porvorim Highway Stretch",
        timestamp: "Updated 1h ago",
        source: "govt_advisory"
      },
      {
        id: "n-g3",
        category: "weather",
        icon: "🌧️",
        title: "Monsoon High Tide & Lifeguard Red Flag Warning",
        message: "Drishti Lifesavers issued red flags across Baga, Calangute, and Anjuna beaches. Sea swimming prohibited due to strong undertow currents.",
        urgency: "high",
        locationDetail: "All Coastal Beaches (North & South Goa)",
        timestamp: "Live Safety Advisory",
        source: "govt_advisory"
      },
      {
        id: "n-g4",
        category: "traffic",
        icon: "🚗",
        title: "Night Club Strip Vehicle Gridlock",
        message: "Heavy slow-moving traffic on Vagator-Siolim road past 11:00 PM on weekends. Police checkpoints conducting breathalyzer tests active.",
        urgency: "warning",
        locationDetail: "Vagator & Assagao Club Corridors",
        timestamp: "Updated 3h ago",
        source: "govt_advisory"
      }
    ]
  }
};

// Analyze platform posts from db.json matching the location
function analyzeUserPostsForPlace(location, db) {
  if (!db || !db.posts || !Array.isArray(db.posts)) return { count: 0, flags: [] };
  const query = (location || '').toLowerCase().trim();
  if (!query) return { count: 0, flags: [] };

  const queryTerms = query.split(/[\s,]+/).filter(t => t.length > 2);
  const matched = db.posts.filter(post => {
    const loc = (post.location || '').toLowerCase();
    const desc = (post.description || '').toLowerCase();
    const food = (post.food_place || '').toLowerCase();
    const hotel = (post.hotel_name || '').toLowerCase();

    if (loc.includes(query) || desc.includes(query) || food.includes(query) || hotel.includes(query)) return true;
    if (queryTerms.some(term => loc.includes(term) || desc.includes(term))) return true;
    if (query.includes('indore') && (loc.includes('22.7') || loc.includes('75.9'))) return true;
    return false;
  });

  const flags = [];
  matched.forEach(post => {
    const timeStr = post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Recent';
    if (post.route_desc || (post.transport_price && post.transport_price.includes('high'))) {
      flags.push({
        id: `user-${post.id}`,
        category: "traffic",
        icon: "🚗",
        title: `Community Transport Note (@${post.username})`,
        message: post.route_desc || `Transport cost reported: ${post.transport_price}`,
        urgency: "warning",
        locationDetail: post.location || location,
        timestamp: `Posted ${timeStr}`,
        source: "community_post"
      });
    }
    if (post.hotel_feedback && (post.hotel_feedback.toLowerCase().includes('bad') || post.hotel_feedback.toLowerCase().includes('scam') || post.hotel_feedback.toLowerCase().includes('unlit'))) {
      flags.push({
        id: `user-h-${post.id}`,
        category: "safety",
        icon: "🚨",
        title: `Residency Safety Warning (@${post.username})`,
        message: post.hotel_feedback,
        urgency: "high",
        locationDetail: post.hotel_name || post.location || location,
        timestamp: `Posted ${timeStr}`,
        source: "community_post"
      });
    }
  });

  return {
    count: matched.length,
    flags
  };
}

// Master Analytics & Heatmap Generator
function generatePlaceAnalytics(location, db) {
  const normLocation = (location || 'Jaipur').trim();
  const lowerKey = normLocation.toLowerCase();

  // 1. Check curated data
  let baseIntel = null;
  for (const key of Object.keys(PLACE_INTELLIGENCE)) {
    if (lowerKey.includes(key)) {
      baseIntel = JSON.parse(JSON.stringify(PLACE_INTELLIGENCE[key]));
      break;
    }
  }

  // 2. Synthesize if no exact key
  if (!baseIntel) {
    baseIntel = {
      safetyIndex: 8.5,
      trafficIndex: "Moderate Local Traffic (Peak 08:30 AM & 06:00 PM)",
      infraRating: "8.0/10",
      bestHours: "08:00 AM - 11:30 AM & 04:30 PM - 08:00 PM",
      avoidHours: "12:00 PM - 03:00 PM & 06:30 PM - 08:30 PM",
      heatmapPoints: [
        { id: "h1", x: 45, y: 40, intensity: 0.80, type: "traffic", title: `${normLocation} Central Market & Transit Station`, detail: "Commuter queue and local auto congestion during peak evening hours." },
        { id: "h2", x: 60, y: 30, intensity: 0.70, type: "construction", title: `${normLocation} Highway Resurfacing Zone`, detail: "Road widening and drainage channel repair work." },
        { id: "h3", x: 35, y: 55, intensity: 0.60, type: "safety", title: `${normLocation} Unlit Old Town Lanes`, detail: "Exercise normal safety precautions after 10:00 PM." },
        { id: "h4", x: 50, y: 50, intensity: 0.50, type: "weather", title: `${normLocation} Low-Lying Underpass`, detail: "Monsoon drainage accumulation point." }
      ],
      notifications: [
        {
          id: `n-${Date.now()}-1`,
          category: "traffic",
          icon: "🚗",
          title: `Peak Hour Traffic Bottleneck in ${normLocation}`,
          message: `Heavy vehicle movement near central railway/bus station corridors. Expect +15 min delay between 05:30 PM and 08:00 PM.`,
          urgency: "warning",
          locationDetail: `${normLocation} Central Corridor`,
          timestamp: "Updated 1h ago",
          source: "govt_advisory"
        },
        {
          id: `n-${Date.now()}-2`,
          category: "construction",
          icon: "🚧",
          title: `Municipal Road Improvement Work`,
          message: `Lane maintenance and utility cable laying in progress along main commercial arterial road. Single lane traffic operational.`,
          urgency: "notice",
          locationDetail: `${normLocation} Outer Ring Road`,
          timestamp: "Updated 3h ago",
          source: "govt_advisory"
        },
        {
          id: `n-${Date.now()}-3`,
          category: "safety",
          icon: "🚨",
          title: "General Tourist Advisory & Caution",
          message: "Keep valuables secure in dense market places. Negotiate taxi/auto rates in advance or use authorized ride-hailing apps.",
          urgency: "notice",
          locationDetail: `${normLocation} Heritage Bazaar Area`,
          timestamp: "Live Advisory",
          source: "govt_advisory"
        },
        {
          id: `n-${Date.now()}-4`,
          category: "weather",
          icon: "🌧️",
          title: "Seasonal Climate & Drainage Alert",
          message: "Check local weather forecasts during monsoon season for sudden cloudburst or localized waterlogging updates.",
          urgency: "notice",
          locationDetail: `${normLocation} Low-lying Basements`,
          timestamp: "Live Advisory",
          source: "govt_advisory"
        }
      ]
    };
  }

  // 3. Merge User Post Analysis
  const userAnalysis = analyzeUserPostsForPlace(normLocation, db);
  if (userAnalysis.flags.length > 0) {
    baseIntel.notifications.unshift(...userAnalysis.flags);
  }

  return {
    locationName: normLocation,
    safetyIndex: baseIntel.safetyIndex,
    trafficIndex: baseIntel.trafficIndex,
    infraRating: baseIntel.infraRating,
    bestHours: baseIntel.bestHours,
    avoidHours: baseIntel.avoidHours,
    heatmapPoints: baseIntel.heatmapPoints,
    notifications: baseIntel.notifications,
    userPostsCount: userAnalysis.count
  };
}

module.exports = {
  generatePlaceAnalytics
};
