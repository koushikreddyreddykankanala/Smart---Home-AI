/* =============================================
   SMART HOME ASSISTANT — script.js  v3.0
   Natural language, scenes, automation,
   insights, cross-platform voice support.
   ============================================= */

// ── Config ────────────────────────────────────
const BACKEND_URL = (window.SMARTHOME_BACKEND || "").replace(/\/$/, "");

// ── State ─────────────────────────────────────
let devices = { light: false, fan: false, ac: false, tv: false };
let temperature = 24;
let isListening = false;
let recognitionTimeout = null;
let automationInterval = null;
const HISTORY_KEY = "smarthome-history-v3";

// ── Speech Recognition ────────────────────────
const SpeechRecognitionAPI =
    window.SpeechRecognition || window.webkitSpeechRecognition || null;

function buildRecognition() {
    if (!SpeechRecognitionAPI) return null;
    const r = new SpeechRecognitionAPI();
    r.continuous = false;
    r.lang = "en-US";
    r.interimResults = false;

    r.onresult = (e) => {
        clearTimeout(recognitionTimeout);
        const cmd = e.results[0][0].transcript.toLowerCase().trim();
        addChatMessage(cmd, "user");
        addLocalHistory(`🎤 "${cmd}"`);
        handleCommand(cmd);
    };

    r.onerror = (e) => {
        const msgs = {
            "no-speech": "No speech detected. Try again.",
            "not-allowed": "Mic access denied. Allow it in browser settings.",
            "audio-capture": "No microphone found.",
        };
        addChatMessage(msgs[e.error] || "Voice error. Try again.", "bot");
        stopListening();
    };

    r.onend = () => stopListening();
    return r;
}

// ── Boot ──────────────────────────────────────
window.addEventListener("DOMContentLoaded", async () => {
    // Show loading animation
    const loader = document.getElementById('dashboardLoader');
    
    // Initialize everything
    loadUserPrefs();
    await fetchDeviceStatus();
    getLocationAndFetchWeather();
    renderLocalHistory();
    startAutomationLoop();
    updateInsightsPanel();
    initThemeToggle();
    initRippleEffects();
    initDeviceCardAnimations();
    
    // Hide loader after everything is loaded
    setTimeout(() => {
        if (loader) {
            loader.classList.add('hidden');
            setTimeout(() => {
                loader.style.display = 'none';
            }, 600);
        }
    }, 1500); // Show loader for at least 1.5 seconds
});

// ── Ripple effect for interactive elements ────
function initRippleEffects() {
    const buttons = document.querySelectorAll('.scene-btn, .temp-btn, .hint-chip');
    buttons.forEach(btn => {
        btn.classList.add('ripple');
    });
}

// ── Device card click animations ───────────────
function initDeviceCardAnimations() {
    const deviceCards = document.querySelectorAll('.device-card');
    deviceCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Add a temporary scale animation
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
}

// ── Theme ─────────────────────────────────────
function initThemeToggle() {
    const saved = localStorage.getItem("smarthome-theme") || "dark";
    applyTheme(saved);
    document.getElementById("themeToggle").addEventListener("click", () => {
        const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
        applyTheme(next);
        localStorage.setItem("smarthome-theme", next);
    });
}

function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const themeIcon = document.getElementById("themeIcon");
    themeIcon.setAttribute("data-lucide", theme === "dark" ? "moon" : "sun");
    lucide.createIcons();
}

// ── User prefs ────────────────────────────────
function loadUserPrefs() {
    const name = localStorage.getItem("smarthome-username");
    if (name) {
        document.getElementById("greeting").textContent = `Hello, ${name} 👋`;
        document.getElementById("userName").value = name;
    }
}

function saveName() {
    const name = document.getElementById("userName").value.trim();
    if (!name) return;
    localStorage.setItem("smarthome-username", name);
    document.getElementById("greeting").textContent = `Hello, ${name} 👋`;
    respond(`Hello, ${name}! Welcome to your smart home.`);
}

// ── API helper ────────────────────────────────
async function apiFetch(path, options = {}, timeoutMs = 7000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(`${BACKEND_URL}${path}`, { ...options, signal: ctrl.signal });
        clearTimeout(timer);
        if (!res.ok) {
            const b = await res.json().catch(() => ({}));
            throw new Error(b.error || `HTTP ${res.status}`);
        }
        return await res.json();
    } catch (e) {
        clearTimeout(timer);
        if (e.name === "AbortError") throw new Error("Request timed out");
        throw e;
    }
}

// ── Devices ───────────────────────────────────
async function fetchDeviceStatus() {
    try {
        const r = await apiFetch("/devices");
        const data = r.data || r;
        Object.entries(data).forEach(([k, v]) => {
            if (k === "temperature") { temperature = v; syncTempUI(v); }
            else if (k in devices) { devices[k] = v; updateDeviceUI(k, v); }
        });
    } catch {
        addChatMessage("⚠️ Backend offline — demo mode active.", "bot");
    }
}

function updateDeviceUI(device, isOn) {
    const card = document.getElementById(`card-${device}`);
    const toggle = document.getElementById(`toggle-${device}`);
    const status = document.getElementById(`status-${device}`);
    if (!card) return;
    
    // Add transition class
    card.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    
    // Toggle active state with animation
    if (isOn) {
        card.classList.add('active');
        // Add a brief scale animation
        card.style.transform = 'scale(1.05)';
        setTimeout(() => {
            card.style.transform = '';
        }, 300);
    } else {
        card.classList.remove('active');
    }
    
    if (status) status.textContent = isOn ? "ON" : "OFF";
    if (toggle) toggle.checked = isOn;
}

function syncTempUI(val) {
    const d = document.getElementById("tempDisplay");
    const s = document.getElementById("tempSlider");
    if (d) {
        d.textContent = `${val}°C`;
        // Add a brief pulse animation
        d.style.transform = 'scale(1.1)';
        setTimeout(() => {
            d.style.transform = 'scale(1)';
        }, 200);
    }
    if (s) s.value = val;
}

async function controlDevice(device, state, temp = null) {
    const body = { device, state };
    if (temp !== null) body.temperature = temp;
    try {
        const r = await apiFetch("/control", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        // Sync full state from server response
        const data = (r.data || r);
        if (data && typeof data === "object" && !data.error) {
            Object.entries(data).forEach(([k, v]) => {
                if (k === "temperature") { temperature = v; syncTempUI(v); }
                else if (k in devices) { devices[k] = v; }
            });
        }
    } catch (e) {
        console.warn("Control failed (offline):", e.message);
    }
}

function manualControl(device, isOn) {
    devices[device] = isOn;
    updateDeviceUI(device, isOn);
    controlDevice(device, isOn ? "on" : "off");
    const msg = `${cap(device)} turned ${isOn ? "ON" : "OFF"}.`;
    respond(msg);
    addLocalHistory(`🔘 ${msg}`);
}

function setTemperature(val) {
    temperature = parseInt(val, 10);
    syncTempUI(temperature);
    controlDevice("ac", devices.ac ? "on" : "off", temperature);
}

function adjustTemperature(delta) {
    const newTemp = Math.max(16, Math.min(30, temperature + delta));
    temperature = newTemp;
    syncTempUI(temperature);
    controlDevice("ac", devices.ac ? "on" : "off", temperature);
    const msg = `Temperature ${delta > 0 ? 'increased' : 'decreased'} to ${temperature}°C`;
    addChatMessage(msg, "bot");
    addLocalHistory(`🌡️ ${msg}`);
}

// ── Voice ─────────────────────────────────────
function startListening() {
    if (!SpeechRecognitionAPI) {
        addChatMessage("Voice recognition requires Chrome or Edge.", "bot");
        return;
    }
    if (isListening) return;

    const rec = buildRecognition();
    if (!rec) return;

    isListening = true;
    document.getElementById("micBtn").classList.add("listening");
    document.getElementById("micLabel").textContent = "Listening…";

    try {
        rec.start();
    } catch { stopListening(); return; }

    recognitionTimeout = setTimeout(() => {
        if (isListening) {
            rec.abort();
            addChatMessage("Listening timed out. Tap the mic to try again.", "bot");
            stopListening();
        }
    }, 10_000);
}

function stopListening() {
    isListening = false;
    clearTimeout(recognitionTimeout);
    const btn = document.getElementById("micBtn");
    if (btn) btn.classList.remove("listening");
    const lbl = document.getElementById("micLabel");
    if (lbl) lbl.textContent = "Tap to speak";
}

// ── NLP + Command handling ─────────────────────
/**
 * All text commands (voice or typed) go through this pipeline:
 * 1. Send to /nlp backend (rule-based NLU)
 * 2. Dispatch structured intent
 */
async function handleCommand(raw) {
    raw = raw.trim().toLowerCase();
    if (!raw) return;

    try {
        const r = await apiFetch("/nlp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: raw }),
        });
        const intent = r.data || r;
        await dispatchIntent(intent, raw);
    } catch {
        // Fallback: client-side simple parse if backend is offline
        clientFallback(raw);
    }
}

async function dispatchIntent(intent, raw) {
    switch (intent.intent) {

        case "control": {
            const { device, state } = intent;
            devices[device] = (state === "on");
            updateDeviceUI(device, devices[device]);
            await controlDevice(device, state);
            respond(`${cap(device)} turned ${state.toUpperCase()}.`);
            break;
        }

        case "scene": {
            const scene = intent.scene;
            try {
                const r = await apiFetch(`/scenes/${scene}`, { method: "POST" });
                const data = (r.data || r).devices || {};
                Object.entries(data).forEach(([k, v]) => {
                    if (k === "temperature") { 
                        temperature = v; 
                        syncTempUI(v); 
                    }
                    else if (k in devices) { 
                        devices[k] = v; 
                        updateDeviceUI(k, v); 
                    }
                });
                respond(sceneMessage(scene));
            } catch { respond("Couldn't activate scene. Try again."); }
            break;
        }

        case "temperature": {
            if ("value" in intent) {
                const t = intent.value;
                if (t >= 16 && t <= 30) {
                    temperature = t;
                    syncTempUI(t);
                    await controlDevice("ac", devices.ac ? "on" : "off", t);
                    respond(`AC temperature set to ${t}°C.`);
                } else {
                    respond("Temperature must be between 16 and 30°C.");
                }
            } else if ("delta" in intent) {
                const t = Math.max(16, Math.min(30, temperature + intent.delta));
                temperature = t;
                syncTempUI(t);
                await controlDevice("ac", devices.ac ? "on" : "off", t);
                respond(`Temperature ${intent.delta > 0 ? "raised" : "lowered"} to ${t}°C.`);
            }
            break;
        }

        case "status": {
            const on = Object.keys(devices).filter(d => devices[d]);
            respond(on.length ? `Active: ${on.map(cap).join(", ")}.` : "All devices are off.");
            break;
        }

        case "weather":
            await getLocationAndFetchWeather(true);
            break;

        case "greeting": {
            const name = localStorage.getItem("smarthome-username") || "there";
            respond(`Hello, ${name}! How can I help?`);
            break;
        }

        case "reset":
            try {
                await apiFetch("/devices/reset", { method: "POST" });
                ["light", "fan", "ac", "tv"].forEach(d => { devices[d] = false; updateDeviceUI(d, false); });
                respond("All devices turned off.");
            } catch { respond("Reset failed. Try again."); }
            break;

        default:
            respond(`Sorry, I didn't understand that. Try: "Turn on the lights" or "Movie mode".`);
    }
}

function clientFallback(raw) {
    if (raw.includes("light")) { toggleDeviceLocal("light"); return; }
    if (raw.includes("fan")) { toggleDeviceLocal("fan"); return; }
    if (raw.includes("ac")) { toggleDeviceLocal("ac"); return; }
    if (raw.includes("tv")) { toggleDeviceLocal("tv"); return; }
    if (raw.includes("status")) {
        const on = Object.keys(devices).filter(d => devices[d]);
        respond(on.length ? `Active: ${on.map(cap).join(", ")}.` : "All off.");
        return;
    }
    respond("Backend offline. Basic controls still work via the dashboard.");
}

function toggleDeviceLocal(device) {
    const isOn = !devices[device];
    devices[device] = isOn;
    updateDeviceUI(device, isOn);
    respond(`${cap(device)} ${isOn ? "ON" : "OFF"} (offline).`);
}

// ── Scenes shortcut buttons ────────────────────
async function activateScene(name) {
    addLocalHistory(`🎬 Scene: ${cap(name)}`);
    await dispatchIntent({ intent: "scene", scene: name }, name);
}

function sceneMessage(scene) {
    const msgs = {
        movie: "Movie mode — TV and AC on, lights off.",
        sleep: "Sleep mode — AC on, everything else off.",
        party: "Party mode — lights, fan, and AC on!",
        work: "Work mode — focused environment with AC.",
        morning: "Good morning — lights on!",
    };
    return msgs[scene] || `${cap(scene)} mode activated.`;
}

// ── Text command input ─────────────────────────
function sendTextCommand() {
    const input = document.getElementById("textCmd");
    const cmd = input.value.trim();
    if (!cmd) return;
    input.value = "";
    addChatMessage(cmd, "user");
    addLocalHistory(`✏️ "${cmd}"`);
    handleCommand(cmd);
}

// ── Weather ───────────────────────────────────
async function getLocationAndFetchWeather(voiced = false) {
    if (!navigator.geolocation) return fetchWeatherFallback(voiced);

    navigator.geolocation.getCurrentPosition(
        async ({ coords: { latitude: lat, longitude: lon } }) => {
            try {
                const r = await apiFetch(`/weather?lat=${lat}&lon=${lon}`);
                renderWeather(r.data || r, voiced);
            } catch { fetchWeatherFallback(voiced); }
        },
        () => fetchWeatherFallback(voiced)
    );
}

async function fetchWeatherFallback(voiced = false) {
    try {
        const r = await apiFetch("/weather");
        renderWeather(r.data || r, voiced);
    } catch {
        const el = document.getElementById("weatherDesc");
        if (el) el.textContent = "Weather unavailable";
    }
}

function renderWeather(d, voiced = false) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set("weatherCity", d.city || "--");
    set("weatherTemp", `${d.temp ?? "--"}°C`);
    set("weatherDesc", d.description || "--");
    if (voiced) respond(`It's ${d.temp}°C in ${d.city} — ${d.description}.`);
}

// ── Automation loop ───────────────────────────
function startAutomationLoop() {
    // Evaluate automations every 60 s
    automationInterval = setInterval(runAutomations, 60_000);
}

async function runAutomations() {
    try {
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        const r = await apiFetch("/automations/evaluate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ temperature, time: timeStr }),
        });
        const { fired, devices: updated } = r.data || r;

        if (fired && fired.length > 0) {
            fired.forEach(f => {
                addChatMessage(`⚡ Auto: ${f.label}`, "bot");
                addLocalHistory(`⚡ Auto: ${f.label}`);
            });
            if (updated) {
                Object.entries(updated).forEach(([k, v]) => {
                    if (k in devices) { devices[k] = v; updateDeviceUI(k, v); }
                });
            }
        }
    } catch { /* silent — offline */ }
}

// ── Insights ──────────────────────────────────
async function updateInsightsPanel() {
    try {
        const r = await apiFetch("/insights");
        const { total, top_commands } = r.data || r;
        const el = document.getElementById("insightsPanel");
        if (!el) return;

        el.innerHTML = `<div class="insight-total">Total commands: <strong>${total}</strong></div>`;
        if (top_commands && top_commands.length > 0) {
            const list = document.createElement("ul");
            list.className = "insight-list";
            top_commands.forEach(({ command, count }) => {
                const li = document.createElement("li");
                li.innerHTML = `<span class="insight-cmd">${command}</span><span class="insight-badge">${count}×</span>`;
                list.appendChild(li);
            });
            el.appendChild(list);
        }
    } catch { /* insights are optional */ }
}

// ── Local history (client-side, instant) ──────
function addLocalHistory(entry) {
    const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    const now = new Date();
    stored.unshift({
        text: entry,
        time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
    });
    if (stored.length > 30) stored.pop();
    localStorage.setItem(HISTORY_KEY, JSON.stringify(stored));
    renderLocalHistory();
}

function renderLocalHistory() {
    const list = document.getElementById("historyList");
    if (!list) return;
    const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    const empty = list.querySelector(".history-empty");

    if (stored.length === 0) {
        list.innerHTML = '<li class="history-empty">No commands yet.</li>';
        return;
    }
    if (empty) empty.remove();

    // Diff-update: replace only if content changed
    const current = list.querySelectorAll("li:not(.history-empty)");
    if (current.length === stored.length) return;

    list.innerHTML = "";
    stored.forEach(({ text, time }) => {
        const li = document.createElement("li");
        li.innerHTML = `<span class="hist-time">${time}</span> ${text}`;
        list.appendChild(li);
    });
}

function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
    renderLocalHistory();
    apiFetch("/history", { method: "DELETE" }).catch(() => { });
}

// ── Respond helper ────────────────────────────
function respond(text) {
    addChatMessage(text, "bot");
    speak(text);
}

// ── Chat UI ───────────────────────────────────
function addChatMessage(text, sender) {
    const win = document.getElementById("chatWindow");
    if (!win) return;
    const div = document.createElement("div");
    div.className = `chat-msg ${sender}`;
    div.style.opacity = '0';
    div.style.transform = 'translateY(20px)';

    const icon = document.createElement("i");
    icon.setAttribute("data-lucide", sender === "bot" ? "bot" : "user");
    icon.className = "msg-icon";

    const span = document.createElement("span");
    span.textContent = text;

    div.appendChild(icon);
    div.appendChild(span);
    win.appendChild(div);
    
    // Initialize the new icon
    lucide.createIcons();
    
    // Trigger animation
    requestAnimationFrame(() => {
        div.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        div.style.opacity = '1';
        div.style.transform = 'translateY(0)';
    });
    
    win.scrollTop = win.scrollHeight;
}

// ── Speech synthesis (cross-platform) ─────────
let voicesLoaded = false;

function speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const fire = () => {
        const utt = new SpeechSynthesisUtterance(text);
        utt.lang = "en-US";
        utt.rate = 1.0;
        utt.pitch = 1.05;
        utt.volume = 1.0;

        // Pick a female English voice if available (better cross-platform default)
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v => v.lang.startsWith("en") && /female|zira|samantha|karen/i.test(v.name))
            || voices.find(v => v.lang.startsWith("en"));
        if (preferred) utt.voice = preferred;

        window.speechSynthesis.speak(utt);
    };

    if (!voicesLoaded && window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => { voicesLoaded = true; fire(); };
    } else {
        fire();
    }
}

// ── Helpers ───────────────────────────────────
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""; }
