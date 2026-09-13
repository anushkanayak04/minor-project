const API_URL = 'http://localhost:3000/api';

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

  signInForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('signin-username').value;
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
      alert('Error connecting to backend');
    }
  });

  signUpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;

    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, email, password })
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
      alert('Error connecting to backend');
    }
  });
});
