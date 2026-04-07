/**
 * GREEN-API Client
 * Implements: getSettings · getStateInstance · sendMessage · sendFileByUrl
 */

'use strict';

/* ── Constants ───────────────────────────────────────────── */
const BASE_URL = 'https://api.green-api.com';

/* ── DOM refs ────────────────────────────────────────────── */
const $ = id => document.getElementById(id);

const dom = {
  idInstance:    $('idInstance'),
  apiToken:      $('apiToken'),
  msgPhone:      $('msgPhone'),
  msgText:       $('msgText'),
  filePhone:     $('filePhone'),
  fileUrl:       $('fileUrl'),
  fileCaption:   $('fileCaption'),
  responseOutput: $('responseOutput'),
  responseBadge:  $('responseBadge'),
  responseStatus: $('responseStatus'),
  btnGetSettings:     $('btn-getSettings'),
  btnGetState:        $('btn-getStateInstance'),
  btnSendMessage:     $('btn-sendMessage'),
  btnSendFileByUrl:   $('btn-sendFileByUrl'),
  btnClear:           $('btn-clear'),
};

/* ── Credentials helper ──────────────────────────────────── */
function getCredentials() {
  const id    = dom.idInstance.value.trim();
  const token = dom.apiToken.value.trim();
  if (!id || !token) throw new Error('Please fill in idInstance and ApiTokenInstance.');
  return { id, token };
}

/* ── Response display ────────────────────────────────────── */
function showResponse(method, data, isError = false) {
  const json = JSON.stringify(data, null, 2);
  dom.responseOutput.value = json;

  dom.responseBadge.textContent = method;
  dom.responseBadge.classList.add('visible');

  dom.responseStatus.textContent = isError
    ? `✖  Error — ${data?.message ?? 'Unknown error'}`
    : `✔  ${method} — 200 OK`;
  dom.responseStatus.className = `response-status ${isError ? 'error' : 'ok'}`;
}

function showInfo(message) {
  dom.responseStatus.textContent = `ℹ  ${message}`;
  dom.responseStatus.className = 'response-status info';
}

/* ── Loading state ───────────────────────────────────────── */
function setLoading(btn, active) {
  btn.classList.toggle('loading', active);
  btn.disabled = active;
}

/* ── Fetch wrapper ───────────────────────────────────────── */
async function apiRequest(method, url, body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({ message: res.statusText }));

  if (!res.ok) {
    const err = new Error(data?.message ?? `HTTP ${res.status}`);
    err.data = data;
    throw err;
  }
  return data;
}

/* ── Phone normalizer ────────────────────────────────────── */
function normalizePhone(raw) {
  // Strip everything except digits, then append @c.us
  const digits = raw.replace(/\D/g, '');
  if (!digits) throw new Error('Phone number is required.');
  return `${digits}@c.us`;
}

/* ═══════════════════════════════════════════════════════════
   API Methods
   ═══════════════════════════════════════════════════════════ */

/**
 * GET /waInstance{id}/getSettings/{token}
 */
async function getSettings() {
  const { id, token } = getCredentials();
  const url = `${BASE_URL}/waInstance${id}/getSettings/${token}`;
  return apiRequest('GET', url);
}

/**
 * GET /waInstance{id}/getStateInstance/{token}
 */
async function getStateInstance() {
  const { id, token } = getCredentials();
  const url = `${BASE_URL}/waInstance${id}/getStateInstance/${token}`;
  return apiRequest('GET', url);
}

/**
 * POST /waInstance{id}/sendMessage/{token}
 */
async function sendMessage() {
  const { id, token } = getCredentials();

  const phone   = dom.msgPhone.value.trim();
  const message = dom.msgText.value.trim();
  if (!message) throw new Error('Message text is required.');

  const url  = `${BASE_URL}/waInstance${id}/sendMessage/${token}`;
  const body = { chatId: normalizePhone(phone), message };
  return apiRequest('POST', url, body);
}

/**
 * POST /waInstance{id}/sendFileByUrl/{token}
 */
async function sendFileByUrl() {
  const { id, token } = getCredentials();

  const phone   = dom.filePhone.value.trim();
  const fileUrl = dom.fileUrl.value.trim();
  if (!fileUrl) throw new Error('File URL is required.');

  // Derive a filename from the URL path
  const fileName = fileUrl.split('/').pop().split('?')[0] || 'file';

  const url  = `${BASE_URL}/waInstance${id}/sendFileByUrl/${token}`;
  const body = {
    chatId:   normalizePhone(phone),
    urlFile:  fileUrl,
    fileName,
    caption:  dom.fileCaption.value.trim(),
  };
  return apiRequest('POST', url, body);
}

/* ═══════════════════════════════════════════════════════════
   Event handlers
   ═══════════════════════════════════════════════════════════ */

async function handleMethod(btn, methodName, apiFn) {
  setLoading(btn, true);
  showInfo(`Calling ${methodName}…`);
  try {
    const data = await apiFn();
    showResponse(methodName, data);
  } catch (err) {
    showResponse(methodName, { message: err.message, ...(err.data ?? {}) }, true);
  } finally {
    setLoading(btn, false);
  }
}

dom.btnGetSettings.addEventListener('click', () =>
  handleMethod(dom.btnGetSettings, 'getSettings', getSettings));

dom.btnGetState.addEventListener('click', () =>
  handleMethod(dom.btnGetState, 'getStateInstance', getStateInstance));

dom.btnSendMessage.addEventListener('click', () =>
  handleMethod(dom.btnSendMessage, 'sendMessage', sendMessage));

dom.btnSendFileByUrl.addEventListener('click', () =>
  handleMethod(dom.btnSendFileByUrl, 'sendFileByUrl', sendFileByUrl));

dom.btnClear.addEventListener('click', () => {
  dom.responseOutput.value = '';
  dom.responseBadge.textContent = '';
  dom.responseBadge.classList.remove('visible');
  dom.responseStatus.textContent = '';
  dom.responseStatus.className = 'response-status';
});
