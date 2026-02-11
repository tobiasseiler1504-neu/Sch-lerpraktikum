const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
const upperChars = lowerChars.toUpperCase();
const numberChars = '0123456789';
const symbolChars = '!@#$%^&*()-_=+[]{};:,.<>?/~`|\\';

const el = id => document.getElementById(id);
const lengthInput = el('length');
const lengthValue = el('lengthValue');
const lowerCb = el('lower');
const upperCb = el('upper');
const numbersCb = el('numbers');
const symbolsCb = el('symbols');
const generateBtn = el('generate');
const copyBtn = el('copy');
const passwordOut = el('password');
const strength = el('strength');
const styleSelect = el('styleSelect');

function updateLengthDisplay(){ lengthValue.textContent = lengthInput.value; }
lengthInput.addEventListener('input', updateLengthDisplay);
updateLengthDisplay();

function pickRandom(str){ return str[Math.floor(Math.random()*str.length)]; }

function evaluateStrength(pw){
  let score = 0;
  if(pw.length >= 8) score++;
  if(/[A-Z]/.test(pw)) score++;
  if(/[0-9]/.test(pw)) score++;
  if(/[^A-Za-z0-9]/.test(pw)) score++;
  if(pw.length >= 16) score++;
  const labels = ['Sehr schwach','Schwach','Mittel','Gut','Sehr gut','Ausgezeichnet'];
  strength.textContent = labels[score];
}

function generatePassword(){
  const len = parseInt(lengthInput.value,10);
  const use = [];
  if(lowerCb.checked) use.push(lowerChars);
  if(upperCb.checked) use.push(upperChars);
  if(numbersCb.checked) use.push(numberChars);
  if(symbolsCb.checked) use.push(symbolChars);

  if(use.length === 0){ alert('Bitte mindestens eine Zeichengruppe auswählen.'); return ''; }

  // Ensure at least one char from each selected set
  const required = use.map(set => pickRandom(set));
  let all = use.join('');

  let remaining = len - required.length;
  let res = required.slice();
  for(let i=0;i<remaining;i++) res.push(pickRandom(all));

  // Shuffle
  for(let i=res.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [res[i],res[j]] = [res[j],res[i]];
  }
  const pw = res.join('');
  evaluateStrength(pw);
  return pw;
}

generateBtn.addEventListener('click', ()=>{
  const pw = generatePassword();
  if(pw){
    passwordOut.value = pw;
    // also update checker UI and fill the checker input for quick re-check
    try{ checkInput.value = pw; }catch(e){}
    try{ updateCheckerUI(pw); }catch(e){}
  }
});

copyBtn.addEventListener('click', async ()=>{
  if(!passwordOut.value) return;
  try{
    await navigator.clipboard.writeText(passwordOut.value);
    copyBtn.textContent = 'Kopiert ✓';
    setTimeout(()=>copyBtn.textContent='Kopieren',1200);
  }catch(e){
    alert('Kopieren fehlgeschlagen.');
  }
});

styleSelect.addEventListener('change', ()=>{
  // remove theme classes from both html and body to avoid leftover class on either
  const removeThemes = ['theme-classic','theme-neon','theme-lila'];
  document.documentElement.classList.remove(...removeThemes);
  document.body.classList.remove(...removeThemes);
  const v = styleSelect.value;
  if(v==='classic') document.documentElement.classList.add('theme-classic');
  if(v==='lila') document.documentElement.classList.add('theme-lila');
  if(v==='neon') document.documentElement.classList.add('theme-neon');
});

// Apply selected theme on load so the select's current value takes effect
window.addEventListener('load', ()=>{
  styleSelect.dispatchEvent(new Event('change'));
  generateBtn.click();
});

// Generate an initial password on load
window.addEventListener('load', ()=> generateBtn.click());

// --- Password Checker ---
const checkInput = el('checkPassword');
const checkBtn = el('checkBtn');
const checkerText = el('checkerText');
const checkerList = el('checkerList');
const checkerFill = el('checkerFill');

function hasSequence(s){
  if(!s || s.length < 3) return false;
  const seqs = ['abcdefghijklmnopqrstuvwxyz','0123456789','qwertyuiop','asdfghjkl','zxcvbnm'];
  const low = s.toLowerCase();
  for(const seq of seqs){
    for(let i=0;i+3<=low.length;i++){
      const sub = low.slice(i,i+3);
      if(seq.includes(sub) || seq.split('').reverse().join('').includes(sub)) return true;
    }
  }
  return false;
}

function assessPassword(pw){
  const res = {messages:[],bits:0,verdict:'',score:0};
  if(!pw){ res.messages.push('Kein Passwort eingegeben.'); res.verdict='Sehr schwach'; return res; }
  const len = pw.length;
  const hasLower = /[a-z]/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  const hasSymbol = /[^A-Za-z0-9]/.test(pw);

  // pool estimate
  let pool = 0;
  if(hasLower) pool += 26;
  if(hasUpper) pool += 26;
  if(hasNumber) pool += 10;
  if(hasSymbol) pool += 32;
  res.bits = pool > 0 ? Math.round(Math.log2(pool) * len) : 0;

  // Basic checks and messages
  if(len < 8) { res.messages.push('Zu kurz: mindestens 8 Zeichen empfohlen.'); }
  if(len >= 8 && len < 12) { res.messages.push('Länge ok, aber länger ist sicherer (12+).'); }
  if(len >= 12) { res.messages.push('Länge gut.'); }

  const categories = [hasLower,hasUpper,hasNumber,hasSymbol].filter(Boolean).length;
  if(categories < 2) res.messages.push('Geringe Zeichenvielvalt; nutze Groß-, Kleinbuchstaben, Zahlen und Sonderzeichen.');
  else res.messages.push(`Zeichentypen: ${categories} verwendet.`);

  if(/(.)\1{2,}/.test(pw)) { res.messages.push('Wiederholungen erkannt (z.B. aaa). Vermeiden.'); }
  if(hasSequence(pw)) { res.messages.push('Sequenzen erkannt (z.B. abc, 123, qwe). Vermeiden.'); }

  const common = ['password','123456','qwerty','letmein','admin','welcome','iloveyou','monkey','dragon','pass','abc123'];
  if(common.includes(pw.toLowerCase())) { res.messages.push('Sehr unsicher: bekanntes Standardpasswort.'); }

  // Score by bits but apply penalties
  let score = 0;
  if(res.bits >= 60) score = 5;
  else if(res.bits >= 40) score = 4;
  else if(res.bits >= 28) score = 3;
  else if(res.bits >= 18) score = 2;
  else score = 1;
  if(/(.)\1{2,}/.test(pw) || hasSequence(pw) || common.includes(pw.toLowerCase())) score = Math.max(1, score-1);

  res.score = score;
  const labels = {1:'Sehr schwach',2:'Schwach',3:'Mittel',4:'Gut',5:'Sehr gut'};
  res.verdict = labels[score] || 'Unsicher';
  return res;
}

function updateCheckerUI(pw){
  const r = assessPassword(pw);
  checkerText.textContent = `${r.verdict} — ${r.bits} bit Entropie (geschätzt)`;
  const pct = Math.min(100, Math.round((r.bits / 64) * 100));
  checkerFill.style.width = pct + '%';
  // color classes
  checkerFill.style.background = r.score >=4 ? 'linear-gradient(90deg,#8ef29a,#4fd1c5)' : (r.score===3 ? 'linear-gradient(90deg,#ffd36a,#ff9a3c)' : 'linear-gradient(90deg,#ff7a7a,#ff3c3c)');
  checkerList.innerHTML = '';
  r.messages.forEach(m=>{
    const li = document.createElement('li'); li.textContent = m;
    if(m.startsWith('Zu kurz') || m.includes('unsicher') || m.includes('Wiederholungen') || m.includes('Sequenzen')) li.className='check-bad';
    else if(m.includes('ok') || m.includes('Zeichentypen')) li.className='check-warn';
    else li.className='check-good';
    checkerList.appendChild(li);
  });
}

checkBtn.addEventListener('click', ()=> updateCheckerUI(checkInput.value));
checkInput.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') updateCheckerUI(checkInput.value); });

// --- 2FA Code (rotating every 5 seconds) ---
const twofaCodeEl = el('twofaCode');
const twofaFill = el('twofaFill');
const twofaTimer = el('twofaTimer');
const twofaCopy = el('twofaCopy');

const TWOFA_PERIOD = 5; // seconds
const TWOFA_LENGTH = 5; // characters
const TWOFA_CHARS = '0123456789'; // numeric codes like authenticator apps

function gen2fa(){
  let s = '';
  for(let i=0;i<TWOFA_LENGTH;i++) s += TWOFA_CHARS[Math.floor(Math.random()*TWOFA_CHARS.length)];
  return s;
}

let twofaNext = Date.now();
function start2fa(){
  twofaNext = Date.now() + TWOFA_PERIOD*1000;
  twofaCodeEl.textContent = gen2fa();
  twofaFill.style.width = '100%';
}

// Update loop — updates progress and rotates when needed (counts DOWN)
setInterval(()=>{
  if(!twofaCodeEl) return;
  const now = Date.now();
  if(now >= twofaNext){
    twofaCodeEl.textContent = gen2fa();
    twofaNext = now + TWOFA_PERIOD*1000;
  }
  const remaining = Math.max(0, twofaNext - now);
  const pct = Math.round((remaining / (TWOFA_PERIOD*1000)) * 100); // fill represents time left
  twofaFill.style.width = pct + '%';
  twofaTimer.textContent = `wechsel in ${Math.ceil(remaining/1000)}s`;
}, 100);

twofaCopy.addEventListener('click', async ()=>{
  try{
    await navigator.clipboard.writeText(twofaCodeEl.textContent);
    twofaCopy.textContent = 'Kopiert ✓';
    setTimeout(()=>twofaCopy.textContent='Kopieren',1000);
  }catch(e){
    alert('Kopieren fehlgeschlagen.');
  }
});

// Initialize 2FA on load
window.addEventListener('load', ()=> start2fa());
