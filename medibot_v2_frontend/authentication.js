// /* --- 1. CONFIGURATION & SETUP --- */
// // 🟢 NEW: Your Python Backend URL
// /* --- 1. CONFIGURATION & SETUP --- */

// // 🟢 DYNAMIC: Automatically uses Localhost or Production URL
// const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000"; 

// const firebaseConfig = {
//     apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
//     authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
//     projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
//     storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
//     messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
//     appId: import.meta.env.VITE_FIREBASE_APP_ID,
//     measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
// };

// // Initialize Firebase
// let auth;
// try {
//     if (typeof firebase !== 'undefined' && firebase.apps.length === 0) {
//         firebase.initializeApp(firebaseConfig);
//         auth = firebase.auth();
//     } else if (typeof firebase !== 'undefined') {
//         auth = firebase.auth();
//     }
// } catch (e) {
//     console.error("Firebase Initialization Error:", e);
// }

// /* --- 2. WARP SPEED BACKGROUND (Visuals) --- */
// const canvas = document.getElementById('warpCanvas');
// const ctx = canvas.getContext('2d');

// function resizeCanvas() {
//     canvas.width = window.innerWidth;
//     canvas.height = window.innerHeight;
// }
// window.addEventListener('resize', resizeCanvas);
// resizeCanvas(); 

// let stars = [];
// const numStars = 500;
// let speed = 2; 

// class Star {
//     constructor() {
//         this.x = Math.random() * canvas.width - canvas.width / 2;
//         this.y = Math.random() * canvas.height - canvas.height / 2;
//         this.z = Math.random() * canvas.width;
//     }
//     update() {
//         this.z -= speed;
//         this.z -= speed;
//         if (this.z <= 0) {
//             this.z = canvas.width;
//             this.x = Math.random() * canvas.width - canvas.width / 2;
//             this.y = Math.random() * canvas.height - canvas.height / 2;
//         }
//     }
//     draw() {
//         let x = (this.x / this.z) * canvas.width + canvas.width / 2;
//         let y = (this.y / this.z) * canvas.height + canvas.height / 2;
//         let radius = Math.abs((1 - this.z / canvas.width) * 3);
        
//         if (x > 0 && x < canvas.width && y > 0 && y < canvas.height) {
//             ctx.beginPath();
//             ctx.fillStyle = "white";
//             ctx.arc(x, y, radius, 0, Math.PI * 2);
//             ctx.fill();
//         }
//     }
// }

// for (let i = 0; i < numStars; i++) stars.push(new Star());

// function animateWarp() {
//     ctx.fillStyle = "rgba(2, 6, 23, 0.4)"; 
//     ctx.fillRect(0, 0, canvas.width, canvas.height);
//     stars.forEach(star => {
//         star.update();
//         star.draw();
//     });
//     requestAnimationFrame(animateWarp);
// }
// animateWarp();

// /* --- 3. UI TRANSITION LOGIC --- */
// const container = document.querySelector('.portal-container');
// const loginModule = document.getElementById('loginModule');
// const signupModule = document.getElementById('signupModule');
// const rings = document.querySelectorAll('.ring');

// window.warpTo = function(mode) {
//     let speedInterval = setInterval(() => {
//         speed += 2;
//         if(speed > 50) clearInterval(speedInterval);
//     }, 20);

//     rings.forEach(r => r.style.animationDuration = '0.5s');

//     if(mode === 'signup') {
//         loginModule.classList.remove('active-module');
//         loginModule.classList.add('hidden-module');
//     } else {
//         signupModule.classList.remove('active-module');
//         signupModule.classList.add('hidden-module');
//     }

//     setTimeout(() => {
//         if(mode === 'signup') container.classList.add('mode-signup');
//         else container.classList.remove('mode-signup');
        
//         if(mode === 'signup') {
//             signupModule.classList.remove('hidden-module');
//             signupModule.classList.add('active-module');
//         } else {
//             loginModule.classList.remove('hidden-module');
//             loginModule.classList.add('active-module');
//         }

//         rings.forEach(r => r.style.animationDuration = ''); 
//         let slowInterval = setInterval(() => {
//             speed -= 2;
//             if(speed <= 2) {
//                 speed = 2;
//                 clearInterval(slowInterval);
//             }
//         }, 20);

//     }, 600);
// };

// document.addEventListener('DOMContentLoaded', () => {
//     const urlParams = new URLSearchParams(window.location.search);
//     if (urlParams.get('mode') === 'signup') window.warpTo('signup');
// });

// /* --- 4. AUTHENTICATION LOGIC (HYBRID) --- */

// // A. MANUAL EMAIL LOGIN (Connects to Python DB)
// const loginForm = document.getElementById('mainLoginForm');
// if (loginForm) {
//     loginForm.addEventListener('submit', async (e) => {
//         e.preventDefault();
//         const email = document.getElementById('loginEmail').value.trim();
//         const pass = document.getElementById('loginPass').value.trim();
        
//         if(!email || !pass) return showAlert("Empty Inputs.");
        
//         // 🟢 NEW: Fetch to Python Backend
//         try {
//             const response = await fetch(`${API_BASE}/manual_login`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ email: email, password: pass })
//             });

//             const data = await response.json();

//             if (data.status === 'success') {
//                 // Login Success -> Create a standardized user object
//                 const manualUser = {
//                     uid: data.user_id,
//                     displayName: data.username,
//                     email: data.email
//                 };
//                 loginSuccess(manualUser);
//             } else {
//                 showAlert(data.message || "Login Failed");
//             }
//         } catch (err) {
//             console.error(err);
//             showAlert("Server Connection Failed");
//         }
//     });
// }

// // B. MANUAL EMAIL SIGNUP (Connects to Python DB)
// const signupForm = document.getElementById('mainSignupForm');
// if (signupForm) {
//     signupForm.addEventListener('submit', async (e) => {
//         e.preventDefault();
//         const f = document.getElementById('fname').value.trim();
//         const email = document.getElementById('semail').value.trim();
//         const pass = document.getElementById('spass').value.trim();
        
//         if(!f || !email || !pass) return showAlert("Data Missing.");
        
//         // 🟢 NEW: Fetch to Python Backend
//         try {
//             const response = await fetch(`${API_BASE}/manual_signup`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ email: email, password: pass, username: f })
//             });

//             const data = await response.json();

//             if (data.status === 'success') {
//                 // Signup Success
//                 const manualUser = {
//                     uid: data.user_id,
//                     displayName: f,
//                     email: email
//                 };
//                 loginSuccess(manualUser);
//             } else {
//                 showAlert(data.message || "Signup Failed");
//             }
//         } catch (err) {
//             console.error(err);
//             showAlert("Server Connection Failed");
//         }
//     });
// }

// // C. SOCIAL LOGIN (Google/GitHub -> Firebase -> Sync to Python)
// window.socialLogin = function(platform) {
//     let provider;
//     if (platform === 'Google') {
//         provider = new firebase.auth.GoogleAuthProvider();
//         provider.setCustomParameters({ prompt: 'select_account' });
//     } else {
//         provider = new firebase.auth.GithubAuthProvider();
//     }
    
//     auth.signInWithPopup(provider)
//         .then(res => {
//             const user = res.user;
            
//             // 🟢 NEW: Sync Firebase User to Python DB
//             fetch(`${API_BASE}/sync_user`, {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({
//                     uid: user.uid,
//                     email: user.email
//                 })
//             }).catch(err => console.error("Sync Error:", err));

//             // Proceed to Login
//             loginSuccess(user);
//         })
//         .catch(e => showAlert(e.message));
// };

// // D. SUCCESS REDIRECT (Handles both Firebase & Manual Users)
// function loginSuccess(user) {
//     // 🟢 Save User Details to Local Storage
//     localStorage.setItem('isLoggedIn', 'true');
//     localStorage.setItem('userName', user.displayName || "User");
//     localStorage.setItem('medibot_uid', user.uid); // Critical for Chat History
    
//     // Redirect UP one directory to index.html
//     window.location.href = '../chat.html'; 
// }

// /* --- 5. MODAL UTILITIES --- */
// window.openForgotModal = function() { 
//     document.getElementById('forgotModal').classList.remove('hidden'); 
// };

// window.closeForgotModal = function() { 
//     document.getElementById('forgotModal').classList.add('hidden'); 
// };

// window.handleForgotSubmit = function() {
//     const email = document.getElementById('forgotEmail').value.trim();
//     if(!email) return showAlert("Email Required.");
    
//     // Note: Forgot Password only works for Firebase users currently
//     auth.sendPasswordResetEmail(email)
//         .then(() => { 
//             closeForgotModal(); 
//             showAlert("Reset Link Sent (Firebase Only)."); 
//         })
//         .catch(e => showAlert(e.message));
// };

// window.showAlert = function(msg) {
//     const alertBox = document.getElementById('validationAlert');
//     const msgBox = document.getElementById('alertMessage');
//     if (alertBox && msgBox) {
//         msgBox.textContent = msg;
//         alertBox.classList.remove('hidden');
//     } else {
//         alert(msg); 
//     }
// };

// window.closeValidationAlert = function() { 
//     document.getElementById('validationAlert').classList.add('hidden'); 
// };

// /* --- 6. CURSOR & INTERACTION EFFECTS --- */
// const dot = document.querySelector('.cursor-dot');
// const outline = document.querySelector('.cursor-outline');

// // Track Mouse Movement
// if(dot && outline) {
//     window.addEventListener('mousemove', (e) => {
//         const { clientX: x, clientY: y } = e;
//         dot.style.left = `${x}px`;
//         dot.style.top = `${y}px`;
//         outline.animate({ left: `${x}px`, top: `${y}px` }, { duration: 400, fill: "forwards" });
//     });
// }

// // Handle Hover States
// const interactables = 'input, button, a, .orbit-nav span, i';
// document.querySelectorAll(interactables).forEach(el => {
//     el.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
//     el.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
// });
// /* --- 1. FIREBASE CONFIGURATION --- */
// // IMPORTANT: Replace these with your actual Firebase project keys from the console
// const firebaseConfig = {
//     apiKey: "AIzaSyDPEywFgii0vVWl-xt8qZve9pOqHUxsbeQ",
//     authDomain: "medibot-73b45.firebaseapp.com",
//     projectId: "medibot-73b45",
//     storageBucket: "medibot-73b45.firebasestorage.app",
//     messagingSenderId: "385608781776",
//     appId: "1:385608781776:web:9c9588d8d3f9029cb6b3d5",
//     measurementId: "G-7K9JLKZNT9"
// };

// // Initialize Firebase
// let auth;
// try {
//     if (typeof firebase !== 'undefined' && firebase.apps.length === 0) {
//         firebase.initializeApp(firebaseConfig);
//         auth = firebase.auth();
//     } else if (typeof firebase !== 'undefined') {
//         auth = firebase.auth();
//     }
// } catch (e) {
//     console.error("Firebase Initialization Error:", e);
// }

// /* --- 2. WARP SPEED BACKGROUND (Visuals) --- */
// const canvas = document.getElementById('warpCanvas');
// const ctx = canvas.getContext('2d');

// function resizeCanvas() {
//     canvas.width = window.innerWidth;
//     canvas.height = window.innerHeight;
// }
// window.addEventListener('resize', resizeCanvas);
// resizeCanvas(); 

// let stars = [];
// const numStars = 500;
// let speed = 2; 

// class Star {
//     constructor() {
//         this.x = Math.random() * canvas.width - canvas.width / 2;
//         this.y = Math.random() * canvas.height - canvas.height / 2;
//         this.z = Math.random() * canvas.width;
//     }
//     update() {
//         this.z -= speed;
//         if (this.z <= 0) {
//             this.z = canvas.width;
//             this.x = Math.random() * canvas.width - canvas.width / 2;
//             this.y = Math.random() * canvas.height - canvas.height / 2;
//         }
//     }
//     draw() {
//         let x = (this.x / this.z) * canvas.width + canvas.width / 2;
//         let y = (this.y / this.z) * canvas.height + canvas.height / 2;
//         let radius = Math.abs((1 - this.z / canvas.width) * 3);
        
//         if (x > 0 && x < canvas.width && y > 0 && y < canvas.height) {
//             ctx.beginPath();
//             ctx.fillStyle = "white";
//             ctx.arc(x, y, radius, 0, Math.PI * 2);
//             ctx.fill();
//         }
//     }
// }

// for (let i = 0; i < numStars; i++) stars.push(new Star());

// function animateWarp() {
//     ctx.fillStyle = "rgba(2, 6, 23, 0.4)"; 
//     ctx.fillRect(0, 0, canvas.width, canvas.height);
//     stars.forEach(star => {
//         star.update();
//         star.draw();
//     });
//     requestAnimationFrame(animateWarp);
// }
// animateWarp();

// /* --- 3. UI TRANSITION LOGIC --- */
// const container = document.querySelector('.portal-container');
// const loginModule = document.getElementById('loginModule');
// const signupModule = document.getElementById('signupModule');
// const rings = document.querySelectorAll('.ring');

// window.warpTo = function(mode) {
//     let speedInterval = setInterval(() => {
//         speed += 2;
//         if(speed > 50) clearInterval(speedInterval);
//     }, 20);

//     rings.forEach(r => r.style.animationDuration = '0.5s');

//     if(mode === 'signup') {
//         loginModule.classList.remove('active-module');
//         loginModule.classList.add('hidden-module');
//     } else {
//         signupModule.classList.remove('active-module');
//         signupModule.classList.add('hidden-module');
//     }

//     setTimeout(() => {
//         if(mode === 'signup') container.classList.add('mode-signup');
//         else container.classList.remove('mode-signup');
        
//         if(mode === 'signup') {
//             signupModule.classList.remove('hidden-module');
//             signupModule.classList.add('active-module');
//         } else {
//             loginModule.classList.remove('hidden-module');
//             loginModule.classList.add('active-module');
//         }

//         rings.forEach(r => r.style.animationDuration = ''); 
//         let slowInterval = setInterval(() => {
//             speed -= 2;
//             if(speed <= 2) {
//                 speed = 2;
//                 clearInterval(slowInterval);
//             }
//         }, 20);

//     }, 600);
// };

// document.addEventListener('DOMContentLoaded', () => {
//     const urlParams = new URLSearchParams(window.location.search);
//     if (urlParams.get('mode') === 'signup') window.warpTo('signup');
// });

// /* --- 4. AUTHENTICATION LOGIC --- */

// // A. EMAIL LOGIN
// const loginForm = document.getElementById('mainLoginForm');
// if (loginForm) {
//     loginForm.addEventListener('submit', (e) => {
//         e.preventDefault();
//         const email = document.getElementById('loginEmail').value.trim();
//         const pass = document.getElementById('loginPass').value.trim();
        
//         if(!email || !pass) return showAlert("Empty Inputs.");
        
//         auth.signInWithEmailAndPassword(email, pass)
//             .then(res => loginSuccess(res.user))
//             .catch(e => showAlert(e.message));
//     });
// }

// // B. EMAIL SIGNUP
// const signupForm = document.getElementById('mainSignupForm');
// if (signupForm) {
//     signupForm.addEventListener('submit', (e) => {
//         e.preventDefault();
//         const f = document.getElementById('fname').value.trim();
//         const email = document.getElementById('semail').value.trim();
//         const pass = document.getElementById('spass').value.trim();
        
//         if(!f || !email || !pass) return showAlert("Data Missing.");
        
//         auth.createUserWithEmailAndPassword(email, pass)
//             .then(res => {
//                 res.user.updateProfile({ displayName: f })
//                     .then(() => loginSuccess(res.user));
//             })
//             .catch(e => showAlert(e.message));
//     });
// }

// // C. SOCIAL LOGIN (Google/GitHub)
// window.socialLogin = function(platform) {
//     let provider;
//     if (platform === 'Google') {
//         provider = new firebase.auth.GoogleAuthProvider();
//         // FORCE ACCOUNT SELECTION (Fixes auto-login issue)
//         provider.setCustomParameters({
//             prompt: 'select_account'
//         });
//     } else {
//         provider = new firebase.auth.GithubAuthProvider();
//     }
    
//     auth.signInWithPopup(provider)
//         .then(res => loginSuccess(res.user))
//         .catch(e => showAlert(e.message));
// };

// // D. SUCCESS REDIRECT
// function loginSuccess(user) {
//     // Store basic info for immediate UI feedback
//     localStorage.setItem('isLoggedIn', 'true');
//     localStorage.setItem('userName', user.displayName || "User");
    
//     // Redirect UP one directory to index.html
//     window.location.href = 'chat.html'; 
// }

// /* --- 5. MODAL UTILITIES --- */
// window.openForgotModal = function() { 
//     document.getElementById('forgotModal').classList.remove('hidden'); 
// };

// window.closeForgotModal = function() { 
//     document.getElementById('forgotModal').classList.add('hidden'); 
// };

// window.handleForgotSubmit = function() {
//     const email = document.getElementById('forgotEmail').value.trim();
//     if(!email) return showAlert("Email Required.");
    
//     auth.sendPasswordResetEmail(email)
//         .then(() => { 
//             closeForgotModal(); 
//             showAlert("Reset Link Sent."); 
//         })
//         .catch(e => showAlert(e.message));
// };

// window.showAlert = function(msg) {
//     const alertBox = document.getElementById('validationAlert');
//     const msgBox = document.getElementById('alertMessage');
//     if (alertBox && msgBox) {
//         msgBox.textContent = msg;
//         alertBox.classList.remove('hidden');
//     } else {
//         alert(msg); 
//     }
// };
// const dot = document.querySelector('.cursor-dot');
// const outline = document.querySelector('.cursor-outline');

// // Track Mouse Movement
// window.addEventListener('mousemove', (e) => {
//     const { clientX: x, clientY: y } = e;
    
//     // Position dot immediately
//     dot.style.left = `${x}px`;
//     dot.style.top = `${y}px`;
    
//     // Smooth outline movement
//     outline.animate({
//         left: `${x}px`,
//         top: `${y}px`
//     }, { duration: 400, fill: "forwards" });
// });

// // Handle Hover States for all interactive elements
// const interactables = 'input, button, a, .orbit-nav span, i';
// document.querySelectorAll(interactables).forEach(el => {
//     el.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
//     el.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
// });

// window.closeValidationAlert = function() { 
//     document.getElementById('validationAlert').classList.add('hidden'); 
// };

/* --- 1. CONFIGURATION & SETUP --- */
// 🟢 NEW: Your Python Backend URL
const API_BASE = "http://127.0.0.1:5000"; 

// IMPORTANT: Replace these with your actual Firebase project keys from the console
const firebaseConfig = {
    apiKey: "AIzaSyDPEywFgii0vVWl-xt8qZve9pOqHUxsbeQ",
    authDomain: "medibot-73b45.firebaseapp.com",
    projectId: "medibot-73b45",
    storageBucket: "medibot-73b45.firebasestorage.app",
    messagingSenderId: "385608781776",
    appId: "1:385608781776:web:9c9588d8d3f9029cb6b3d5",
    measurementId: "G-7K9JLKZNT9"
};

// Initialize Firebase
let auth;
try {
    if (typeof firebase !== 'undefined' && firebase.apps.length === 0) {
        firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
    } else if (typeof firebase !== 'undefined') {
        auth = firebase.auth();
    }
} catch (e) {
    console.error("Firebase Initialization Error:", e);
}

/* --- 2. WARP SPEED BACKGROUND (Visuals) --- */
const canvas = document.getElementById('warpCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); 

let stars = [];
const numStars = 500;
let speed = 2; 

class Star {
    constructor() {
        this.x = Math.random() * canvas.width - canvas.width / 2;
        this.y = Math.random() * canvas.height - canvas.height / 2;
        this.z = Math.random() * canvas.width;
    }
    update() {
        this.z -= speed;
        this.z -= speed;
        if (this.z <= 0) {
            this.z = canvas.width;
            this.x = Math.random() * canvas.width - canvas.width / 2;
            this.y = Math.random() * canvas.height - canvas.height / 2;
        }
    }
    draw() {
        let x = (this.x / this.z) * canvas.width + canvas.width / 2;
        let y = (this.y / this.z) * canvas.height + canvas.height / 2;
        let radius = Math.abs((1 - this.z / canvas.width) * 3);
        
        if (x > 0 && x < canvas.width && y > 0 && y < canvas.height) {
            ctx.beginPath();
            ctx.fillStyle = "white";
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

for (let i = 0; i < numStars; i++) stars.push(new Star());

function animateWarp() {
    ctx.fillStyle = "rgba(2, 6, 23, 0.4)"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    stars.forEach(star => {
        star.update();
        star.draw();
    });
    requestAnimationFrame(animateWarp);
}
animateWarp();

/* --- 3. UI TRANSITION LOGIC --- */
const container = document.querySelector('.portal-container');
const loginModule = document.getElementById('loginModule');
const signupModule = document.getElementById('signupModule');
const rings = document.querySelectorAll('.ring');

window.warpTo = function(mode) {
    let speedInterval = setInterval(() => {
        speed += 2;
        if(speed > 50) clearInterval(speedInterval);
    }, 20);

    rings.forEach(r => r.style.animationDuration = '0.5s');

    if(mode === 'signup') {
        loginModule.classList.remove('active-module');
        loginModule.classList.add('hidden-module');
    } else {
        signupModule.classList.remove('active-module');
        signupModule.classList.add('hidden-module');
    }

    setTimeout(() => {
        if(mode === 'signup') container.classList.add('mode-signup');
        else container.classList.remove('mode-signup');
        
        if(mode === 'signup') {
            signupModule.classList.remove('hidden-module');
            signupModule.classList.add('active-module');
        } else {
            loginModule.classList.remove('hidden-module');
            loginModule.classList.add('active-module');
        }

        rings.forEach(r => r.style.animationDuration = ''); 
        let slowInterval = setInterval(() => {
            speed -= 2;
            if(speed <= 2) {
                speed = 2;
                clearInterval(slowInterval);
            }
        }, 20);

    }, 600);
};

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'signup') window.warpTo('signup');
});

/* --- 4. AUTHENTICATION LOGIC (HYBRID) --- */

// A. MANUAL EMAIL LOGIN (Connects to Python DB)
const loginForm = document.getElementById('mainLoginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const pass = document.getElementById('loginPass').value.trim();
        
        if(!email || !pass) return showAlert("Empty Inputs.");
        
        // 🟢 NEW: Fetch to Python Backend
        try {
            const response = await fetch(`${API_BASE}/manual_login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, password: pass })
            });

            const data = await response.json();

            if (data.status === 'success') {
                // Login Success -> Create a standardized user object
                const manualUser = {
                    uid: data.user_id,
                    displayName: data.username,
                    email: data.email
                };
                loginSuccess(manualUser);
            } else {
                showAlert(data.message || "Login Failed");
            }
        } catch (err) {
            console.error(err);
            showAlert("Server Connection Failed");
        }
    });
}

// B. MANUAL EMAIL SIGNUP (Connects to Python DB)
const signupForm = document.getElementById('mainSignupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = document.getElementById('fname').value.trim();
        const email = document.getElementById('semail').value.trim();
        const pass = document.getElementById('spass').value.trim();
        
        if(!f || !email || !pass) return showAlert("Data Missing.");
        
        // 🟢 NEW: Fetch to Python Backend
        try {
            const response = await fetch(`${API_BASE}/manual_signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, password: pass, username: f })
            });

            const data = await response.json();

            if (data.status === 'success') {
                // Signup Success
                const manualUser = {
                    uid: data.user_id,
                    displayName: f,
                    email: email
                };
                loginSuccess(manualUser);
            } else {
                showAlert(data.message || "Signup Failed");
            }
        } catch (err) {
            console.error(err);
            showAlert("Server Connection Failed");
        }
    });
}

// C. SOCIAL LOGIN (Google/GitHub -> Firebase -> Sync to Python)
window.socialLogin = function(platform) {
    let provider;
    if (platform === 'Google') {
        provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
    } else {
        provider = new firebase.auth.GithubAuthProvider();
    }
    
    auth.signInWithPopup(provider)
        .then(res => {
            const user = res.user;
            
            // 🟢 NEW: Sync Firebase User to Python DB
            fetch(`${API_BASE}/sync_user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uid: user.uid,
                    email: user.email
                })
            }).catch(err => console.error("Sync Error:", err));

            // Proceed to Login
            loginSuccess(user);
        })
        .catch(e => showAlert(e.message));
};

// D. SUCCESS REDIRECT (Handles both Firebase & Manual Users)
function loginSuccess(user) {
    // 🟢 Save User Details to Local Storage
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userName', user.displayName || "User");
    localStorage.setItem('medibot_uid', user.uid); // Critical for Chat History
    
    // Redirect UP one directory to index.html
    window.location.href = 'chat.html'; 
}

/* --- 5. MODAL UTILITIES --- */
window.openForgotModal = function() { 
    document.getElementById('forgotModal').classList.remove('hidden'); 
};

window.closeForgotModal = function() { 
    document.getElementById('forgotModal').classList.add('hidden'); 
};

window.handleForgotSubmit = function() {
    const email = document.getElementById('forgotEmail').value.trim();
    if(!email) return showAlert("Email Required.");
    
    // Note: Forgot Password only works for Firebase users currently
    auth.sendPasswordResetEmail(email)
        .then(() => { 
            closeForgotModal(); 
            showAlert("Reset Link Sent (Firebase Only)."); 
        })
        .catch(e => showAlert(e.message));
};

window.showAlert = function(msg) {
    const alertBox = document.getElementById('validationAlert');
    const msgBox = document.getElementById('alertMessage');
    if (alertBox && msgBox) {
        msgBox.textContent = msg;
        alertBox.classList.remove('hidden');
    } else {
        alert(msg); 
    }
};

window.closeValidationAlert = function() { 
    document.getElementById('validationAlert').classList.add('hidden'); 
};

/* --- 6. CURSOR & INTERACTION EFFECTS --- */
const dot = document.querySelector('.cursor-dot');
const outline = document.querySelector('.cursor-outline');

// Track Mouse Movement
if(dot && outline) {
    window.addEventListener('mousemove', (e) => {
        const { clientX: x, clientY: y } = e;
        dot.style.left = `${x}px`;
        dot.style.top = `${y}px`;
        outline.animate({ left: `${x}px`, top: `${y}px` }, { duration: 400, fill: "forwards" });
    });
}

// Handle Hover States
const interactables = 'input, button, a, .orbit-nav span, i';
document.querySelectorAll(interactables).forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
});