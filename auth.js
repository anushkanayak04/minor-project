const API_URL = window.location.origin.includes(':') ? (window.location.origin.replace(/:[0-9]+$/, ':3000') + '/api') : '/api';
let pendingUserSession = null;

document.addEventListener('DOMContentLoaded', () => {
  const signInForm = document.getElementById('signInForm');
  const signUpForm = document.getElementById('signUpForm');
  const showSignUpBtn = document.getElementById('showSignUp');
  const showSignInBtn = document.getElementById('showSignIn');

  showSignUpBtn.addEventListener('click', () => {
    signInForm.classList.remove('active');
    signUpForm.classList.add('active');
  });

  showSignInBtn.addEventListener('click', () => {
    signUpForm.classList.remove('active');
    signInForm.classList.add('active');
  });

  // Radio button toggle hint
  document.getElementById('typeNormal').addEventListener('change', () => {
    document.getElementById('accountTypeHint').textContent = "Normal accounts can post photos. Pro Creators verify Aadhaar + Face Scan for verified creator status.";
  });

  document.getElementById('typePro').addEventListener('change', () => {
    document.getElementById('accountTypeHint').innerHTML = "<strong class='text-[#7fb4d4]'>Pro Creator Mode selected:</strong> Requires Aadhaar & Face Scan verification. (1 account per Aadhaar limit).";
  });

  // Sign In
  signInForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('signin-username').value.trim();
    const password = document.getElementById('signin-password').value;

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('currentUser', JSON.stringify(data));
        window.location.href = 'feed.html';
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to backend server');
    }
  });

  // Sign Up
  signUpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value.trim();
    const username = document.getElementById('signup-username').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    const isPro = document.getElementById('typePro').checked;

    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          username,
          email,
          password,
          role: isPro ? 'professional' : 'normal'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error);
        return;
      }

      pendingUserSession = data;
      localStorage.setItem('currentUser', JSON.stringify(data));

      if (isPro) {
        // Open Professional Verification Modal
        openProVerificationModal();
      } else {
        window.location.href = 'feed.html';
      }

    } catch (err) {
      console.error(err);
      alert('Error connecting to backend server');
    }
  });

  // Modal Setup
  setupProVerifyModal();
});

function openProVerificationModal() {
  const modal = document.getElementById('proVerifyModal');
  document.getElementById('proStep1').classList.remove('hidden');
  document.getElementById('proStep2').classList.add('hidden');
  document.getElementById('proStep3').classList.add('hidden');
  document.getElementById('aadhaarError').classList.add('hidden');
  modal.classList.remove('hidden');
}

function setupProVerifyModal() {
  const modal = document.getElementById('proVerifyModal');
  const closeBtn = document.getElementById('closeProVerifyModalBtn');
  const nextToStep2Btn = document.getElementById('nextToStep2Btn');
  const completeFaceScanBtn = document.getElementById('completeFaceScanBtn');
  const finishBtn = document.getElementById('finishVerificationBtn');

  closeBtn.onclick = () => {
    modal.classList.add('hidden');
    window.location.href = 'feed.html';
  };

  finishBtn.onclick = () => {
    modal.classList.add('hidden');
    window.location.href = 'feed.html';
  };

  // Step 1 -> Step 2
  nextToStep2Btn.onclick = async () => {
    const aadhaarVal = document.getElementById('aadhaarInput').value.replace(/\s+/g, '').trim();
    const aadhaarError = document.getElementById('aadhaarError');

    if (aadhaarVal.length !== 12 || !/^\d{12}$/.test(aadhaarVal)) {
      aadhaarError.textContent = "Please enter a valid 12-digit Aadhaar number.";
      aadhaarError.classList.remove('hidden');
      return;
    }

    nextToStep2Btn.disabled = true;
    nextToStep2Btn.textContent = "Verifying 1-Aadhaar Policy...";

    try {
      // Test Aadhaar 1-Account restriction
      const res = await fetch(`${API_URL}/auth/verify-professional`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: pendingUserSession ? pendingUserSession.id : 0,
          username: pendingUserSession ? pendingUserSession.username : '',
          aadhaar_no: aadhaarVal,
          face_scan_verified: true
        })
      });

      const data = await res.json();
      if (!res.ok) {
        aadhaarError.textContent = data.error;
        aadhaarError.classList.remove('hidden');
        nextToStep2Btn.disabled = false;
        nextToStep2Btn.textContent = "Proceed to Biometric Face Scan →";
        return;
      }

      // Proceed to Step 2
      document.getElementById('proStep1').classList.add('hidden');
      document.getElementById('proStep2').classList.remove('hidden');
      document.getElementById('step1Tab').className = "text-[#fdf1e1]/40";
      document.getElementById('step2Tab').className = "font-bold text-[#7fb4d4]";

    } catch (err) {
      aadhaarError.textContent = "Server error verifying Aadhaar ID: " + err.message;
      aadhaarError.classList.remove('hidden');
    } finally {
      nextToStep2Btn.disabled = false;
      nextToStep2Btn.textContent = "Proceed to Biometric Face Scan →";
    }
  };

  // Step 2 Face Scan Simulation
  completeFaceScanBtn.onclick = () => {
    completeFaceScanBtn.disabled = true;
    completeFaceScanBtn.textContent = "Scanning Biometric Liveness...";

    const statusText = document.getElementById('scanStatusText');
    const progressBar = document.getElementById('scanProgressBar');
    const faceIcon = document.getElementById('faceIcon');

    let pct = 0;
    const interval = setInterval(() => {
      pct += 25;
      progressBar.style.width = `${pct}%`;
      if (pct === 25) statusText.textContent = "Detecting Facial Landmarks...";
      if (pct === 50) statusText.textContent = "Verifying Liveness & Blink Check...";
      if (pct === 75) statusText.textContent = "Matching Aadhaar Biometric Record...";
      if (pct >= 100) {
        clearInterval(interval);
        statusText.textContent = "✓ Biometric Verification Passed!";
        statusText.className = "absolute bottom-2 text-[10px] font-mono bg-emerald-500/90 text-black font-bold px-2.5 py-0.5 rounded-full";
        faceIcon.textContent = "👤☑️";

        setTimeout(() => {
          document.getElementById('proStep2').classList.add('hidden');
          document.getElementById('proStep3').classList.remove('hidden');
          document.getElementById('step2Tab').className = "text-[#fdf1e1]/40";
          document.getElementById('step3Tab').className = "font-bold text-[#7fb4d4]";

          // Update current user storage to verified pro
          if (pendingUserSession) {
            pendingUserSession.role = 'professional';
            pendingUserSession.is_verified_pro = true;
            localStorage.setItem('currentUser', JSON.stringify(pendingUserSession));
          }
        }, 1000);
      }
    }, 600);
  };
}
