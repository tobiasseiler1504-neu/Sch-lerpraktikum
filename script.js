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
  if(pw) passwordOut.value = pw;
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
  document.documentElement.classList.remove('theme-classic','theme-neon');
  const v = styleSelect.value;
  if(v==='classic') document.documentElement.classList.add('theme-classic');
  if(v==='neon') document.documentElement.classList.add('theme-neon');
});

// Generate an initial password on load
window.addEventListener('load', ()=> generateBtn.click());
