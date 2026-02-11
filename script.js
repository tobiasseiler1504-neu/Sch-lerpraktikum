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
const accentPicker = el('accentPicker');
const bgStart = el('bgStart');
const bgEnd = el('bgEnd');
const cardPicker = el('cardPicker');
const textPicker = el('textPicker');
const glassPicker = el('glassPicker');
const mutedPicker = el('mutedPicker');
const fontSelect = el('fontSelect');

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

function applyColors(){
  const a = accentPicker ? accentPicker.value : getComputedStyle(document.documentElement).getPropertyValue('--accent');
  const s = bgStart ? bgStart.value : getComputedStyle(document.documentElement).getPropertyValue('--bg-start');
  const e = bgEnd ? bgEnd.value : getComputedStyle(document.documentElement).getPropertyValue('--bg-end');
  const c = cardPicker ? cardPicker.value : null;
  const t = textPicker ? textPicker.value : null;
  const g = glassPicker ? glassPicker.value : null;
  const m = mutedPicker ? mutedPicker.value : null;
  if(a) document.documentElement.style.setProperty('--accent', a);
  if(s) document.documentElement.style.setProperty('--bg-start', s);
  if(e) document.documentElement.style.setProperty('--bg-end', e);
  if(s && e) document.documentElement.style.setProperty('--bg', `linear-gradient(135deg, ${s}, ${e})`);
  if(c) document.documentElement.style.setProperty('--card', c);
  if(t) document.documentElement.style.setProperty('--text', t);
  if(g) document.documentElement.style.setProperty('--glass', g);
  if(m) document.documentElement.style.setProperty('--muted', m);
  if(fontSelect && fontSelect.value) document.documentElement.style.setProperty('--font-family', fontSelect.value);
}

const colorInputs = [accentPicker,bgStart,bgEnd,cardPicker,textPicker,glassPicker,mutedPicker].filter(Boolean);
colorInputs.forEach(inp=> inp.addEventListener('input', applyColors));
if(fontSelect) fontSelect.addEventListener('change', applyColors);

// Apply initial custom colors on load
window.addEventListener('load', ()=>{
  applyColors();
  try{ generateBtn.click(); }catch(e){}
  try{ start2fa(); }catch(e){}
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

// --- Website Security Checker ---
const urlInput = el('urlInput');
const checkUrlBtn = el('checkUrlBtn');
const urlResult = el('urlResult');
const scoreValue = el('scoreValue');
const scoreLabel = el('scoreLabel');
const urlChecks = el('urlChecks');
const malwareWarning = el('malwareWarning');

// Sicherheits-Check Funktionen
function validateURL(urlStr){
  try{
    const url = new URL(urlStr);
    return {valid:true,url:url};
  }catch(e){
    return {valid:false,error:e.message};
  }
}

async function checkSecurityHeaders(urlStr){
  const headers = {};
  const checks = [];
  try{
    const response = await fetch(urlStr, {method:'HEAD',mode:'no-cors'});
    // no-cors mode doesn't allow us to read headers, so we try standard fetch
    const resp2 = await fetch(urlStr, {mode:'cors'}).catch(()=>null);
    if(resp2){
      const headerList = ['content-security-policy','x-frame-options','x-content-type-options','strict-transport-security','x-xss-protection','referrer-policy'];
      let foundCount = 0;
      headerList.forEach(h=>{
        if(resp2.headers.has(h)) { headers[h] = resp2.headers.get(h); foundCount++; }
      });
      checks.push({name:'Sicherheits-Header',found:foundCount,total:headerList.length});
    }
  }catch(e){
    // Falls CORS nicht erlaubt ist, geben wir Warnung aus
    checks.push({name:'Sicherheits-Header',found:0,total:6,note:'Prüfung durch CORS blockiert'});
  }
  return checks;
}

async function checkMalwareDatabase(domain){
  try{
    // URLhaus free API - Abuse.ch Missbrauchs-Datenbank
    const response = await fetch(`https://urlhaus-api.abuse.ch/v1/urls/recent/`, {
      method:'POST',
      headers:{'Content-Type': 'application/json'},
      body: JSON.stringify({})
    }).catch(()=>null);
    
    if(response && response.ok){
      const data = await response.json();
      // Prüfe ob unsere Domain in der Liste verdächtiger Domains ist
      const results = data.urls || [];
      const found = results.filter(item=>item.host && item.host.includes(domain));
      if(found.length > 0){
        return {malicious:true,count:found.length,details:found[0]};
      }
    }
    return {malicious:false};
  }catch(e){
    // Stille Fehlerbehandlung, da API-Abfrage fehlschlag
    return {malicious:false,error:true};
  }
}

function checkDomainSuspicion(url){
  const issues = [];
  const domain = url.hostname.toLowerCase();
  
  // Verdächtige TLDs
  const suspiciousTlds = ['.tk','.ml','.ga','.cf','.buzz','.xn--','.xyz','.top','.date','.download','.science'];
  for(const tld of suspiciousTlds){
    if(domain.endsWith(tld)) issues.push(`Verdächtige TLD: ${tld}`);
  }
  
  // IP-Adressen statt Domain
  if(/^[0-9.]+$/.test(domain)) issues.push('Domain ist eine IP-Adresse (verdächtig)');
  
  // Sehr lange Domain
  if(domain.length > 50) issues.push('Domain ist ungewöhnlich lang');
  
  // Punycode (internationalisierte Domains) - können für Typosquatting missbraucht werden
  if(domain.includes('xn--')) issues.push('Punycode-Domain erkannt (möglicherweise Typosquatting)');
  
  // Häufige Typosquatting-Ziele
  const commonTargets = ['paypal','amazon','apple','microsoft','google','facebook','instagram','twitter','netflix','bank'];
  const hasSuspiciousName = commonTargets.some(target=>domain.includes(target) && domain !== target);
  if(hasSuspiciousName) issues.push('Domain könnte Typosquatting-Versuch sein');
  
  return issues;
}

async function performSecurityCheck(){
  if(!urlInput.value.trim()){
    alert('Bitte eine URL eingeben.');
    return;
  }
  
  checkUrlBtn.disabled = true;
  checkUrlBtn.textContent = 'Prüfe...';
  urlChecks.innerHTML = '<div style="color:var(--muted);">Prüfung wird durchgeführt...</div>';
  urlResult.style.display = 'block';
  
  const urlValidation = validateURL(urlInput.value.trim());
  if(!urlValidation.valid){
    urlChecks.innerHTML = `<div class="check-item bad"><span class="check-icon">✗</span> Ungültige URL: ${urlValidation.error}</div>`;
    scoreValue.textContent = '0';
    scoreLabel.textContent = 'Ungültig';
    checkUrlBtn.disabled = false;
    checkUrlBtn.textContent = 'Prüfen';
    return;
  }
  
  const url = urlValidation.url;
  const checks = [];
  const domain = url.hostname;
  
  // 1. HTTPS Check
  const isHttps = url.protocol === 'https:';
  checks.push({
    name:'HTTPS verschlüsselt',
    status:isHttps ? 'good' : 'bad',
    message:isHttps ? 'HTTPS aktiv ✓' : 'HTTP unsicher ✗'
  });
  
  // 2. Domain-Suspicion-Checks
  const suspicions = checkDomainSuspicion(url);
  if(suspicions.length === 0){
    checks.push({
      name:'Domain-Reputation',
      status:'good',
      message:'Domain sieht legitim aus ✓'
    });
  }else{
    suspicions.forEach(issue=>{
      checks.push({
        name:'Domain-Warnung',
        status:'bad',
        message:issue + ' ✗'
      });
    });
  }
  
  // 3. Sicherheits-Header prüfen
  const headerChecks = await checkSecurityHeaders(url.toString());
  headerChecks.forEach(hc=>{
    const pct = hc.total > 0 ? Math.round((hc.found/hc.total)*100) : 0;
    const status = pct >= 60 ? 'good' : (pct >= 30 ? 'warning' : 'bad');
    checks.push({
      name:'Sicherheits-Header',
      status:status,
      message:`${hc.found}/${hc.total} Header gefunden (${pct}%) ${hc.note ? '- ' + hc.note : ''}`
    });
  });
  
  // 4. Malware-Datenbank prüfen
  const malwareCheck = await checkMalwareDatabase(domain);
  if(!malwareCheck.error){
    if(malwareCheck.malicious){
      checks.push({
        name:'Missbrauchs-Datenbank',
        status:'bad',
        message:'Domain in Missbrauchs-Liste gefunden ✗'
      });
      malwareWarning.textContent = `WARNUNG: Diese Domain wurde in Missbrauchs-Datenbanken gefunden. ${malwareCheck.count} verdächtige URLs entdeckt.`;
      malwareWarning.style.display = 'flex';
    }else{
      checks.push({
        name:'Missbrauchs-Datenbank',
        status:'good',
        message:'Nicht in bekannten Missbrauchs-Listen ✓'
      });
      malwareWarning.style.display = 'none';
    }
  }
  
  // Score berechnen
  const goodCount = checks.filter(c=>c.status==='good').length;
  const badCount = checks.filter(c=>c.status==='bad').length;
  const totalScore = Math.max(0, Math.round(((goodCount - badCount*2) / checks.length) * 100));
  
  scoreValue.textContent = totalScore;
  
  // Label basierend auf Score
  let label = '⚠️ Unsicher';
  if(totalScore >= 80) label = '🟢 Sehr sicher';
  else if(totalScore >= 60) label = '🟡 Sicher';
  else if(totalScore >= 40) label = '🟠 Warnung';
  else label = '🔴 Unsicher';
  
  scoreLabel.textContent = label;
  
  // Ergebnisse anzeigen
  urlChecks.innerHTML = '';
  checks.forEach(check=>{
    const div = document.createElement('div');
    div.className = `check-item ${check.status}`;
    const icon = check.status === 'good' ? '✓' : (check.status === 'warning' ? '◐' : '✗');
    div.innerHTML = `<span class="check-icon">${icon}</span><span><strong>${check.name}:</strong> ${check.message}</span>`;
    urlChecks.appendChild(div);
  });
  
  checkUrlBtn.disabled = false;
  checkUrlBtn.textContent = 'Prüfen';
}

checkUrlBtn.addEventListener('click', ()=> performSecurityCheck());
urlInput.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') performSecurityCheck(); });

// Initiale Prüfung beim Laden
window.addEventListener('load', ()=>{
  // Optional: automatische Prüfung der Beispiel-URL durchführen
});

