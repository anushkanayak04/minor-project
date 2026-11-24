/**
 * SOS & Emergency Safety Suite Engine
 * Features:
 * - Safety Mode ON 🟢 / OFF ⚪ Toggle
 * - Web Speech API Voice Panic Keyword Listening ("help", "save me", "emergency", "sos", "danger")
 * - Accelerometer / DeviceMotion Violent Shake Detection
 * - Multi-Signal AI Danger Confidence Scoring
 * - 10-Second Auto Emergency Countdown ("Are You Safe?")
 * - Live GPS Location & MediaRecorder 3-Second Audio/Video Recording
 * - Emergency Contact Dispatch & Nearby App User Mesh Trigger
 */

var isFileProtocol = window.location.protocol === 'file:';
var API_BASE = isFileProtocol 
  ? 'http://localhost:3000/api'
  : (window.location.origin.includes(':') && !window.location.origin.endsWith(':3000')
      ? window.location.origin.replace(/:[0-9]+$/, ':3000') + '/api'
      : (window.location.origin + '/api'));

class SOSEngine {
  constructor() {
    this.safetyMode = localStorage.getItem('safetyModeActive') === 'true';
    this.dangerScore = 0;
    this.recognition = null;
    this.isListening = false;
    this.countdownTimer = null;
    this.countdownSeconds = 10;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.currentLocation = null;
    this.lastShakeTime = 0;

    this.initUI();
    if (this.safetyMode) {
      this.activateSafetySensors();
    }
  }

  initUI() {
    // 1. Inject Floating Safety Mode Widget & SOS Trigger Button
    const isFeedOrAuth = window.location.pathname.endsWith('feed.html') || window.location.pathname.endsWith('auth.html') || document.getElementById('quickSosBtn');
    if (!isFeedOrAuth && !document.getElementById('sosWidgetContainer')) {
      const widget = document.createElement('div');
      widget.id = 'sosWidgetContainer';
      widget.className = 'fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 font-sans';
      widget.innerHTML = `
        <div id="safetyModeCapsule" class="glass-modal px-3.5 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 cursor-pointer shadow-xl transition-all hover:scale-105 ${this.safetyMode ? 'border-emerald-500/50 text-emerald-300 bg-emerald-950/80' : 'border-white/20 text-white/70 bg-black/80'}">
          <span class="w-2.5 h-2.5 rounded-full ${this.safetyMode ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'} inline-block"></span>
          <span id="safetyModeStatusText">${this.safetyMode ? '🟢 SAFETY MODE ACTIVE' : '⚪ SAFETY MODE OFF'}</span>
        </div>

        <button id="globalSOSButton" aria-label="Trigger SOS Emergency" class="relative w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white font-black text-base border-4 border-white/30 shadow-[0_10px_25px_rgba(239,68,68,0.6)] hover:scale-110 active:scale-95 transition-all flex items-center justify-center">
          <span class="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-40"></span>
          <span>SOS</span>
        </button>
      `;
      document.body.appendChild(widget);

      document.getElementById('safetyModeCapsule').onclick = () => this.toggleSafetyMode();
      document.getElementById('globalSOSButton').onclick = () => this.triggerManualSOS();
    }

    // 2. Inject 10-Second Countdown Overlay Modal
    if (!document.getElementById('sosCountdownOverlay')) {
      const overlay = document.createElement('div');
      overlay.id = 'sosCountdownOverlay';
      overlay.className = 'hidden fixed inset-0 z-[10000] flex items-center justify-center bg-red-950/90 backdrop-blur-md p-4 text-[white] animate-fade-in';
      overlay.innerHTML = `
        <div class="glass-modal max-w-md w-full p-8 rounded-3xl text-center border-2 border-red-500 shadow-2xl space-y-6">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse">
            <span>🚨 DANGER SIGNAL DETECTED</span>
          </div>

          <h2 class="font-ogg text-4xl text-red-400 font-bold">Are You Safe?</h2>
          <p class="text-xs text-[white]/80 leading-relaxed" id="sosSignalReason">
            Voice panic keyword or phone shaking motion detected. Emergency dispatch will trigger automatically.
          </p>

          <!-- Large 10-Second Countdown Counter -->
          <div class="relative w-32 h-32 mx-auto flex items-center justify-center">
            <div class="absolute inset-0 rounded-full border-8 border-red-500/30"></div>
            <div id="sosCountdownRing" class="absolute inset-0 rounded-full border-8 border-red-500 border-t-transparent animate-spin"></div>
            <span id="sosCountdownNum" class="text-5xl font-black text-white">10</span>
          </div>

          <div class="space-y-3 pt-2">
            <button id="cancelSOSBtn" class="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-2xl text-lg shadow-xl transition-all transform hover:scale-105">
              I'M SAFE — CANCEL
            </button>
            <p class="text-[10px] text-[white]/50">AI-assisted detection. Not a substitute for official 112/911 emergency services.</p>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      document.getElementById('cancelSOSBtn').onclick = () => this.cancelEmergency();
    }

    // 3. Inject Emergency Active Workflow & Media Recording Drawer
    if (!document.getElementById('sosWorkflowDrawer')) {
      const drawer = document.createElement('div');
      drawer.id = 'sosWorkflowDrawer';
      drawer.className = 'hidden fixed inset-0 z-[10001] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 text-[white]';
      drawer.innerHTML = `
        <div class="glass-modal max-w-lg w-full p-6 md:p-8 rounded-3xl border-2 border-red-600 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
          <div class="flex justify-between items-center border-b border-red-500/30 pb-3">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-red-500 animate-ping inline-block"></span>
              <h3 class="font-ogg text-2xl text-red-400 font-bold">EMERGENCY ACTIVE</h3>
            </div>
            <span class="text-xs bg-red-500/20 text-red-300 border border-red-500/40 px-2.5 py-0.5 rounded-full font-bold">Live Dispatch</span>
          </div>

          <!-- GPS Location Box -->
          <div class="bg-black/60 p-4 rounded-2xl border border-white/10 space-y-1.5 text-xs">
            <div class="text-[#7fb4d4] font-bold flex items-center gap-1.5">
              <span>📍 Live GPS Coordinates:</span>
            </div>
            <div class="text-[white]/90 font-mono text-xs" id="sosGpsText">Acquiring GPS location...</div>
            <a href="#" id="sosGpsLink" target="_blank" class="text-blue-400 hover:underline block text-[11px] font-medium hidden">Open Google Maps Route →</a>
          </div>

          <!-- 3-Second Audio/Video Recording Box -->
          <div class="bg-black/60 p-4 rounded-2xl border border-red-500/30 space-y-3 text-xs">
            <div class="flex justify-between items-center">
              <strong class="text-red-400 flex items-center gap-1.5">
                <span>📹 Emergency 3-Sec Media Clip</span>
              </strong>
              <span id="recordingStatusBadge" class="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full font-bold animate-pulse">Recording...</span>
            </div>
            
            <div class="relative w-full h-44 bg-black rounded-xl overflow-hidden flex items-center justify-center border border-white/10">
              <video id="sosPreviewVideo" autoplay muted playsinline class="w-full h-full object-cover"></video>
              <div id="sosMediaFallbackText" class="text-xs text-[white]/50 text-center p-4">Camera stream initializing...</div>
            </div>

            <div class="flex gap-2 justify-end">
              <button id="stopRecBtn" class="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold">Stop Recording</button>
              <button id="saveRecBtn" class="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs">Save Clip</button>
            </div>
          </div>

          <!-- Nearby Devices Broadcast Status -->
          <div class="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs space-y-1.5">
            <strong class="text-blue-300 block">📡 Mesh Broadcast Active:</strong>
            <p class="text-[white]/80 leading-relaxed" id="sosBroadcastStatus">
              Broadcasting SOS payload to nearby active app users and emergency contacts...
            </p>
          </div>

          <div class="pt-2 flex justify-between items-center border-t border-white/10">
            <button id="deactivateSOSBtn" class="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-lg">
              Deactivate SOS & Return
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(drawer);

      document.getElementById('deactivateSOSBtn').onclick = () => this.deactivateEmergencyWorkflow();
      document.getElementById('stopRecBtn').onclick = () => this.stopRecording();
      document.getElementById('saveRecBtn').onclick = () => this.saveRecording();
    }
  }

  toggleSafetyMode() {
    this.safetyMode = !this.safetyMode;
    localStorage.setItem('safetyModeActive', this.safetyMode);

    const capsule = document.getElementById('safetyModeCapsule');
    const text = document.getElementById('safetyModeStatusText');

    if (this.safetyMode) {
      capsule.className = 'glass-modal px-3.5 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 cursor-pointer shadow-xl transition-all hover:scale-105 border-emerald-500/50 text-emerald-300 bg-emerald-950/80';
      text.textContent = '🟢 SAFETY MODE ACTIVE';
      this.activateSafetySensors();
      alert('🟢 SAFETY MODE ACTIVE: Voice panic keyword and phone shake monitoring enabled.');
    } else {
      capsule.className = 'glass-modal px-3.5 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 cursor-pointer shadow-xl transition-all hover:scale-105 border-white/20 text-[white]/60 bg-black/80';
      text.textContent = '⚪ SAFETY MODE OFF';
      this.deactivateSafetySensors();
      alert('⚪ SAFETY MODE OFF: Sensors, voice listening, and location tracking stopped.');
    }
  }

  activateSafetySensors() {
    this.initVoiceListening();
    this.initShakeDetection();
  }

  deactivateSafetySensors() {
    if (this.recognition) {
      try { this.recognition.stop(); } catch (e) {}
      this.recognition = null;
    }
    this.isListening = false;
    window.removeEventListener('devicemotion', this.handleShakeEvent);
    this.dangerScore = 0;
  }

  // 1. Web Speech API Panic Keyword Listener
  initVoiceListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.log('Web Speech API not supported in this browser.');
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      const panicKeywords = ['help', 'help me', 'save me', 'emergency', 'sos', 'danger', 'police', 'stop', 'bachao', 'madad'];

      this.recognition.onresult = (event) => {
        if (!this.safetyMode) return;
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript.toLowerCase().trim();
          console.log('Voice listened:', transcript);

          if (panicKeywords.some(kw => transcript.includes(kw))) {
            this.addDangerConfidence(45, `Voice Panic Keyword Recognized: "${transcript}"`);
            break;
          }
        }
      };

      this.recognition.onerror = (e) => {
        if (this.safetyMode) {
          setTimeout(() => this.restartVoiceListening(), 2000);
        }
      };

      this.recognition.onend = () => {
        if (this.safetyMode) {
          setTimeout(() => this.restartVoiceListening(), 1000);
        }
      };

      this.recognition.start();
      this.isListening = true;
    } catch (e) {
      console.log('Voice listener start error:', e);
    }
  }

  restartVoiceListening() {
    if (this.safetyMode && this.recognition) {
      try { this.recognition.start(); } catch (e) {}
    }
  }

  // 2. Accelerometer Shake Event Listener
  initShakeDetection() {
    this.handleShakeEvent = (e) => {
      if (!this.safetyMode) return;
      const acc = e.accelerationIncludingGravity || e.acceleration;
      if (!acc) return;

      const delta = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
      const now = Date.now();

      // Violent shake threshold (> 26 m/s2) with 1.5s cooldown
      if (delta > 26 && (now - this.lastShakeTime > 1500)) {
        this.lastShakeTime = now;
        this.addDangerConfidence(45, 'Sudden Violent Device Shaking Detected');
      }
    };

    window.addEventListener('devicemotion', this.handleShakeEvent);
  }

  addDangerConfidence(amount, reason) {
    this.dangerScore += amount;
    console.log(`Danger Score +${amount}% -> Total: ${this.dangerScore}% (${reason})`);

    if (this.dangerScore >= 70) {
      this.triggerCountdown(reason);
    }
  }

  triggerManualSOS() {
    this.addDangerConfidence(100, 'Manual Emergency SOS Button Triggered');
  }

  // 3. 10-Second Auto Emergency Countdown
  triggerCountdown(reason) {
    if (this.countdownTimer) return; // already counting down

    const overlay = document.getElementById('sosCountdownOverlay');
    const reasonText = document.getElementById('sosSignalReason');
    const countNum = document.getElementById('sosCountdownNum');

    reasonText.textContent = reason || 'Possible danger signal detected. Emergency dispatch will trigger automatically.';
    this.countdownSeconds = 10;
    countNum.textContent = this.countdownSeconds;
    overlay.classList.remove('hidden');

    this.countdownTimer = setInterval(() => {
      this.countdownSeconds--;
      countNum.textContent = this.countdownSeconds;

      if (this.countdownSeconds <= 0) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
        overlay.classList.add('hidden');
        this.startEmergencyWorkflow();
      }
    }, 1000);
  }

  cancelEmergency() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    this.dangerScore = 0;
    document.getElementById('sosCountdownOverlay').classList.add('hidden');
    alert('✓ Emergency cancelled. You are safe.');
  }

  // 4. Emergency Workflow (GPS + MediaRecorder 3-sec clip + Nearby Broadcast)
  async startEmergencyWorkflow() {
    const drawer = document.getElementById('sosWorkflowDrawer');
    drawer.classList.remove('hidden');

    // Acquire GPS
    this.acquireLocation();

    // Start 3-Second Audio/Video Recording
    this.startRecording();
  }

  acquireLocation() {
    const gpsText = document.getElementById('sosGpsText');
    const gpsLink = document.getElementById('sosGpsLink');

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(5);
          const lng = pos.coords.longitude.toFixed(5);
          this.currentLocation = { lat, lng };
          gpsText.textContent = `Lat: ${lat}, Lng: ${lng} (Accuracy: ${Math.round(pos.coords.accuracy)}m)`;
          gpsLink.href = `https://www.google.com/maps?q=${lat},${lng}`;
          gpsLink.classList.remove('hidden');

          // Send SOS alert to backend
          this.sendSOSAlertToBackend();
        },
        (err) => {
          gpsText.textContent = 'GPS location permission denied or unavailable.';
          this.sendSOSAlertToBackend();
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      gpsText.textContent = 'Geolocation API not supported.';
      this.sendSOSAlertToBackend();
    }
  }

  async startRecording() {
    const videoElem = document.getElementById('sosPreviewVideo');
    const fallbackText = document.getElementById('sosMediaFallbackText');
    const recBadge = document.getElementById('recordingStatusBadge');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      videoElem.srcObject = stream;
      fallbackText.classList.add('hidden');

      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(stream);
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.recordedChunks.push(e.data);
      };

      this.mediaRecorder.start();
      recBadge.textContent = 'Recording 3-sec Clip...';

      // Auto-cut clip after 3 seconds as requested
      setTimeout(() => {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.stop();
          recBadge.textContent = '✓ 3-Sec Clip Captured';
          recBadge.className = 'text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold';
        }
      }, 3500);

    } catch (err) {
      console.warn('Camera/Mic permission error:', err);
      fallbackText.textContent = 'Camera/Mic permission required for emergency clip recording.';
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
      document.getElementById('recordingStatusBadge').textContent = 'Stopped';
    }
  }

  saveRecording() {
    if (this.recordedChunks.length === 0) {
      alert('No recording data available to save.');
      return;
    }
    const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emergency_sos_clip_${Date.now()}.webm`;
    a.click();
  }

  async sendSOSAlertToBackend() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser')) || { username: 'Anonymous User' };
    const broadcastStatus = document.getElementById('sosBroadcastStatus');

    try {
      const res = await fetch(`${API_BASE}/sos/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUser.username,
          location: this.currentLocation ? `${this.currentLocation.lat}, ${this.currentLocation.lng}` : 'Unknown Location',
          coordinates: this.currentLocation,
          dangerScore: this.dangerScore,
          timestamp: new Date().toISOString()
        })
      });

      if (res.ok) {
        broadcastStatus.innerHTML = `✓ Emergency SOS alert recorded with your GPS location and sent to the <strong class="text-blue-300">safety monitoring engine</strong>. If you are in immediate danger, contact your local emergency services now.`;
      }
    } catch (e) {
      console.warn('Backend SOS alert broadcast error:', e);
    }
  }

  deactivateEmergencyWorkflow() {
    this.stopRecording();
    this.dangerScore = 0;
    document.getElementById('sosWorkflowDrawer').classList.add('hidden');
  }
}

// Auto-instantiate global SOS Engine on page load
let globalSOSEngineInstance = null;
document.addEventListener('DOMContentLoaded', () => {
  globalSOSEngineInstance = new SOSEngine();
});
