# 🏥 MediBot: Multi-Agent Medical Intelligence System

### **Full-Stack Agentic RAG // Neural Routing // Computer Vision // Distributed Microservices**

**MediBot** is a professional-grade, autonomous medical consultation ecosystem. It moves beyond simple chatbots by implementing a **distributed microservice architecture** that leverages a **4-Tier Medical Council** to provide safe, empathetic, and evidence-based clinical advice.

----------

## 🏗️ 1. Distributed System Architecture

The ecosystem is divided into three specialized repositories, deployed across a hybrid cloud/local environment to optimize for high-compute AI tasks.

### **A. medibot-frontend (Deployed on Vercel)**

-   **Role:** High-fidelity "Neon pink" user interface.
    
-   **Tech Stack:** Vanilla JS, Three.js (DNA Visualization), Tailwind CSS.
    
-   **Functionality:** Manages the **Biometric AR Scanner**, real-time **NDJSON streaming**, and **Firebase/Hybrid Auth**.
    

### **B. BACKEND 1: Vision Engine (Local + Ngrok)**

-   **Role:** Specialized microservice for physical trauma assessment.
    
-   **Tech Stack:** Python, OpenCV, NumPy.
    
-   **Logic:** Performs **HSV Color Segmentation** to detect inflammation and **Contour Detection** to "Target Lock" injuries for the AI.
    

### **C. BACKEND 2: Clinical Brain (Local + Ngrok)**

-   **Role:** The intelligence core and agent orchestrator.
    
-   **Tech Stack:** FastAPI, LangGraph, Groq (Llama 3.3-70B), FAISS.
    
-   **Logic:** Hosts the **Neural Network Intent Router** and the **4-Tier Medical Council** debate logic.
    

----------

## 🧠 2. Deep Technical Logic

### **The "Medical Council" Debate Flow**

Unlike standard RAG, MediBot utilizes **LangGraph** to manage a consensus-based workflow:

1.  **Triage Agent:** Analyzes query for risk level and enforces a **Safety Net Override** for life-threatening keywords.
    
2.  **Specialist Agent:** Performs **Similarity Search** against a FAISS medical database and adopts dynamic clinical personas (e.g., Cardiologist).
    
3.  **Skeptic Agent (The Auditor):** Critically reviews the specialist's draft to identify bias or missed "Red Flags".
    
4.  **Judge Agent (Chief Medical Officer):** Synthesizes the debate into a final, empathetic response streamed via NDJSON.
    

### **Neural Intent Routing**

To prevent expensive LLM calls for simple tasks, a **Custom MLP Neural Network** (`router_nn.pkl`) classifies user intent in milliseconds:

-   **GREETING/EXIT:** Instant local response.
    
-   **INFO:** Single-agent RAG search.
    
-   **SYMPTOM:** Activation of the full Medical Council.
    

----------

## 🚀 3. Deployment & Connectivity Strategy

This project demonstrates proficiency in **Distributed Networking** by bridging cloud-hosted frontends with high-performance local backends.

### **Networking Stack**

-   **Frontend Hosting:** **Vercel** for global availability and optimized asset delivery.
    
-   **Backend Tunneling:** **Ngrok** creates secure public HTTPS tunnels to your local machine (Ports 8000 and 5000).
    
-   **Bridge Configuration:** The `api.js` file is dynamically updated with Ngrok URLs to allow the Vercel app to bypass local network restrictions.
    
-   **CORS Security:** The FastAPI backends use **CORSMiddleware** to specifically whitelist the Vercel frontend origin.
    

----------

## 🛠️ 4. Technical Specifications & Stack

-   **Language/Framework:** Python 3.10+, JavaScript (ES6+), FastAPI.
    
-   **AI & LLMs:** Groq (Llama 3.3-70B, 3.1-8B), Llama-4 Scout (Vision).
    
-   **Vector DB:** FAISS with `all-MiniLM-L6-v2` embeddings.
    
-   **Voice Engine:** GPU-accelerated **Whisper-tiny** (STT) and **Edge-TTS** with interruption handling.
    
-   **RL Engine:** Multi-Armed Bandit algorithm with **Epsilon-Greedy** reward selection for follow-up suggestions.
    

----------

## ⚖️ 5. Licensing & Ethics

**Copyright (c) 2026 Shlok Patel.**

This entire ecosystem is protected under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.
