const API_URL = 'http://localhost:3000/api';
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || { id: 0, username: 'Guest' };
let posts = [];
let base64Media = null;

document.addEventListener('DOMContentLoaded', () => {
  const feedContainer = document.getElementById('feedContainer');
  const searchInput = document.getElementById('searchInput');

  // Load Posts
  async function loadPosts() {
    try {
      const res = await fetch(`${API_URL}/posts`);
      posts = await res.json();
      renderFeed(searchInput.value);
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  }

  // --- Render Function ---
  function renderFeed(filterQuery = '') {
    feedContainer.innerHTML = '';
    const filteredPosts = posts.filter(post => 
      (post.location && post.location.toLowerCase().includes(filterQuery.toLowerCase())) || 
      (post.username && post.username.toLowerCase().includes(filterQuery.toLowerCase()))
    );

    if (filteredPosts.length === 0) {
      feedContainer.innerHTML = '<p class="text-center text-[#fdf1e1]/60 mt-10">No spots found.</p>';
      return;
    }

    filteredPosts.forEach(post => {
      const postEl = document.createElement('article');
      postEl.className = 'glass-modal rounded-2xl overflow-hidden shadow-2xl';
      
      const commentsHtml = (post.comments || []).map(c => `
        <div class="text-sm mb-2">
          <strong class="text-[#7fb4d4] mr-2">${c.username}</strong><span class="text-[#fdf1e1]/90">${c.text}</span>
        </div>
      `).join('');
      
      postEl.innerHTML = `
        <div class="flex justify-between items-center p-4 border-b border-[#fdf1e1]/10">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-[#7fb4d4] flex items-center justify-center text-[#111411] font-bold">
              ${post.username.charAt(0).toUpperCase()}
            </div>
            <strong class="font-medium tracking-wide flex items-center gap-1">${post.username} 
              <span class="text-blue-400 text-xs" title="Verified Traveller">☑️</span>
            </strong>
          </div>
          <button class="px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${post.isFollowing ? 'border-[#fdf1e1]/30 text-[#fdf1e1]/80 hover:bg-[#fdf1e1]/10' : 'border-[#7fb4d4] text-[#7fb4d4] hover:bg-[#7fb4d4]/10'}" onclick="toggleFollow(${post.user_id}, '${post.username}', this)">
            ${post.isFollowing ? 'Following' : 'Follow'}
          </button>
        </div>
        
        ${post.media ? `
          <div class="w-full bg-black/40 max-h-[600px] overflow-hidden flex items-center justify-center relative">
            ${post.media.startsWith('data:video') ? 
              `<video src="${post.media}" controls class="w-full h-auto max-h-[600px] object-contain"></video>` :
              `<img src="${post.media}" alt="Spot Image" class="w-full h-auto max-h-[600px] object-contain">`
            }
            <div class="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs text-green-300 border border-green-300/30">
              ✓ Community Verified (30 days)
            </div>
          </div>
        ` : ''}
        
        <div class="p-5">
          <div class="flex gap-4 mb-4">
            <button class="text-2xl hover:scale-110 transition-transform ${post.isLiked ? 'text-red-500' : 'text-white'}" onclick="toggleLike(${post.id}, this)">
              ${post.isLiked ? '❤️' : '🤍'}
            </button>
            <button class="text-2xl hover:scale-110 transition-transform" onclick="toggleComments(${post.id})">💬</button>
          </div>
          
          <div class="mb-3 text-sm font-medium"><span id="like-count-${post.id}">${post.likes || 0}</span> likes</div>
          
          <h3 class="font-ogg text-2xl text-[#7fb4d4] mb-2">📍 ${post.location}</h3>
          ${post.description ? `<p class="text-[#fdf1e1]/90 mb-6 leading-relaxed">${post.description}</p>` : ''}
          
          <div class="space-y-3">
            ${post.hotel_name || post.hotel_feedback ? `
            <div class="bg-[#fdf1e1]/5 p-3 rounded-xl border border-[#fdf1e1]/10">
              <div class="text-xs uppercase tracking-widest text-[#fdf1e1]/60 mb-1">🏨 Hotel & Residency</div>
              <div class="text-sm"><strong>${post.hotel_name || 'Unnamed Hotel'}</strong> <span class="text-blue-400 text-xs" title="Verified Partner">☑️</span> - ${post.hotel_feedback || ''}</div>
              <div class="text-xs text-[#fdf1e1]/60 mt-1">Contact: ${post.hotel_contact || 'N/A'}</div>
            </div>` : ''}

            ${post.transport_type ? `
            <div class="bg-[#fdf1e1]/5 p-3 rounded-xl border border-[#fdf1e1]/10">
              <div class="text-xs uppercase tracking-widest text-[#fdf1e1]/60 mb-1">🚕 Transport</div>
              <div class="text-sm"><strong>${post.transport_type}</strong> (${post.transport_price || 'N/A'})</div>
              <div class="text-xs text-[#fdf1e1]/60 mt-1">Where: ${post.transport_contact || 'N/A'}</div>
            </div>` : ''}

            ${post.route_desc ? `
            <div class="bg-[#fdf1e1]/5 p-3 rounded-xl border border-[#fdf1e1]/10">
              <div class="text-xs uppercase tracking-widest text-[#fdf1e1]/60 mb-1">🗺️ Route & Cost</div>
              <div class="text-sm">${post.route_desc} <strong>(Cost: ${post.route_cost || 'N/A'})</strong></div>
            </div>` : ''}

            ${post.food_place ? `
            <div class="bg-[#fdf1e1]/5 p-3 rounded-xl border border-[#fdf1e1]/10">
              <div class="text-xs uppercase tracking-widest text-[#fdf1e1]/60 mb-1">🍽️ Food</div>
              <div class="text-sm"><strong>${post.food_place}</strong> <span class="text-blue-400 text-xs" title="Verified Partner">☑️</span> at ${post.food_location || 'unknown'} (${post.food_price || 'N/A'})</div>
              <div class="text-sm italic text-[#fdf1e1]/80 mt-1">"${post.food_feedback || ''}"</div>
            </div>` : ''}

            ${post.must_visit_name ? `
            <div class="bg-[#fdf1e1]/5 p-3 rounded-xl border border-[#fdf1e1]/10">
              <div class="text-xs uppercase tracking-widest text-[#fdf1e1]/60 mb-1">⭐ Must Visit Nearby</div>
              <div class="text-sm"><strong>${post.must_visit_name}</strong> via ${post.must_visit_transport || 'N/A'}</div>
            </div>` : ''}
          </div>
        </div>

        <div class="hidden border-t border-[#fdf1e1]/10 p-5 bg-black/20" id="comments-${post.id}">
          <div id="comment-list-${post.id}" class="mb-4 max-h-40 overflow-y-auto custom-scrollbar">
            ${commentsHtml}
          </div>
          <div class="flex gap-3">
            <input type="text" id="comment-input-${post.id}" placeholder="Add a comment..." class="glass-input flex-1 p-2.5 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#7fb4d4]">
            <button onclick="addComment(${post.id})" class="text-[#7fb4d4] font-medium px-2 hover:text-[#a5d3f0]">Post</button>
          </div>
        </div>
      `;
      feedContainer.appendChild(postEl);
    });
  }

  // --- Search ---
  searchInput.addEventListener('input', (e) => {
    renderFeed(e.target.value);
  });

  // --- Interactions ---
  window.toggleFollow = async (userId, username, btnEl) => {
    try {
      const res = await fetch(`${API_URL}/users/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ follower_id: currentUser.id, following_username: username })
      });
      const data = await res.json();
      if (data.status === 'followed') {
        btnEl.innerText = 'Following';
        btnEl.className = 'px-4 py-1.5 rounded-full text-sm font-medium border transition-colors border-[#fdf1e1]/30 text-[#fdf1e1]/80 hover:bg-[#fdf1e1]/10';
      } else {
        btnEl.innerText = 'Follow';
        btnEl.className = 'px-4 py-1.5 rounded-full text-sm font-medium border transition-colors border-[#7fb4d4] text-[#7fb4d4] hover:bg-[#7fb4d4]/10';
      }
    } catch (e) { console.error(e); }
  };

  window.toggleLike = async (postId, btnEl) => {
    try {
      const res = await fetch(`${API_URL}/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id })
      });
      const data = await res.json();
      const countEl = document.getElementById(`like-count-${postId}`);
      let count = parseInt(countEl.innerText);
      if (data.status === 'liked') {
        btnEl.innerText = '❤️';
        btnEl.classList.add('text-red-500');
        btnEl.classList.remove('text-white');
        countEl.innerText = count + 1;
      } else {
        btnEl.innerText = '🤍';
        btnEl.classList.remove('text-red-500');
        btnEl.classList.add('text-white');
        countEl.innerText = count - 1;
      }
    } catch (e) { console.error(e); }
  };

  window.toggleComments = (id) => {
    const el = document.getElementById(`comments-${id}`);
    if(el) {
      el.classList.toggle('hidden');
    }
  };

  window.addComment = async (postId) => {
    const input = document.getElementById(`comment-input-${postId}`);
    const text = input.value.trim();
    if(text) {
      try {
        const res = await fetch(`${API_URL}/posts/${postId}/comment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: currentUser.username, text })
        });
        const newComment = await res.json();
        
        const list = document.getElementById(`comment-list-${postId}`);
        list.innerHTML += `
          <div class="text-sm mb-2">
            <strong class="text-[#7fb4d4] mr-2">${newComment.username}</strong><span class="text-[#fdf1e1]/90">${newComment.text}</span>
          </div>`;
        input.value = '';
      } catch(e) { console.error(e); }
    }
  };

  // --- Wizard Logic ---
  const createModal = document.getElementById('createPostModal');
  const createBtn = document.getElementById('createPostBtn');
  const closeCreateBtn = document.getElementById('closeCreateModal');
  
  let currentStep = 1;
  const totalSteps = 4;
  
  const step1 = document.getElementById('step1');
  const step2 = document.getElementById('step2');
  const step3 = document.getElementById('step3');
  const step4 = document.getElementById('step4');
  const steps = [step1, step2, step3, step4];
  
  const title = document.getElementById('wizardTitle');
  const btnPrev = document.getElementById('wizardPrevBtn');
  const btnNext = document.getElementById('wizardNextBtn');
  const btnSubmit = document.getElementById('wizardSubmitBtn');

  function updateWizard() {
    steps.forEach((s, i) => {
      s.classList.toggle('hidden', i + 1 !== currentStep);
      s.classList.toggle('block', i + 1 === currentStep);
    });
    title.innerText = `Create Post - Step ${currentStep}/${totalSteps}`;
    
    if (currentStep === 1) {
      btnPrev.classList.add('invisible');
    } else {
      btnPrev.classList.remove('invisible');
    }
    
    if (currentStep === totalSteps) {
      btnNext.classList.add('hidden');
      btnSubmit.classList.remove('hidden');
    } else {
      btnNext.classList.remove('hidden');
      btnSubmit.classList.add('hidden');
    }
  }

  createBtn.addEventListener('click', () => {
    currentStep = 1;
    updateWizard();
    createModal.classList.remove('hidden');
    createModal.classList.add('flex');
  });

  closeCreateBtn.addEventListener('click', () => {
    createModal.classList.add('hidden');
    createModal.classList.remove('flex');
  });

  btnNext.addEventListener('click', () => {
    if (currentStep < totalSteps) {
      currentStep++;
      updateWizard();
    }
  });

  btnPrev.addEventListener('click', () => {
    if (currentStep > 1) {
      currentStep--;
      updateWizard();
    }
  });

  // Image Upload to Base64
  const mediaInput = document.getElementById('postMediaFile');
  const mediaPreview = document.getElementById('mediaPreview');
  mediaInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(evt) {
        base64Media = evt.target.result;
        mediaPreview.src = base64Media;
        mediaPreview.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    }
  });

  // Geolocation
  const getLocationBtn = document.getElementById('getLocationBtn');
  const locationInput = document.getElementById('postLocation');
  getLocationBtn.addEventListener('click', () => {
    getLocationBtn.innerText = '⏳';
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        // Simple mock of reverse geocoding to keep it lightweight.
        // In reality, this would hit the Google Maps Geocoding API.
        locationInput.value = `📍 Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        getLocationBtn.innerText = '✅';
        setTimeout(() => getLocationBtn.innerText = '📍', 2000);
      }, (error) => {
        alert("Unable to fetch location: " + error.message);
        getLocationBtn.innerText = '📍';
      });
    } else {
      alert("Geolocation is not supported by your browser.");
      getLocationBtn.innerText = '📍';
    }
  });

  const createForm = document.getElementById('createPostForm');
  createForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const postData = {
      user_id: currentUser.id,
      username: currentUser.username,
      location: locationInput.value,
      media: base64Media || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80',
      description: document.getElementById('postDescription').value,
      hotel_name: document.getElementById('postHotelName').value,
      hotel_contact: document.getElementById('postHotelContact').value,
      hotel_feedback: document.getElementById('postHotelFeedback').value,
      transport_type: document.getElementById('postTransportType').value,
      transport_price: document.getElementById('postTransportPrice').value,
      transport_contact: document.getElementById('postTransportContact').value,
      route_desc: document.getElementById('postRouteDesc').value,
      route_cost: document.getElementById('postRouteCost').value,
      food_place: document.getElementById('postFoodPlace').value,
      food_price: document.getElementById('postFoodPrice').value,
      food_location: document.getElementById('postFoodLocation').value,
      food_feedback: document.getElementById('postFoodFeedback').value,
      must_visit_name: document.getElementById('postMustVisitName').value,
      must_visit_transport: document.getElementById('postMustVisitTransport').value
    };

    try {
      const res = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      });
      
      if (res.ok) {
        createModal.classList.add('hidden');
        createModal.classList.remove('flex');
        createForm.reset();
        mediaPreview.classList.add('hidden');
        base64Media = null;
        await loadPosts();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert('Failed to post');
      }
    } catch(err) {
      console.error(err);
    }
  });

  // --- Chat Toggles ---
  const chatSidebar = document.getElementById('chatSidebar');
  const chatBtn = document.getElementById('chatBtn');
  const closeChatBtn = document.getElementById('closeChatBtn');
  
  chatBtn.addEventListener('click', () => chatSidebar.classList.remove('right-[-350px]', 'right-0') || chatSidebar.classList.add('right-0'));
  closeChatBtn.addEventListener('click', () => chatSidebar.classList.remove('right-0') || chatSidebar.classList.add('right-[-350px]'));

  // Init
  if(currentUser.username) {
    document.getElementById('profileIcon').innerText = currentUser.username.charAt(0).toUpperCase();
  }
  loadPosts();
});
