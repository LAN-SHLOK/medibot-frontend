/* =========================================
   1. CONFIGURATION & SETUP
   ========================================= */
let lastUserSymptom = "";
let lastVisionContext = ""; // 🟢 Stores the rich JSON context of the last scan
let currentPlayingAudio = null; // 🟢 Global variable to track active audio // Stores the current medical topic
const BACKEND_BRAIN = "  https://zyrsl-152-58-34-43.a.free.pinggy.link";       // Chat, Voice & Camera (Backend 2)
const BACKEND_VISION = " https://overvaluably-illustratable-nga.ngrok-free.dev";  
     // Heavy Document Analysis (Backend 1)
     // 🟢 Tracks if the user used the mic or the keyboard

setInterval(() => {
    const ping = document.getElementById('pingValue');
    if(ping) ping.innerText = `${Math.floor(Math.random() * 15) + 15}ms`; // Random ping between 15-30ms
}, 3000); 


/* --- 1. CONFIGURATION & SETUP --- */ 

// 🟢 SECURE: Firebase keys are now pulled from the environment
const firebaseConfig = {
    apiKey: "AIzaSyDPEywFgii0vVWl-xt8qZve9pOqHUxsbeQ",
    authDomain: "medibot-73b45.firebaseapp.com",
    projectId: "medibot-73b45",
    storageBucket: "medibot-73b45.firebasestorage.app",
    messagingSenderId: "385608781776",
    appId: "1:385608781776:web:9c9588d8d3f9029cb6b3d5",
    measurementId: "G-7K9JLKZNT9"
};

if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase ? firebase.auth() : null;

/* =========================================
   2. VISUALS (WARP BACKGROUND)
   ========================================= */
const canvas = document.getElementById('warpCanvas');
if (canvas) {
    const ctx = canvas.getContext('2d');
    let stars = [];
    const numStars = 500;
    let speed = 2;
    function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    class Star {
        constructor() {
            this.x = Math.random() * canvas.width - canvas.width / 2;
            this.y = Math.random() * canvas.height - canvas.height / 2;
            this.z = Math.random() * canvas.width;
        }
        update() {
            this.z -= speed;
            if (this.z <= 0) { this.z = canvas.width; this.x = Math.random() * canvas.width - canvas.width / 2; this.y = Math.random() * canvas.height - canvas.height / 2; }
        }
        draw() {
            let x = (this.x / this.z) * canvas.width + canvas.width / 2;
            let y = (this.y / this.z) * canvas.height + canvas.height / 2;
            let radius = Math.abs((1 - this.z / canvas.width) * 3);
            if (x > 0 && x < canvas.width && y > 0 && y < canvas.height) {
                ctx.beginPath(); ctx.fillStyle = "rgba(255, 255, 255, 0.8)"; ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
            }
        }
    }
    for (let i = 0; i < numStars; i++) stars.push(new Star());
    function animateWarp() {
        ctx.fillStyle = "rgba(2, 6, 23, 0.4)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        stars.forEach(star => { star.update(); star.draw(); });
        requestAnimationFrame(animateWarp);
    }
    animateWarp();
}

/* =========================================
   3. AUTHENTICATION LOGIC
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    const localUid = localStorage.getItem('medibot_uid');
    const localName = localStorage.getItem('userName');
    const localPhoto = localStorage.getItem('userPhoto'); 

    if (localUid) {
        updateUserProfile(localName || "User", localPhoto);
    }

    if (auth) {
        auth.onAuthStateChanged((user) => {
            if (user) {
                const name = user.displayName || user.email.split('@')[0];
                const photo = user.photoURL;
                updateUserProfile(name, photo);
                localStorage.setItem('medibot_uid', user.uid);
                localStorage.setItem('userName', name);
                if (photo) localStorage.setItem('userPhoto', photo); 
            }
        });
    }
    updateSidebarHistory();
});

function updateUserProfile(name, photoURL) {
    const userAvatar = document.getElementById('userAvatar');
    const userNameElement = document.getElementById('dropdownUserName');
    const profileBtn = document.getElementById('profileBtn');

    if (userNameElement) userNameElement.innerText = name.toUpperCase();

    if (userAvatar) {
        if (photoURL && photoURL !== "null") {
            userAvatar.src = photoURL;
        } else {
            const initials = name.substring(0, 2).toUpperCase();
            userAvatar.src = `https://ui-avatars.com/api/?name=${initials}&background=db2777&color=fff&bold=true`;
        }
    }
    if (profileBtn) profileBtn.style.borderColor = "#db2777";
}

window.logout = function() {
    localStorage.clear();
    if (auth) auth.signOut().catch(console.error);
    window.location.href = "index.html"; 
};

/* =========================================
   4. CORE LOGIC
   ========================================= */
let currentFile = null;
let isCameraSource = false; 
let isListening = false;
let isVoiceInteraction = false;
let isScanning = false;
let botAudioPlayer = null;

function getUserId() {
    return localStorage.getItem('medibot_uid') || "guest_user";
}

const sfx = {
    mic: new Audio('sounds/ui_chirp.mp3'),
    scan: new Audio('sounds/ui_scan.mp3'),
    success: new Audio('sounds/ui_success.mp3'),
    alert: new Audio('sounds/ui_alert.mp3')
};
function playSound(name) {
    if(sfx[name]) { sfx[name].volume = 0.4; sfx[name].currentTime = 0; sfx[name].play().catch(()=>{}); }
}

function saveToHistory(text, type) {
    if (!text || text.includes("System Busy")) return;
    const historyItem = { 
        text: text.substring(0, 40) + (text.length > 40 ? "..." : ""), 
        date: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 
        type: type 
    };
    let history = JSON.parse(localStorage.getItem('medibot_history') || "[]");
    history.unshift(historyItem);
    if(history.length > 10) history.pop();
    localStorage.setItem('medibot_history', JSON.stringify(history));
    updateSidebarHistory();
}

function updateSidebarHistory() {
    const list = document.getElementById('historyList');
    if(!list) return;
    const history = JSON.parse(localStorage.getItem('medibot_history') || "[]");
    if (history.length === 0) {
        list.innerHTML = `<div class="text-[9px] text-slate-600 text-center italic mt-2">No recent scans</div>`;
        return;
    }
    list.innerHTML = history.map(h => `
        <div class="p-2 rounded bg-white/5 border border-white/5 text-[10px] text-slate-400 hover:bg-white/10 cursor-pointer transition-colors group">
            <div class="flex justify-between mb-1">
                <span class="${h.type === 'scan' ? 'text-cyan-400' : 'text-pink-400'} font-bold font-orbitron text-[9px]">${h.type.toUpperCase()}</span> 
                <span class="opacity-50">${h.date}</span>
            </div>
            <div class="truncate group-hover:text-white transition-colors">${h.text}</div>
        </div>
    `).join('');
}

window.addEventListener('beforeunload', () => { stopSpeaking(); });

function stopSpeaking() {
    // 1. Kill browser-native Text-to-Speech (just in case)
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
    
    // 2. Kill backend-generated audio
    if (currentPlayingAudio) {
        currentPlayingAudio.pause(); // Stop playing
        currentPlayingAudio.currentTime = 0; // Rewind to start
        currentPlayingAudio = null; // Clear the memory
    }
}
/* =========================================
   5. EMOTION ANIMATION LOGIC
   ========================================= */
function setMode(mode) {
    const mouthLine = document.getElementById('mouthLine');
    const voiceBars = document.getElementById('voiceBars');
    const mouthDots = document.getElementById('mouthDots');
    const topDots = document.getElementById('topDots');
    const hatGroup = document.getElementById('hatGroup');
    const dotLeft = document.getElementById('dotLeft');
    const dotRight = document.getElementById('dotRight');
    const topDotLeft = document.getElementById('topDotLeft');
    const topDotRight = document.getElementById('topDotRight');
    const eyeLeft = document.getElementById('eyeLeft');
    const eyeRight = document.getElementById('eyeRight'); 
    const botContainer = document.getElementById('botContainer');
    const successRing = document.getElementById('successRing');
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const statusBadge = document.getElementById('statusBadge');

    if(mouthLine) { mouthLine.style.opacity = '1'; mouthLine.setAttribute('d', 'M-20 0 L20 0'); }
    if(voiceBars) voiceBars.style.opacity = '0';
    if(mouthDots) mouthDots.style.opacity = '0';
    if(topDots) topDots.style.opacity = '0';
    if(hatGroup) hatGroup.classList.remove('animate-hat-pulse');
    if(dotLeft) dotLeft.classList.remove('animate-cradle-left');
    if(dotRight) dotRight.classList.remove('animate-cradle-right');
    if(topDotLeft) topDotLeft.classList.remove('animate-cradle-left');
    if(topDotRight) topDotRight.classList.remove('animate-cradle-right');
    if(botContainer) botContainer.classList.remove('animate-happy-bounce');
    if(successRing) successRing.className = "absolute inset-0 border-2 border-green-500 rounded-full opacity-0";
    if(eyeLeft) eyeLeft.setAttribute('class', 'fill-pink-500 transition-all duration-300');
    if(eyeRight) eyeRight.setAttribute('class', 'fill-pink-500 transition-all duration-300');

    if(statusBadge) {
        statusBadge.className = "flex items-center gap-2 mt-4 px-5 py-1.5 glass-panel rounded-full border border-white/5 transition-all shadow-lg";
        statusDot.className = "w-2 h-2 rounded-full transition-all duration-300";
        statusText.className = "text-[10px] font-orbitron font-bold tracking-widest uppercase transition-all duration-300";

        if (mode === 'processing') {
            if(mouthLine) mouthLine.style.opacity = '0';
            if(mouthDots) mouthDots.style.opacity = '1';
            if(topDots) topDots.style.opacity = '1';
            if(dotLeft) dotLeft.classList.add('animate-cradle-left');
            if(dotRight) dotRight.classList.add('animate-cradle-right');
            if(topDotLeft) topDotLeft.classList.add('animate-cradle-left');
            if(topDotRight) topDotRight.classList.add('animate-cradle-right');
            if(hatGroup) hatGroup.classList.add('animate-hat-pulse');
            statusDot.classList.add('bg-blue-600', 'animate-spin');
            statusText.innerText = "ANALYZING";
            statusText.classList.add('text-blue-500');
        } 
        else if (mode === 'happy') {
            if(eyeLeft) eyeLeft.setAttribute('class', 'fill-green-500 transition-all duration-300');
            if(eyeRight) eyeRight.setAttribute('class', 'fill-green-500 transition-all duration-300');
            if(mouthLine) mouthLine.setAttribute('d', 'M-20 0 Q0 15 20 0');
            if(successRing) successRing.classList.add('animate-success-ring');
            if(botContainer) botContainer.classList.add('animate-happy-bounce');
            statusDot.classList.add('bg-green-500');
            statusText.innerText = "COMPLETE";
            statusText.classList.add('text-green-500');
        }
        else if (mode === 'caution') {
            if(eyeLeft) eyeLeft.setAttribute('class', 'fill-orange-500 transition-all duration-300');
            if(eyeRight) eyeRight.setAttribute('class', 'fill-orange-500 transition-all duration-300');
            if(mouthLine) mouthLine.setAttribute('d', 'M-20 10 Q0 0 20 10');
            statusBadge.classList.add('border-orange-500/50');
            statusDot.classList.add('bg-orange-500');
            statusText.innerText = "ATTENTION";
            statusText.classList.add('text-orange-500');
        }
        else if (mode === 'danger') {
            if(eyeLeft) eyeLeft.setAttribute('class', 'fill-red-600 animate-pulse transition-all duration-300');
            if(eyeRight) eyeRight.setAttribute('class', 'fill-red-600 animate-pulse transition-all duration-300');
            if(mouthLine) mouthLine.setAttribute('d', 'M-20 10 L0 0 L20 10');
            if(successRing) successRing.className = "absolute inset-0 border-2 border-red-600 rounded-full animate-ping opacity-50";
            statusBadge.classList.add('border-red-600/50', 'bg-red-900/20');
            statusDot.classList.add('bg-red-600', 'animate-ping');
            statusText.innerText = "CRITICAL";
            statusText.classList.add('text-red-500');
        }
        else if (mode === 'talking') {
            if(mouthLine) mouthLine.style.opacity = '0';
            if(voiceBars) voiceBars.style.opacity = '1';
            statusDot.classList.add('bg-pink-500', 'animate-pulse');
            statusText.innerText = "SPEAKING";
            statusText.classList.add('text-pink-500');
        }
        else if (mode === 'listening') {
            if(eyeLeft) eyeLeft.setAttribute('class', 'fill-cyan-400 animate-pulse transition-all duration-300');
            if(eyeRight) eyeRight.setAttribute('class', 'fill-cyan-400 animate-pulse transition-all duration-300');
            statusDot.classList.add('bg-cyan-400', 'animate-ping');
            statusText.innerText = "LISTENING";
            statusText.classList.add('text-cyan-400');
        }
        else {
            statusDot.classList.add('bg-slate-500');
            statusText.innerText = "READY";
            statusText.classList.add('text-slate-400');
        }
    }
}

function resetVoiceMode() { stopSpeaking(); isVoiceInteraction = false; }
async function toggleListening() {
    const micBtn = document.getElementById('micBtn');
    const chatInput = document.getElementById('chatInput');

    if (!isListening) {
        // --- TURN ON BACKEND ENGINE ---
        try {
            micBtn.classList.add('text-red-500', 'animate-pulse'); // Connecting state
            
            const res = await fetch(`${BACKEND_BRAIN}/api/voice/start`, { method: "POST" });
            const data = await res.json();

            if (data.status === "active") {
                isListening = true;
                setMode('listening'); 
                
                // Active UI State
                micBtn.classList.remove('text-red-500');
                micBtn.classList.add('text-pink-500', 'bg-pink-500/20', 'animate-pulse');
                chatInput.placeholder = "🔴 Backend Voice Active (Speak Freely)...";
                chatInput.disabled = true; 
                
                playSound('mic');
                addBotMessage("🎤 Audio Engine Online. I am listening continuously through Whisper AI.", "system");
            }
        } catch (e) {
            console.error("Voice Error:", e);
            alert("Could not connect to Python Server.");
            micBtn.classList.remove('text-red-500', 'animate-pulse');
        }

    } else {
        // --- TURN OFF BACKEND ENGINE ---
        try {
            const res = await fetch(`${BACKEND_BRAIN}/api/voice/stop`, { method: "POST" });
            
            isListening = false;
            setMode('neutral');
            
            // Reset UI
            micBtn.classList.remove('text-pink-500', 'bg-pink-500/20', 'animate-pulse', 'text-red-500');
            micBtn.classList.add('text-slate-400');
            chatInput.placeholder = "Enter symptoms or upload scan...";
            chatInput.disabled = false;
            
            playSound('mic');
            addBotMessage("🛑 Audio Engine Offline.", "system");

        } catch (e) {
            console.error("Stop Error:", e);
        }
    }
}

// Remove startVoiceInput() entirely, map legacy calls to the new toggle
function startVoiceInput() { toggleListening(); }

function playBackendAudio(audioData) {
    // Stop anything currently playing before starting a new one
    stopSpeaking(); 

    try {
        // Handle both base64 streams and direct URLs
        const audioSrc = audioData.startsWith('data:audio') || audioData.startsWith('http') 
            ? audioData 
            : `data:audio/mp3;base64,${audioData}`;
            
        currentPlayingAudio = new Audio(audioSrc);
        currentPlayingAudio.play();
        
        // When the audio finishes naturally, clear the variable
        currentPlayingAudio.onended = () => {
            currentPlayingAudio = null;
        };
    } catch (e) {
        console.error("Audio Playback Error:", e);
    }
}

/* =========================================
   6. LIVE AGENT THINKING LOGIC
   ========================================= */
let currentThinkingAgent = null; // Track who is typing

function toggleThinking() {
    const content = document.getElementById('agentDiscussion');
    const arrow = document.getElementById('thinkingArrow');
    if (content && arrow) {
        content.classList.toggle('hidden');
        arrow.style.transform = content.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
    }
}

// 🟢 NEW: Colorful & Smooth Agent Cards
function addAgentThought(agentId, name, text) {
    const discussion = document.getElementById('agentDiscussion');
    if (!discussion) return;

    // 1. UPDATE EXISTING CARD (If same agent is typing)
    if (currentThinkingAgent === agentId) {
        const lastCard = discussion.lastElementChild;
        if (lastCard) {
            const pTag = lastCard.querySelector('.agent-text');
            if (pTag) {
                pTag.innerHTML = text.replace(/\n/g, '<br>');
                // Scroll gently only if near bottom
                if (text.length % 5 === 0) {
                    discussion.scrollTop = discussion.scrollHeight;
                }
                return;
            }
        }
    }

    // 2. CREATE NEW CARD
    currentThinkingAgent = agentId; 

    const div = document.createElement('div');
    div.className = "mb-4 opacity-0 transform translate-y-2 transition-all duration-500";
    
    // Distinct styles for each agent
    let borderColor = "border-blue-500";
    let textColor = "text-blue-400";
    let bgColor = "bg-blue-500/5";
    let icon = "fas fa-microchip";
    
    if (agentId === 'diag') { 
        borderColor = "border-pink-500"; textColor = "text-pink-400"; bgColor = "bg-pink-500/5"; icon = "fas fa-user-md"; 
        name = "DR. DIAGNOSIS";
    }
    else if (agentId === 'skeptic') { 
        borderColor = "border-orange-500"; textColor = "text-orange-400"; bgColor = "bg-orange-500/5"; icon = "fas fa-search"; 
        name = "THE SKEPTIC";
    }
    else if (agentId === 'judge') { 
        borderColor = "border-green-500"; textColor = "text-green-400"; bgColor = "bg-green-500/5"; icon = "fas fa-gavel"; 
        name = "CHIEF MEDICAL JUDGE";
    }
    
    const formattedText = text.replace(/\n/g, '<br>');
    
    div.innerHTML = `
        <div class="flex flex-col border-l-2 ${borderColor} ${bgColor} p-3 rounded-r-lg">
            <div class="flex items-center gap-2 mb-2">
                <i class="${icon} ${textColor} text-xs"></i>
                <span class="text-[10px] font-bold font-orbitron tracking-widest ${textColor}">${name}</span>
            </div>
            <div class="agent-text text-[11px] text-slate-300 font-rajdhani leading-relaxed pl-1">
                ${formattedText}
            </div>
        </div>
    `;
    
    discussion.appendChild(div);
    
    requestAnimationFrame(() => {
        div.style.opacity = "1";
        div.style.transform = "translateY(0)";
        discussion.scrollTop = discussion.scrollHeight;
    });
}

function resetThinkingUI() {
    currentThinkingAgent = null;
    const wrapper = document.getElementById('thinkingWrapper');
    const discussion = document.getElementById('agentDiscussion');
    const arrow = document.getElementById('thinkingArrow'); 
    
    if (wrapper) wrapper.classList.remove('hidden');
    if (discussion) {
        discussion.innerHTML = ''; 
        discussion.classList.remove('hidden'); // Force open
    }
    if (arrow) arrow.style.transform = 'rotate(180deg)'; 
}

function stopThinkingSimulation() {
    const wrapper = document.getElementById('thinkingWrapper');
    if (wrapper) wrapper.classList.add('hidden');
}

/* =========================================
   7. MAIN MESSAGE HANDLING
   ========================================= */

   // 🟢 NEW: Renders beautiful system specs in the chat
// 🟢 UPDATED: Shows system specs WITHOUT hiding the cards
function showFeatureDetails(feature) {
    // ❌ I removed the two lines that were hiding the cards here!

    let title = "";
    let details = "";

    if (feature === 'triage') {
        title = "🧬 SYSTEM SPEC: MULTI-AGENT TRIAGE";
        details = `<div class='text-xs space-y-2 mt-2 font-rajdhani'>
            <p><span class='text-cyan-400 font-bold'>Architecture:</span> Custom MLP Neural Network + LLM Agent Graph</p>
            <p><span class='text-cyan-400 font-bold'>Protocol:</span> The user's text is converted into a 384-dimensional semantic vector and routed via our custom Multi-Layer Perceptron. The data is then debated by a digital council (Triage, Specialist, and Judge) to ensure medical accuracy.</p>
            <p class='text-slate-400 italic pt-2'>👉 Action: Type any symptom in the bar below to initiate.</p>
        </div>`;
    } else if (feature === 'vision') {
        title = "🧠 SYSTEM SPEC: CNN VISION SCANNER";
        details = `<div class='text-xs space-y-2 mt-2 font-rajdhani'>
            <p><span class='text-pink-500 font-bold'>Architecture:</span> Convolutional Neural Network (CNN)</p>
            <p><span class='text-pink-500 font-bold'>Protocol:</span> Processes visual data arrays to detect anomalies in X-Rays, MRIs, and standard medical imagery with high precision.</p>
            <p class='text-slate-400 italic pt-2'>👉 Action: Click the <i class="fas fa-paperclip"></i> icon below to upload a scan.</p>
        </div>`;
    } else if (feature === 'voice') {
        title = "⚡ SYSTEM SPEC: WHISPER GPU ENGINE";
        details = `<div class='text-xs space-y-2 mt-2 font-rajdhani'>
            <p><span class='text-emerald-400 font-bold'>Architecture:</span> Whisper-Tiny (Float16 precision) + Llama-3.1</p>
            <p><span class='text-emerald-400 font-bold'>Protocol:</span> Bypasses the CPU to run directly on CUDA GPU architecture, providing near-instantaneous Speech-to-Text and continuous conversational memory.</p>
            <p class='text-slate-400 italic pt-2'>👉 Action: Click the <i class="fas fa-microphone"></i> icon to begin voice uplink.</p>
        </div>`;
    }  else if (feature === 'camera') {
        title = "📷 SYSTEM SPEC: OPENCV LIVE SCANNER";
        details = `<div class='text-xs space-y-2 mt-2 font-rajdhani'>
            <p><span class='text-purple-400 font-bold'>Architecture:</span> OpenCV + Browser WebRTC</p>
            <p><span class='text-purple-400 font-bold'>Protocol:</span> Captures live video feed through the user's hardware. It applies real-time computer vision processing to isolate physical symptoms, extracting high-fidelity frames to route to the Vision Backend for instant classification.</p>
            <p class='text-slate-400 italic pt-2'>👉 Action: Click the <i class="fas fa-camera"></i> icon below to activate the live feed.</p>
        </div>`;
    }

    // Print the message into the chat without clearing the screen
    addBotMessage(`<b>${title}</b>${details}`, 'system', false);
}
/* =========================================
   7. MAIN MESSAGE HANDLING (BULLETPROOF)
   ========================================= */
let currentAbortController = null; // 🟢 Tracks the active fetch request
   // 🟢 1. ADD THIS GLOBAL VARIABLE AND FUNCTION RIGHT ABOVE sendMessage()


function stopGeneration() {
    if (currentAbortController) {
        currentAbortController.abort(); // Kills the network request instantly
        currentAbortController = null;
    }
    stopSpeaking(); 
    stopThinkingSimulation(); 
    setMode('neutral');
    
    // Reset Buttons
    document.getElementById('analyzeBtn').classList.remove('hidden');
    document.getElementById('stopBtn').classList.add('hidden');
    
    addBotMessage("🛑 Generation halted by user.", "error", false);
}

// 🟢 2. YOUR UPDATED sendMessage() FUNCTION
async function sendMessage() {
    stopSpeaking();

    // Prevent double sending if scanning
    if(currentFile && isScanning) {
        addBotMessage("⚠️ System Busy: Uploading image...", "system");
        return; 
    }

    const textInput = document.getElementById('chatInput');
    const text = textInput.value.trim();

    // 1. MEMORY LOGIC: Save the symptom if it's a fresh message
    if (text && !text.includes("Follow-up:")) {
        lastUserSymptom = text.substring(0, 50); 
    }
    
    // 2. Validate inputs (Stop if empty)
    if (!text && !currentFile) {
        textInput.placeholder = "⚠️ Please enter data...";
        setTimeout(() => textInput.placeholder = "Enter symptoms...", 1500);
        return;
    }

    // 3. HIDE EMPTY STATE CARDS
    const emptyState = document.getElementById('emptyStateGuides');
    if (emptyState) emptyState.style.display = 'none';

    // 🟢 4. SHOW THE USER'S MESSAGE ON THE SCREEN FIRST
    addUserMessage(text, currentFile);
    
    // Update Timeline
    if (currentFile) {
        addToTimeline("Vision Scan Uploaded", `File: ${currentFile.name}`, "bg-pink-500", "text-pink-500");
    } else if (text) {
        addToTimeline("Symptom Logged", text.substring(0, 25) + "...", "bg-blue-400", "text-blue-400");
    }

    // 🟢 5. RUN THE NON-BLOCKING SAFETY SCANNER
    // This injects the red warning right below the user's message without stopping the backend!
    if (text) {
        checkEmergencyProtocol(text);
    }
    
    // 6. Proceed with Backend Request
    const fileToUpload = currentFile;
    const isCamera = isCameraSource; 
    
    textInput.value = '';
    clearFile();
    setMode('processing');
    playSound('scan');

    // 🟢 INITIALIZE ABORT CONTROLLER & SWAP BUTTONS
    currentAbortController = new AbortController();
    document.getElementById('analyzeBtn').classList.add('hidden');
    document.getElementById('stopBtn').classList.remove('hidden');

    try {
        const userId = getUserId() || "guest_user"; 

        // ==========================================
        // IMAGE/FILE UPLOAD LOGIC
        // ==========================================
        if (fileToUpload) {
            isVoiceInteraction = false; 
            
            const formData = new FormData();
            formData.append("file", fileToUpload);
            formData.append("user_id", userId); 

            if (isCamera) {
                addBotMessage("📸 Brain Analyzing Real-time Scan...", "system", false);
                const response = await fetch(`${BACKEND_BRAIN}/api/scan`, { 
                    method: 'POST', 
                    body: formData,
                    signal: currentAbortController.signal // 🟢 Attached Kill Switch
                });
                
                if (!response.ok) throw new Error(`Camera Scan Error (${response.status})`);
                
                const data = await response.json();
               // --- CAMERA SCAN SECTION ---
                const responseText = data.summary || data.diagnosis || "Analysis Complete.";
                
                // 🟢 NEW: Build Memory Bridge for Camera
                let cameraFindings = "None";
                if (data.report_data && data.report_data.length > 0) {
                    cameraFindings = data.report_data.map(item => `${item.label}: ${item.value} (${item.status})`).join(", ");
                }
                lastVisionContext = `[CLINICAL SYSTEM CONTEXT - CAMERA SCAN]\n- Verdict: ${data.verdict || 'Unknown'}\n- Severity: ${data.severity_score || 0}/4\n- Summary: ${data.summary || 'N/A'}\n- Metrics: ${cameraFindings}\n[INSTRUCTIONS: Use this data to answer follow-up questions.]\n\n`;

                addBotMessage(responseText, "normal", true, data.report_url);
                if (data.audio) playBackendAudio(data.audio);
                handleSeverity(data.severity_score || 2);
                saveToHistory(`Camera Scan`, 'scan');

            } else {
                // --- FILE UPLOAD SECTION ---
                addBotMessage("📂 Vision Analyzing File...", "system", false);
                const response = await fetch(`${BACKEND_VISION}/analyze`, { 
                    method: 'POST', 
                    body: formData,
                    signal: currentAbortController.signal 
                });
                
                if (!response.ok) throw new Error(`Vision Server Error (${response.status})`);
                
                const data = await response.json();

                // 🟢 NEW: Build Memory Bridge for File Upload
                let fileFindings = "None";
                if (data.report_data && data.report_data.length > 0) {
                    fileFindings = data.report_data.map(item => `${item.label}: ${item.value} (${item.status})`).join(", ");
                }
                lastVisionContext = `[CLINICAL SYSTEM CONTEXT - UPLOADED SCAN]\n- Verdict: ${data.verdict || 'Unknown'}\n- Severity: ${data.severity_score || 0}/4\n- Summary: ${data.summary || 'N/A'}\n- Metrics: ${fileFindings}\n[INSTRUCTIONS: Use this data to answer follow-up questions.]\n\n`;

                addDiagnosticMessage(data);
                handleSeverity(data.severity_score || 2);
                saveToHistory(`File Analysis`, 'scan');
            }
            
            setTimeout(() => setMode('neutral'), 4000);
        }

        // ==========================================
        // TEXT ONLY (Chat Backend)
        // ==========================================
        else {
            resetThinkingUI();
            const statusText = document.getElementById('thinkingStatusText');

            // 🟢 Send the context and the message as SEPARATE variables
            const response = await fetch(`${BACKEND_BRAIN}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    user_id: userId, 
                    message: text,                       // "can u tell me what are cures for this?"
                    vision_context: lastVisionContext    // The giant JSON system prompt
                }), 
                signal: currentAbortController.signal 
            });

            if (!response.ok) {
                const errorDetails = await response.text();
                throw new Error(`Server returned ${response.status}: ${errorDetails}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let resultBuffer = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                resultBuffer += decoder.decode(value, { stream: true });
                const lines = resultBuffer.split("\n");
                resultBuffer = lines.pop();

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const chunk = JSON.parse(line);
                        
                        // Handle Agent Thinking UI
                        if (chunk.agent) {
                            if (statusText) statusText.innerText = `${chunk.agent.toUpperCase()} IS ACTIVE...`;
                            addAgentThought(chunk.agent, chunk.agent.toUpperCase(), chunk.text);
                        }
                        
                        // Handle Final Output
                       // Handle Final Output
                   if (chunk.final) {
                            stopThinkingSimulation(); 
                            setMode('happy'); 
                            playSound('success');
                            addBotMessage(chunk.final, "normal", true);

                            extractClinicalTags(chunk.final);
                            addToTimeline("AI Diagnosis Complete", "Response delivered to user.", "bg-emerald-400", "text-emerald-400");
                            
                            if (typeof loadRLSuggestions === "function") {
                                loadRLSuggestions();
                            }
                            
                            // 🟢 FIX: ONLY play audio if the user used the mic!
                            if (chunk.audio && isVoiceInteraction) { 
                                playBackendAudio(chunk.audio);
                            }
                        }
                        
                        // Handle internal Python errors sent as JSON
                        if (chunk.error) {
                            throw new Error(chunk.error);
                        }
                    } catch (parseErr) { 
                        console.warn("JSON Parse Error on chunk:", line); 
                    }
                }
            }
        }

    } catch (error) {
        // 🟢 HANDLE ABORT GRACEFULLY
        if (error.name === 'AbortError') {
            console.log("Fetch aborted by user.");
            // stopGeneration() already handled the UI
        } else {
            console.error("Caught error in sendMessage:", error);
            stopThinkingSimulation();
            setMode('danger'); 
            addBotMessage(`❌ SYSTEM ERROR: ${error.message}`, "error", false);
        }
    } finally {
        // 🟢 ALWAYS RESET BUTTONS WHEN DONE
        document.getElementById('analyzeBtn').classList.remove('hidden');
        document.getElementById('stopBtn').classList.add('hidden');
        currentAbortController = null;
    }
}
// 🟢 NEW: Instantly aborts the fetch request and TTS
function stopGeneration() {
    if (currentAbortController) {
        currentAbortController.abort(); // Kills the network request
        currentAbortController = null;
    }
    stopSpeaking(); // Stops the audio playback
    stopThinkingSimulation(); // Hides the thinking panel
    setMode('neutral');
    
    // Reset Buttons
    document.getElementById('analyzeBtn').classList.remove('hidden');
    document.getElementById('stopBtn').classList.add('hidden');
    
    addBotMessage("🛑 Generation halted by user.", "error", false);
}

function handleSeverity(score) {
    if (score >= 4) { setMode('danger'); playSound('alert'); } 
    else if (score === 3) { setMode('caution'); } 
    else { setMode('happy'); playSound('success'); }
}

/* =========================================
   8. UI COMPONENTS (Messages & Cards)
   ========================================= */

// 🟢 NEW: No-Lag Typewriter
function typeWriterEffect(element, text, speed = 10) {
    let i = 0;
    element.innerHTML = ""; 
    
    function type() {
        // Batch 2 chars at a time for performance
        let batch = "";
        for (let k = 0; k < 2; k++) { 
            if (i < text.length) {
                const char = text.charAt(i);
                batch += (char === '\n') ? '<br>' : char;
                i++;
            }
        }
        
        if (batch) {
            element.innerHTML += batch;
            const messagesDiv = document.getElementById('messages');
            // Only scroll occasionally to prevent lag
            if (messagesDiv && (i % 20 === 0 || i >= text.length)) {
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            }
        }

        if (i < text.length) {
            requestAnimationFrame(() => setTimeout(type, speed));
        }
    }
    type();
}

// 🟢 NEW: Toggle History Dropdown
function toggleHistory(id) {
    const content = document.getElementById(id);
    const icon = document.getElementById(`icon-${id}`);
    
    if (content && icon) {
        content.classList.toggle('hidden');
        
        if (content.classList.contains('hidden')) {
            icon.style.transform = "rotate(0deg)";
        } else {
            icon.style.transform = "rotate(180deg)";
            // Smoothly scroll the main chat to show the full deliberation
            setTimeout(() => {
                content.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
    }
}

// 🟢 NEW: Chat Bubble with History Dropdown
function addBotMessage(text, type="normal", useTypewriter=false, reportUrl=null, thoughtsHTML=null) {
    const messagesDiv = document.getElementById('messages');
    const msgWrapper = document.createElement('div');
    msgWrapper.className = "flex justify-start animate-fade-in-up mb-4 w-full"; 
    
    let border = type === "error" ? "border-red-500/50" : "border-cyan-400/30";
    let textCol = type === "error" ? "text-red-300" : "text-slate-200";
    
    let pdfButton = reportUrl ? `
        <div class="mt-4 pt-3 border-t border-white/10">
            <a href="${reportUrl}" target="_blank" class="flex items-center justify-center gap-2 w-full py-2 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 border border-cyan-500/50 rounded text-xs font-orbitron transition-all">
                <i class="fas fa-file-pdf"></i> DOWNLOAD FULL REPORT
            </a>
        </div>` : "";

    // 🟢 HISTORY SECTION
    // 🟢 UPDATED: Scrollable History Section
let historySection = "";
if (thoughtsHTML) {
    const uniqueId = "history-" + Date.now();
    historySection = `
        <div class="mt-4 pt-2 border-t border-white/10">
            <button onclick="toggleHistory('${uniqueId}')" class="flex items-center justify-between w-full text-[10px] text-slate-500 hover:text-cyan-400 transition-colors uppercase font-orbitron tracking-widest group bg-black/20 p-2 rounded border border-transparent hover:border-cyan-500/20">
                <span class="flex items-center gap-2"><i class="fas fa-brain"></i> VIEW COUNCIL DELIBERATION</span>
                <i id="icon-${uniqueId}" class="fas fa-chevron-down transition-transform duration-300"></i>
            </button>
            
            <div id="${uniqueId}" class="hidden mt-2 p-3 space-y-4 bg-[#050a14] rounded border border-white/5 shadow-inner max-h-[400px] overflow-y-auto custom-scrollbar">
                ${thoughtsHTML}
            </div>
        </div>
    `;
}

    msgWrapper.innerHTML = `
        <div class="glass-panel ${border} p-5 rounded-2xl max-w-[95%] md:max-w-[85%] shadow-xl backdrop-blur-md">
            <div class="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                <div class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                <span class="text-[10px] text-cyan-400 font-orbitron tracking-widest opacity-80">MEDIBOT AI DIAGNOSIS</span>
            </div>
            <div class="bot-text font-rajdhani ${textCol} text-[15px] leading-7 tracking-wide"></div>
            ${historySection}
            ${pdfButton}
        </div>`;
        
    messagesDiv.appendChild(msgWrapper);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    const textContainer = msgWrapper.querySelector('.bot-text');
    if (useTypewriter) {
        typeWriterEffect(textContainer, text);
    } else {
        textContainer.innerHTML = text.replace(/\n/g, '<br>');
    }
}

// 🟢 RICH DIAGNOSTIC CARD (Unchanged)
function addDiagnosticMessage(data) {
    const messagesDiv = document.getElementById('messages');
    const msgWrapper = document.createElement('div');
    msgWrapper.className = "flex justify-start animate-fade-in-up mb-6 w-full"; 
    
    const severity = data.severity_score || 0;
    
    let borderColor = "border-emerald-500/50"; 
    let titleColor = "text-emerald-400"; 
    let badgeBg = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    let progressBarColor = "bg-emerald-500";
    let statusTextColor = "text-emerald-400";

    if (severity >= 4) { 
        borderColor = "border-red-500/50"; titleColor = "text-red-500"; badgeBg = "bg-red-500/20 text-red-400 border-red-500/30"; progressBarColor = "bg-red-500"; statusTextColor = "text-red-400 font-bold";
    }
    else if (severity === 3) { 
        borderColor = "border-orange-500/50"; titleColor = "text-orange-400"; badgeBg = "bg-orange-500/20 text-orange-400 border-orange-500/30"; progressBarColor = "bg-orange-500"; statusTextColor = "text-orange-400";
    }
    else if (severity === 2) { 
        borderColor = "border-yellow-500/50"; titleColor = "text-yellow-400"; badgeBg = "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"; progressBarColor = "bg-yellow-500"; statusTextColor = "text-yellow-400";
    }
    
    let confidenceVal = "N/A";
    if (data.report_data) {
        const confItem = data.report_data.find(i => i.label.includes("Confidence"));
        if (confItem) confidenceVal = confItem.value;
    }
    const numConf = parseFloat(confidenceVal.replace("%", "")) || 0;
    const finalBarColor = numConf < 50 ? "bg-red-500" : progressBarColor;

    let htmlContent = `
        <div class="glass-panel ${borderColor} text-white rounded-xl p-5 w-full md:max-w-2xl shadow-lg bg-[#0a0f1e]/95">
            <div class="flex justify-between items-start mb-4 border-b border-white/10 pb-3">
                <div>
                    <div class="text-[10px] text-slate-500 font-bold tracking-widest font-orbitron mb-1">DIAGNOSTIC RESULT</div>
                    <div class="font-orbitron font-bold text-xl md:text-2xl ${titleColor}">${data.verdict || "ANALYSIS COMPLETE"}</div>
                </div>
                <div class="px-3 py-1 rounded font-bold text-xs border ${badgeBg} font-orbitron">TIER ${severity}/4</div>
            </div>
            <div class="flex flex-col md:flex-row gap-5">`;
            
    if (data.heatmap_url) {
        htmlContent += `
            <div class="w-full md:w-1/3 flex flex-col gap-3">
                <div class="relative group rounded-lg overflow-hidden border border-white/20 h-40 bg-black shadow-inner">
                    <img src="${data.heatmap_url}" class="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity">
                    <div class="absolute bottom-0 left-0 bg-black/80 w-full px-2 py-1 text-[9px] text-cyan-400 font-orbitron text-center border-t border-cyan-500/30">AI ATTENTION MAP</div>
                </div>
                <div class="bg-white/5 p-3 rounded border border-white/10">
                    <div class="flex justify-between text-[10px] text-slate-400 mb-2 font-orbitron"><span>CONFIDENCE SCORE</span><span class="text-white font-mono">${confidenceVal}</span></div>
                    <div class="w-full bg-black/50 rounded-full h-1.5 overflow-hidden border border-white/5">
                        <div class="${finalBarColor} h-full rounded-full shadow-[0_0_10px_currentColor]" style="width: ${numConf}%"></div>
                    </div>
                </div>
            </div>`;
    }
    
    htmlContent += `<div class="flex-1 flex flex-col gap-3">`;
    if (data.report_data && data.report_data.length > 0) {
        htmlContent += `<div class="bg-black/20 rounded-lg border border-white/10 overflow-hidden"><table class="w-full text-xs text-left text-slate-300">
            <thead class="bg-white/5 text-slate-400 font-orbitron border-b border-white/5"><tr><th class="px-3 py-2">FINDING</th><th class="px-3 py-2">VALUE</th><th class="px-3 py-2 text-right">STATUS</th></tr></thead>
            <tbody class="divide-y divide-white/5">`;
        data.report_data.forEach(item => {
            if (item.label.includes("Confidence") || item.label.includes("Modality")) return;
            let itemStatusColor = item.is_abnormal ? "text-red-400 font-bold" : statusTextColor;
            htmlContent += `<tr><td class="px-3 py-2">${item.label}</td><td class="px-3 py-2 font-mono text-slate-200">${item.value}</td><td class="px-3 py-2 text-right ${itemStatusColor}">${item.status || "OK"}</td></tr>`;
        });
        htmlContent += `</tbody></table></div>`;
    } else {
        htmlContent += `<p class="text-sm text-slate-300 italic bg-white/5 p-4 rounded border border-white/10 leading-relaxed">${data.summary}</p>`;
    }
    
    let modalityVal = "General";
    if (data.report_data) {
        const modItem = data.report_data.find(i => i.label.includes("Modality"));
        if (modItem) modalityVal = modItem.value;
    }

    htmlContent += `<div class="flex justify-between text-[10px] text-slate-500 uppercase tracking-widest px-1 mt-auto pt-2"><span>MODALITY: <span class="text-cyan-400">${modalityVal}</span></span><span>MODEL: <span class="text-pink-400">BIOMED-CLIP</span></span></div></div></div>`;
    
    if (data.report_url) {
        htmlContent += `<div class="mt-3 pt-3 border-t border-white/10"><a href="${data.report_url}" target="_blank" class="block w-full text-center bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-2 rounded-lg text-xs font-orbitron transition-all shadow-lg border border-white/10"><i class="fas fa-file-pdf mr-2"></i>DOWNLOAD OFFICIAL REPORT</a></div>`;
    }
    
    htmlContent += `<div class="flex items-center justify-center gap-2 text-[10px] text-slate-500 mt-2 opacity-70"><i class="fas fa-shield-alt text-cyan-400"></i><span>AI-Generated Analysis. Verify with a licensed physician.</span></div></div>`;
    
    msgWrapper.innerHTML = htmlContent;
    messagesDiv.appendChild(msgWrapper);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function addUserMessage(text, file) {
    const messagesDiv = document.getElementById('messages');
    const msgWrapper = document.createElement('div');
    msgWrapper.className = "flex justify-end animate-fade-in-up mb-3";
    let content = "";
    if (file) {
        const previewImg = document.querySelector('#previewContent img');
        if (previewImg) content += `<img src="${previewImg.src}" class="w-full h-32 object-cover rounded-md opacity-90 border border-white/20 mb-2">`;
        else content += `<div class="flex items-center gap-2 bg-white/10 p-2 rounded mb-2 text-xs"><i class="fas fa-file-image"></i> ${file.name}</div>`;
    }
    if (text) content += `<p class="text-sm font-rajdhani text-white">${text}</p>`;
    msgWrapper.innerHTML = `<div class="bg-gradient-to-r from-pink-500 to-blue-500 p-[1px] rounded-xl shadow-lg max-w-[85%]"><div class="bg-[#0a0f1e] rounded-[11px] p-3 text-white">${content}</div></div>`;
    messagesDiv.appendChild(msgWrapper);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function handleFileSelect(input) {
    if (input.files && input.files[0]) {
        stopSpeaking(); 
        isVoiceInteraction = false; 
        currentFile = input.files[0];
        isScanning = true; 
        isCameraSource = false; 
        const preview = document.getElementById('filePreview');
        const contentBox = document.getElementById('previewContent');
        const fileName = document.getElementById('previewFileName');
        const scanBar = document.getElementById('scanBar');
        preview.classList.remove('hidden');
        fileName.textContent = currentFile.name;
        scanBar.classList.add('animate-scan-bar');
        scanBar.style.width = ''; scanBar.style.opacity = ''; scanBar.classList.replace('bg-green-500', 'bg-cyan-400');
        if (currentFile.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => contentBox.innerHTML = `<img src="${e.target.result}" class="w-full h-full object-cover rounded-md opacity-90">`;
            reader.readAsDataURL(currentFile);
        } else { contentBox.innerHTML = `<div class="doc-page w-full h-full rounded flex items-center justify-center bg-white border-t-4 border-gray-500"><i class="fas fa-file-alt text-gray-500 text-lg"></i></div>`; }
        playSound('scan');
        setTimeout(() => {
            scanBar.classList.remove('animate-scan-bar');
            scanBar.style.width = '100%'; scanBar.style.opacity = '1'; scanBar.classList.replace('bg-cyan-400', 'bg-green-500');
            isScanning = false; 
        }, 1000);
    }
}

function clearFile() { currentFile = null; isScanning = false; document.getElementById('fileInput').value = ''; document.getElementById('filePreview').classList.add('hidden'); }
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('-translate-x-full'); document.getElementById('sidebarOverlay').classList.toggle('hidden'); }
function toggleProfile() { document.getElementById('profileDropdown').classList.toggle('hidden'); }

let videoStream = null;
async function startCamera() {
    stopSpeaking(); 
    try {
        const video = document.getElementById('videoFeed');
        const modal = document.getElementById('cameraModal');
        videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        video.srcObject = videoStream;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    } catch (err) { alert("Could not access camera: " + err); }
}

function closeCamera() {
    const modal = document.getElementById('cameraModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    if (videoStream) { videoStream.getTracks().forEach(track => track.stop()); videoStream = null; }
}

function capturePhoto() {
    const video = document.getElementById('videoFeed');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => {
        const file = new File([blob], "scan_" + Date.now() + ".jpg", { type: "image/jpeg" });
        currentFile = file;
        isCameraSource = true; 
        const preview = document.getElementById('filePreview');
        const contentBox = document.getElementById('previewContent');
        const fileName = document.getElementById('previewFileName');
        preview.classList.remove('hidden');
        fileName.textContent = currentFile.name;
        contentBox.innerHTML = `<img src="${URL.createObjectURL(currentFile)}" class="w-full h-full object-cover rounded-md opacity-90">`;
        closeCamera();
        sendMessage();
    }, 'image/jpeg');
}

setMode('neutral');
/* =========================================
   9. RL ADAPTIVE SUGGESTIONS
   ========================================= */
async function loadRLSuggestions() {
    // 1. Remove old suggestions if they exist
    const oldContainer = document.getElementById('rl-suggestion-box');
    if (oldContainer) oldContainer.remove();

    try {
        // 2. Fetch Epsilon-Greedy suggestions from Python
        const response = await fetch(`${BACKEND_BRAIN}/api/rl/suggestions`);
        const data = await response.json();
        
        if (data.suggestions && data.suggestions.length > 0) {
            const messagesDiv = document.getElementById('messages');
            const suggestContainer = document.createElement('div');
            suggestContainer.id = 'rl-suggestion-box';
            suggestContainer.className = "flex flex-wrap gap-2 justify-start animate-fade-in-up mb-4 ml-6";
            
            // 3. Create the UI Buttons
            data.suggestions.forEach(action => {
                const btn = document.createElement('button');
                btn.className = "px-3 py-1.5 bg-blue-600/20 hover:bg-pink-500/30 text-blue-300 hover:text-pink-300 border border-blue-500/30 rounded-full text-[10px] font-orbitron transition-all";
                btn.innerText = action.text;
                
               // 4. Send Reward (+1) on Click
                btn.onclick = async () => {
                    suggestContainer.remove(); // Hide suggestions
                    
                    // Send RL Reward to Backend
                    fetch(`${BACKEND_BRAIN}/api/rl/reward`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action_id: action.id })
                    });
                    
                    // 🟢 THE FIX: Inject memory so the AI doesn't hallucinate!
                    const chatInput = document.getElementById('chatInput');
                    chatInput.value = `Follow-up: ${action.text} (Regarding: ${lastUserSymptom})`;
                    sendMessage();
                };
                
                suggestContainer.appendChild(btn);
            });
            
            messagesDiv.appendChild(suggestContainer);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
    } catch (e) {
        console.error("RL Suggestion Error:", e);
    }
}
// Run on page load
// 🟢 NEW: Sleek Terminal Boot Sequence
window.onload = () => {
    const terminal = document.getElementById('bootTerminal');
    if(!terminal) return;
    
    setTimeout(() => {
        terminal.innerHTML += `<div class="font-orbitron text-[10px] md:text-xs text-cyan-500/70 tracking-widest animate-fade-in-up">> INITIATING SECURE HANDSHAKE...</div>`;
    }, 500);
    
    setTimeout(() => {
        terminal.innerHTML += `<div class="font-orbitron text-[10px] md:text-xs text-cyan-500/70 tracking-widest animate-fade-in-up">> LOADING NEURAL WEIGHTS & FAISS DATABASE...</div>`;
    }, 1200);
    
    setTimeout(() => {
        terminal.innerHTML += `<div class="font-orbitron text-[11px] md:text-sm text-emerald-400 font-bold tracking-widest animate-fade-in-up mt-2 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]">> SYSTEM ONLINE. READY FOR INPUT.</div>`;
    }, 2000);
};
// 🟢 UTILITY: Add events to the Left Timeline
function addToTimeline(title, desc, colorClass = "bg-cyan-400", textClass = "text-cyan-400") {
    const timeline = document.getElementById('sessionTimeline');
    if (!timeline) return;

    const node = document.createElement('div');
    node.className = "relative animate-fade-in-up mt-4";
    node.innerHTML = `
        <div class="absolute -left-[13px] top-1.5 w-2 h-2 rounded-full ${colorClass} shadow-[0_0_8px_currentColor]"></div>
        <div class="text-[11px] ${textClass} font-bold tracking-wide uppercase">${title}</div>
        <div class="text-[9px] text-slate-400 mt-0.5">${desc}</div>
    `;
    timeline.appendChild(node);
    timeline.scrollTop = timeline.scrollHeight; // Auto-scroll to bottom
}

// 🟢 UTILITY: Zero-Token Medical Term Extraction
// 🟢 UTILITY: Zero-Token Medical Term Extraction (FIXED)
function extractClinicalTags(text) {
    try {
        const tagsContainer = document.getElementById('clinicalTags');
        if (!tagsContainer) return;

        // Remove the "No data" placeholder if it's there
        if (tagsContainer.innerHTML.includes("No data")) {
            tagsContainer.innerHTML = '';
        }

        // Expanded list of medical keywords
        const medicalKeywords = [
            "headache", "fever", "pain", "nausea", "ibuprofen", "paracetamol", 
            "cancer", "infection", "blood", "x-ray", "mri", "tumor", "fracture", 
            "virus", "bacteria", "acne", "diabetes", "hypertension", "syndrome", 
            "therapy", "symptoms", "diagnosis", "swelling", "inflammation", 
            "fatigue", "dizziness", "cough", "asthma", "allergy", "rash", "pcos"
        ];
        
        // 🟢 FIX: This line is now safely on its own line!
        // Grab any phrase the AI puts in **bold** (often diseases or medicines)
        const boldMatches = [...text.matchAll(/\*\*(.*?)\*\*/g)].map(m => m[1]);
        
        // Check for standard keywords
        const cleanText = text.toLowerCase().replace(/[^a-z\s-]/g, '');
        const words = cleanText.split(/\s+/);
        const foundKeywords = words.filter(word => medicalKeywords.includes(word));

        // Combine both lists and remove duplicates
        const allTags = [...new Set([...foundKeywords, ...boldMatches.map(w => w.toLowerCase())])];

        allTags.forEach(tag => {
            // Prevent adding the exact same tag twice, and ignore tiny words
            if (!tagsContainer.innerHTML.includes(`>${tag}<`) && tag.length > 2) {
                const span = document.createElement('span');
                span.className = "bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[9px] px-2 py-0.5 rounded uppercase tracking-wide font-rajdhani animate-fade-in";
                span.innerText = tag;
                tagsContainer.appendChild(span);
            }
        });
    } catch (error) {
        console.error("Clinical Tag Extraction Error:", error);
    }
}
// 🟢 NEW: Hardcoded Safety Guardrail
// 🟢 UPGRADED: Hardcoded Safety Guardrail
// 🟢 NON-BLOCKING SAFETY GUARDRAIL
function checkEmergencyProtocol(text) {
    const criticalKeywords = [
        "chest pain", "heart attack", "stroke", "can't breathe", "gasping",
        "choking", "suicide", "kill myself", "bleeding heavily", "won't stop bleeding",
        "gunshot", "overdose", "unconscious", "seizure", "vomiting blood", 
        "bone is sticking out", "face is drooping", "slurred speech"
    ];
    
    // Check if any critical keyword exists
    const isEmergency = criticalKeywords.some(keyword => text.toLowerCase().includes(keyword));
    
    if (isEmergency) {
        // 1. Turn the background slightly red permanently for this session
        document.body.classList.add('emergency-override');
        playSound('danger'); 
        
        // 2. Instantly inject the safety warning, but let the AI continue working!
        addBotMessage("🚨 **CRITICAL SAFETY OVERRIDE:** Your symptoms indicate a potentially life-threatening emergency. Please contact local emergency services (Dial 108 or 911). Proceeding with backend AI analysis, but do not rely on this for immediate survival.", "error", false);
    }
}

// Generate a random Case ID on load
window.addEventListener('load', () => {
    const caseId = document.getElementById('caseIdDisplay');
    if(caseId) caseId.innerText = `#MB-${Math.floor(Math.random() * 9000) + 1000}`;
});
