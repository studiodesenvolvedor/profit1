import {firebaseConfig, REGISTRATIONS_PATH} from './firebase-config.js';

const $ = id => document.getElementById(id);
let auth, db, sdk, stopAdmin, stopRecords, generation = 0;
let records = [], filtered = [], page = 0, permitted = false, busy = false;
const pageSize = 20;
const message = (text, error = false) => {
 $('auth-message').textContent = text;
 $('auth-message').classList.toggle('auth-error', error);
};
function lockPanel() {
 permitted = false;
 stopRecords?.(); stopRecords = undefined;
 records = []; filtered = []; page = 0;
 $('records-body').replaceChildren(); $('record-count').textContent = '0';
 $('search').value = ''; $('plan-filter').value = '';
 $('dashboard').hidden = true; $('login-view').hidden = false;
 $('account-email').textContent = '';
 $('previous').disabled = true; $('next').disabled = true;
 $('page-summary').textContent = '';
}
function authError(error) {
 const errors = {
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/invalid-login-credentials': 'E-mail ou senha incorretos.',
  'auth/user-not-found': 'E-mail ou senha incorretos.',
  'auth/wrong-password': 'E-mail ou senha incorretos.',
  'auth/invalid-email': 'Informe um e-mail válido.',
  'auth/user-disabled': 'Este acesso foi desativado. Fale com o responsável pela academia.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.',
  'auth/network-request-failed': 'Falha de conexão. Verifique sua internet e tente novamente.',
  'auth/operation-not-allowed': 'O acesso por e-mail e senha precisa ser ativado no Firebase.',
  'auth/unauthorized-domain': 'O domínio do site precisa ser autorizado no Firebase Authentication.',
  'auth/web-storage-unsupported': 'Permita o armazenamento do navegador para entrar.'
 };
 return errors[error?.code] || 'Não foi possível acessar agora. Confira a configuração do Firebase e tente novamente.';
}
function setBusy(value) {
 busy = value;
 $('login-submit').disabled = value;
 $('reset-password').disabled = value;
 $('login-submit').textContent = value ? 'Entrando…' : 'Entrar no painel';
}
function normalize(value) {
 return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
function filterRecords(reset = true) {
 if (reset) page = 0;
 const term = normalize($('search').value.trim());
 const plan = $('plan-filter').value;
 filtered = records.filter(r => (!plan || r.plan === plan) && normalize([r.fullName,r.email,r.phone].join(' ')).includes(term));
 page = Math.min(page, Math.max(0, Math.ceil(filtered.length / pageSize) - 1));
 render();
}
function cell(label, value, className) {
 const td = document.createElement('td'); td.dataset.label = label;
 td.textContent = value; if (className) td.className = className;
 return td;
}
function render() {
 if (!permitted) return;
 const body = $('records-body'); body.replaceChildren();
 $('record-count').textContent = records.length.toLocaleString('pt-BR');
 for (const record of filtered.slice(page * pageSize, (page + 1) * pageSize)) {
  const row = document.createElement('tr');
  row.append(cell('Nome', record.fullName, 'client-name'));
  const contact = cell('Contato', '');
  const digits = String(record.phone || '').replace(/\D/g, '');
  if (/^(?:55)?[1-9][0-9]{9,10}$/.test(digits)) {
   const whatsapp = document.createElement('a');
   const number = digits.length <= 11 ? '55' + digits : digits;
   whatsapp.href = 'https://wa.me/' + number; whatsapp.target = '_blank'; whatsapp.rel = 'noopener noreferrer';
   whatsapp.textContent = record.phone + ' ↗'; whatsapp.setAttribute('aria-label', 'Abrir WhatsApp de ' + record.fullName);
   contact.append(whatsapp, document.createElement('br'));
  } else { contact.append(document.createTextNode(String(record.phone || '—')), document.createElement('br')); }
  const email = String(record.email || '');
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
   const link = document.createElement('a'); link.href = 'mailto:' + encodeURIComponent(email); link.textContent = email; contact.append(link);
  } else { contact.append(document.createTextNode(email || '—')); }
  row.append(contact);
  const plan = cell('Plano', ''); const badge = document.createElement('span'); badge.className = 'plan-badge'; badge.textContent = record.plan || '—'; plan.append(badge); row.append(plan);
  const date = typeof record.createdAt === 'number' && Number.isFinite(record.createdAt) ? new Date(record.createdAt) : null;
  row.append(cell('Recebido em', date && !Number.isNaN(date.getTime()) ? date.toLocaleString('pt-BR', {timeZone:'America/Fortaleza', dateStyle:'short', timeStyle:'short'}) : 'Não informado', 'date'));
  body.append(row);
 }
 $('records-message').hidden = filtered.length > 0;
 $('records-message').classList.remove('error');
 $('records-message').textContent = records.length ? 'Nenhum cadastro encontrado com esses filtros.' : 'Nenhuma pré-inscrição recebida ainda.';
 $('page-summary').textContent = filtered.length ? `${page * pageSize + 1}–${Math.min((page+1)*pageSize,filtered.length)} de ${filtered.length}` : '0 cadastros';
 $('previous').disabled = page === 0;
 $('next').disabled = (page + 1) * pageSize >= filtered.length;
}
$('search').addEventListener('input', () => filterRecords());
$('plan-filter').addEventListener('change', () => filterRecords());
$('clear-filters').addEventListener('click', () => { $('search').value = ''; $('plan-filter').value = ''; filterRecords(); });
$('previous').addEventListener('click', () => { page--; render(); });
$('next').addEventListener('click', () => { page++; render(); });
$('toggle-password').addEventListener('click', () => {
 const show = $('login-password').type === 'password';
 $('login-password').type = show ? 'text' : 'password';
 $('toggle-password').textContent = show ? 'Ocultar' : 'Mostrar';
 $('toggle-password').setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha');
 $('toggle-password').setAttribute('aria-pressed', String(show));
});
$('login-form').addEventListener('submit', async event => {
 event.preventDefault(); if (!auth || busy) return;
 setBusy(true); message('Verificando seu acesso…');
 try { await sdk.signInWithEmailAndPassword(auth, $('login-email').value.trim(), $('login-password').value); }
 catch (error) { message(authError(error), true); }
 finally { $('login-password').value = ''; setBusy(false); }
});
$('reset-password').addEventListener('click', async () => {
 const email = $('login-email');
 if (!email.reportValidity() || !auth || busy) return;
 setBusy(true);
 try {
  await sdk.sendPasswordResetEmail(auth, email.value.trim());
  message('Se este e-mail possuir uma conta, você receberá as instruções de recuperação. Confira também o spam.');
 } catch (error) { message(authError(error), true); }
 finally { setBusy(false); }
});
$('logout').addEventListener('click', async () => {
 generation++; stopAdmin?.(); stopAdmin = undefined; lockPanel();
 try { await sdk.signOut(auth); message('Você saiu do painel.'); }
 catch { message('Não foi possível encerrar a sessão. Recarregue a página e tente sair novamente.', true); }
});
async function initialize() {
 try {
  const [appSdk, authSdk, dbSdk] = await Promise.all([
   import('https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js'),
   import('https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js'),
   import('https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js')
  ]);
  sdk = {...authSdk,...dbSdk};
  const app = appSdk.initializeApp(firebaseConfig); auth = sdk.getAuth(app); db = sdk.getDatabase(app); auth.languageCode = 'pt-BR';
  await sdk.setPersistence(auth, sdk.browserSessionPersistence);
  sdk.onAuthStateChanged(auth, user => {
   const current = ++generation; stopAdmin?.(); stopAdmin = undefined; lockPanel();
   if (!user) { message('Entre com o e-mail cadastrado pela academia.'); return; }
   message('Conferindo autorização…');
   stopAdmin = sdk.onValue(sdk.ref(db, 'profitup/admins/' + user.uid), snapshot => {
    if (current !== generation) return;
    if (snapshot.val() !== true) {
     lockPanel(); message('Sua conta não está autorizada como administradora. Solicite a liberação ao responsável pela academia.', true); return;
    }
    if (permitted) return;
    permitted = true; $('login-view').hidden = true; $('dashboard').hidden = false;
    $('account-email').textContent = user.email || '';
    $('records-message').hidden = false; $('records-message').textContent = 'Carregando pré-inscrições…';
    const recent = sdk.query(sdk.ref(db, REGISTRATIONS_PATH), sdk.orderByChild('createdAt'), sdk.limitToLast(500));
    stopRecords = sdk.onValue(recent, data => {
     if (current !== generation || !permitted) return;
     const rows = []; data.forEach(item => { const value = item.val(); if (value && typeof value === 'object') rows.push(value); });
     records = rows.sort((a,b) => (Number(b.createdAt)||0) - (Number(a.createdAt)||0)); filterRecords(false);
    }, () => {
     if (current !== generation) return;
     lockPanel(); message('Não foi possível consultar os cadastros. Confira sua conexão e as regras de acesso do banco.', true);
    });
   }, () => {
    if (current !== generation) return;
    lockPanel(); message('Não foi possível verificar sua autorização. Confira a conexão e as regras do Firebase.', true);
   });
  }, () => { lockPanel(); message('Não foi possível verificar sua sessão. Recarregue a página.', true); });
  setBusy(false);
 } catch { lockPanel(); message('Não foi possível conectar ao Firebase. Verifique sua conexão e recarregue a página.', true); $('login-submit').textContent = 'Conexão indisponível'; }
}
initialize();
