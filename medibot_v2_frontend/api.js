// --- PERSISTENT USER IDENTITY ---
/* ============================================================
   MEDIBOT API BRIDGE (Frontend <-> Backend)
   ============================================================ */

// 🟢 HELPER: Get the Real User ID (From Auth System)
function getUserId() {
    // 1. Try to get the ID saved by our new Authentication System
    let userId = localStorage.getItem("medibot_uid");
    
    // 2. Fallback: If no user is logged in, generate a temporary Guest ID
    if (!userId) {
        console.warn("⚠️ No logged-in user found. Using Guest ID.");
        userId = localStorage.getItem("medibot_guest_id");
        if (!userId) {
            userId = "guest_" + Math.random().toString(36).substr(2, 9);
            localStorage.setItem("medibot_guest_id", userId);
        }
    }
    return userId;
}

const MediBotAPI = {
    
    // ============================================================
    // FUNCTION 1: SCAN IMAGE (Points to Vision Backend - Port 8000)
    // ============================================================
    async scanImage(imageFile) {
        const userId = getUserId();
        const formData = new FormData();
        formData.append("file", imageFile); 
        formData.append("user_id", userId); // 🟢 CRITICAL: Link scan to User

        try {
            console.log(`📸 [Vision] Sending scan to Port 8000 for User: ${userId}...`);
            
            // 🟢 UPDATED URL: Points to Backend 1 (api.py) on Port 8000
            const response = await fetch("http://127.0.0.1:8000/analyze", {
                method: "POST",
                body: formData 
            });

            if (!response.ok) throw new Error(`Vision Error: ${response.statusText}`);
            const data = await response.json();
            return data;

        } catch (error) {
            console.error("❌ Scan Failed:", error);
            // Fallback: If Port 8000 is down, try Port 5000 (The Chat Server)
            console.log("⚠️ Port 8000 failed. Trying Port 5000 fallback...");
            try {
                const fallbackResponse = await fetch("http://127.0.0.1:5000/api/scan", {
                    method: "POST",
                    body: formData
                });
                return await fallbackResponse.json();
            } catch (fallbackError) {
                alert("Error: Both Backend Systems are offline. Please run 'python server.py' and 'python -m app.api'");
                return null;
            }
        }
    },

    // ============================================================
    // FUNCTION 2: CHAT (Legacy Mode - Updated URL)
    // ============================================================
    async chat(userMessage) {
        const userId = getUserId();
        try {
            const response = await fetch("http://127.0.0.1:5000/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: userId, message: userMessage })
            });

            if (!response.ok) throw new Error("Brain Offline");
            return await response.json(); 
        } catch (error) {
            console.error("❌ Chat Failed:", error);
            return { response: "⚠️ Error: The Brain is offline." };
        }
    },

    // ============================================================
    // FUNCTION 3: LIVE CHAT STREAM (The New Thinking Feature)
    // ============================================================
    async chatStream(userMessage, onThought, onFinal) {
        const userId = getUserId();

        try {
            console.log(`📡 [Stream] Connecting to Medical Council (User: ${userId})...`);
            
            const response = await fetch("http://127.0.0.1:5000/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    user_id: userId,
                    message: userMessage 
                })
            });

            if (!response.ok) throw new Error("Brain Offline");

            // 🟢 STREAM READER: Processes chunks as they arrive
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let resultBuffer = "";

            while (true) {
                const { value, done } = await reader.read();
                
                if (done) {
                    if (resultBuffer.trim()) {
                        this._processNDJSON(resultBuffer, onThought, onFinal);
                    }
                    break;
                }

                resultBuffer += decoder.decode(value, { stream: true });
                
                // Split by newline (NDJSON protocol)
                const lines = resultBuffer.split("\n");
                
                // Keep the last partial line in the buffer
                resultBuffer = lines.pop();

                for (const line of lines) {
                    this._processNDJSON(line, onThought, onFinal);
                }
            }

        } catch (error) {
            console.error("❌ Stream Failed:", error);
            onFinal({ final: "⚠️ Connection Lost. Specialist nexus is currently unavailable." });
        }
    },

    // --- INTERNAL HELPER: DISPATCHER FOR STREAM CHUNKS ---
    _processNDJSON(line, onThought, onFinal) {
        if (!line.trim()) return;
        try {
            const data = JSON.parse(line);

            // 1. Agent Discussion (Thinking UI)
            if (data.agent) {
                // Map short codes to nice names
                let displayName = data.agent.toUpperCase();
                if (data.agent === 'diag') displayName = "DR. DIAGNOSIS";
                if (data.agent === 'treat') displayName = "DR. TREATMENT";
                if (data.agent === 'skeptic') displayName = "THE SKEPTIC";
                if (data.agent === 'judge') displayName = "THE JUDGE";

                onThought(data.agent, displayName, data.text);
            }

            // 2. Final Answer
            if (data.final) {
                onFinal(data); 
            }

            // 3. Errors
            if (data.error) {
                onThought('skeptic', 'SYSTEM ALERT', data.error);
            }
        } catch (parseErr) {
            console.warn("⚠️ JSON Parse Skip:", line);
        }
    }
};

// --- UI HELPER: MAP SPECIALIST IDs TO LABELS ---
function getAgentDisplayName(id) {
    const map = { 
        diag: "🔬 Dr. Diagnosis", 
        treat: "💊 Dr. Treatment", 
        skeptic: "🧐 The Skeptic", 
        judge: "👨‍⚖️ The Judge" 
    };
    return map[id] || "AI Specialist";
}