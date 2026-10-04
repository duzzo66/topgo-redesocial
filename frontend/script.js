const loginForm = document.querySelector('#loginForm');
const appShell = document.querySelector('#appShell');
const loginError = document.querySelector('#loginError');
if (appShell && !sessionStorage.getItem('entreNosAuth')) window.location.href = 'login.html';
if (loginForm) loginForm.addEventListener('submit', event => {
  event.preventDefault();
  const user = document.querySelector('#username').value.trim().toLowerCase();
  const password = document.querySelector('#password').value;
  if (['dressa', 'tsukii'].includes(user) && password === '21242325') {
    sessionStorage.setItem('entreNosAuth', 'true'); window.location.href = 'index.html';
  } else loginError.textContent = 'Usuário ou senha incorretos.';
});
if (appShell) {
const menuToggle = document.querySelector('#menuToggle');
const sidebar = document.querySelector('.sidebar');
const menuOverlay = document.querySelector('#menuOverlay');
function toggleMenu(open) { sidebar.classList.toggle('open', open); menuOverlay.classList.toggle('open', open); menuToggle.setAttribute('aria-expanded', open); }
menuToggle.addEventListener('click', () => toggleMenu(!sidebar.classList.contains('open')));
menuOverlay.addEventListener('click', () => toggleMenu(false));
document.querySelectorAll('.nav-item').forEach(item => item.addEventListener('click', () => toggleMenu(false)));
const postText = document.querySelector('#postText');
const charCount = document.querySelector('#charCount');
const settingsOverlay = document.querySelector('#settingsOverlay');
const account = JSON.parse(localStorage.getItem('entreNosAccount') || '{}');
const settingsButton = document.querySelector('#settingsButton');
if (settingsButton) settingsButton.addEventListener('click', () => { settingsOverlay.classList.remove('is-hidden'); document.querySelector('#nameInput').value = account.name || 'Nosso perfil'; document.querySelector('#bioInput').value = account.bio || ''; });
document.querySelector('#settingsClose')?.addEventListener('click', () => settingsOverlay.classList.add('is-hidden'));
settingsOverlay?.addEventListener('click', event => { if (event.target === settingsOverlay) settingsOverlay.classList.add('is-hidden'); });
document.querySelector('#bannerInput')?.addEventListener('change', event => { const file = event.target.files[0]; if (file) document.querySelector('#bannerPreview').style.backgroundImage = `url(${URL.createObjectURL(file)})`; });
document.querySelector('#photoInput')?.addEventListener('change', event => { const file = event.target.files[0]; if (file) document.querySelector('#profilePreview').style.backgroundImage = `url(${URL.createObjectURL(file)})`; });
document.querySelector('#saveSettings')?.addEventListener('click', () => { localStorage.setItem('entreNosAccount', JSON.stringify({name:document.querySelector('#nameInput').value.trim(),bio:document.querySelector('#bioInput').value.trim()})); settingsOverlay.classList.add('is-hidden'); });
if (postText) {
const posts = document.querySelector('#posts');
document.querySelector('#focusComposer').addEventListener('click', () => { postText.focus(); document.querySelector('#composer').scrollIntoView({behavior:'smooth'}); });
postText.addEventListener('input', () => { charCount.textContent = `${postText.value.length} / 280`; });
document.querySelector('#publishButton').addEventListener('click', () => {
  const text = postText.value.trim(); if (!text) return;
  const article = document.createElement('article'); article.className='post';
  article.innerHTML = `<div class="avatar avatar-user">L</div><div class="post-body"><div class="post-meta"><strong>Lucas</strong><span>@lucas · agora</span><button class="post-more">•••</button></div><p>${text.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</p><div class="post-actions"><button class="action like">♡ <span>0</span></button><button class="action">◯ <span>0</span></button><button class="action">↗</button></div></div>`;
  posts.prepend(article); postText.value=''; charCount.textContent='0 / 280';
});
document.addEventListener('click', event => { const button=event.target.closest('.like'); if(button){button.classList.toggle('liked'); button.firstChild.textContent=button.classList.contains('liked')?'♥ ':'♡ ';} });
}
}
