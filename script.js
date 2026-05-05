var canvas = document.getElementById('nokey'),
    can_w = parseInt(canvas.getAttribute('width')),
    can_h = parseInt(canvas.getAttribute('height')),
    ctx = canvas.getContext('2d');

// console.log(typeof can_w);
var BALL_NUM = 30

var ball = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      r: 0,
      alpha: 1,
      phase: 0
    },
    ball_color = {
        r: 255,
        g: 255,
        b: 255
    },
    R = 2,
    balls = [],
    alpha_f = 0.03,
    alpha_phase = 0,
    
// Line
    link_line_width = 0.8,
    dis_limit = 260,
    add_mouse_point = true,
    mouse_in = false,
    mouse_ball = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      r: 0,
      type: 'mouse'
    };

// Random speed
function getRandomSpeed(pos){
    var  min = -1,
        max = 1;
    switch(pos){
        case 'top':
            return [randomNumFrom(min, max), randomNumFrom(0.1, max)];
            break;
        case 'right':
            return [randomNumFrom(min, -0.1), randomNumFrom(min, max)];
            break;
        case 'bottom':
            return [randomNumFrom(min, max), randomNumFrom(min, -0.1)];
            break;
        case 'left':
            return [randomNumFrom(0.1, max), randomNumFrom(min, max)];
            break;
        default:
            return;
            break;
    }
}
function randomArrayItem(arr){
    return arr[Math.floor(Math.random() * arr.length)];
}
function randomNumFrom(min, max){
    return Math.random()*(max - min) + min;
}
console.log(randomNumFrom(0, 10));
// Random Ball
function getRandomBall(){
    var pos = randomArrayItem(['top', 'right', 'bottom', 'left']);
    switch(pos){
        case 'top':
            return {
                x: randomSidePos(can_w),
                y: -R,
                vx: getRandomSpeed('top')[0],
                vy: getRandomSpeed('top')[1],
                r: R,
                alpha: 1,
                phase: randomNumFrom(0, 10)
            }
            break;
        case 'right':
            return {
                x: can_w + R,
                y: randomSidePos(can_h),
                vx: getRandomSpeed('right')[0],
                vy: getRandomSpeed('right')[1],
                r: R,
                alpha: 1,
                phase: randomNumFrom(0, 10)
            }
            break;
        case 'bottom':
            return {
                x: randomSidePos(can_w),
                y: can_h + R,
                vx: getRandomSpeed('bottom')[0],
                vy: getRandomSpeed('bottom')[1],
                r: R,
                alpha: 1,
                phase: randomNumFrom(0, 10)
            }
            break;
        case 'left':
            return {
                x: -R,
                y: randomSidePos(can_h),
                vx: getRandomSpeed('left')[0],
                vy: getRandomSpeed('left')[1],
                r: R,
                alpha: 1,
                phase: randomNumFrom(0, 10)
            }
            break;
    }
}
function randomSidePos(length){
    return Math.ceil(Math.random() * length);
}

// Draw Ball
function renderBalls(){
    Array.prototype.forEach.call(balls, function(b){
       if(!b.hasOwnProperty('type')){
            ctx.fillStyle = 'rgba('+ball_color.r+','+ball_color.g+','+ball_color.b+','+b.alpha+')';
            ctx.beginPath();
            ctx.arc(b.x, b.y, R, 0, Math.PI*2, true);
            ctx.closePath();
            ctx.fill();
       }
    });
}

// Update balls
function updateBalls(){
    var new_balls = [];
    Array.prototype.forEach.call(balls, function(b){
         b.x += b.vx;
         b.y += b.vy;
         
         if(b.x > -(50) && b.x < (can_w+50) && b.y > -(50) && b.y < (can_h+50)){
            new_balls.push(b);
         }
         
         // alpha change
         b.phase += alpha_f;
         b.alpha = Math.abs(Math.cos(b.phase));
         // console.log(b.alpha);
    });
    
    balls = new_balls.slice(0);
}

// loop alpha
function loopAlphaInf(){
    
}

// Draw lines
function renderLines(){
    var fraction, alpha;
    for (var i = 0; i < balls.length; i++) {
        for (var j = i + 1; j < balls.length; j++) {
            
            fraction = getDisOf(balls[i], balls[j]) / dis_limit;
            
            if(fraction < 1){
                alpha = (1 - fraction).toString();

                ctx.strokeStyle = 'rgba(150,150,150,'+alpha+')';
                ctx.lineWidth = link_line_width;
                
                ctx.beginPath();
                ctx.moveTo(balls[i].x, balls[i].y);
                ctx.lineTo(balls[j].x, balls[j].y);
                ctx.stroke();
                ctx.closePath();
            }
        }
    }
}

// calculate distance between two points
function getDisOf(b1, b2){
    var  delta_x = Math.abs(b1.x - b2.x),
        delta_y = Math.abs(b1.y - b2.y);
    
    return Math.sqrt(delta_x*delta_x + delta_y*delta_y);
}

// add balls if there a little balls
function addBallIfy(){
    if(balls.length < BALL_NUM){
        balls.push(getRandomBall());
    }
}

// Render
function render(){
    ctx.clearRect(0, 0, can_w, can_h);
    
    renderBalls();
    
    renderLines();
    
    updateBalls();
    
    addBallIfy();
    
    window.requestAnimationFrame(render);
}

// Init Balls
function initBalls(num){
    for(var i = 1; i <= num; i++){
        balls.push({
            x: randomSidePos(can_w),
            y: randomSidePos(can_h),
            vx: getRandomSpeed('top')[0],
            vy: getRandomSpeed('top')[1],
            r: R,
            alpha: 1,
            phase: randomNumFrom(0, 10)
        });
    }
}
// Init Canvas
function initCanvas(){
    canvas.setAttribute('width', window.innerWidth);
    canvas.setAttribute('height', window.innerHeight);
    
    can_w = parseInt(canvas.getAttribute('width'));
    can_h = parseInt(canvas.getAttribute('height'));
}

window.addEventListener('resize', function(e){
    console.log('Window Resize...');
    initCanvas();
});

function goMovie(){
    initCanvas();
    initBalls(BALL_NUM);
    window.requestAnimationFrame(render);
}

// Mouse effect
canvas.addEventListener('mouseenter', function(){
    console.log('mouseenter');
    mouse_in = true;
    balls.push(mouse_ball);
});
canvas.addEventListener('mouseleave', function(){
    console.log('mouseleave');
    mouse_in = false;
    var new_balls = [];
    Array.prototype.forEach.call(balls, function(b){
        if(!b.hasOwnProperty('type')){
            new_balls.push(b);
        }
    });
    balls = new_balls.slice(0);
});
canvas.addEventListener('mousemove', function(e){
    var e = e || window.event;
    mouse_ball.x = e.pageX;
    mouse_ball.y = e.pageY;
    // console.log(mouse_ball);
});


// =========================================================================
// SECOND CODE BLOCK (Form Logic) MERGED INTO window.onload
// =========================================================================

window.onload = function () {
    // 1. START THE CANVAS ANIMATION FOR THE BACKGROUND
    goMovie();
    
    // Mode logic - Enhanced detection
    const registrationForm = document.getElementById("registrationForm");
    const attendanceForm = document.getElementById("attendanceForm");
    
    // Check script attribute first, then form presence, then URL
    const scriptTag = document.querySelector('script[src*="script.js"][data-page]');
    const pageAttr = scriptTag ? scriptTag.getAttribute('data-page') : null;
    
    const mode = pageAttr || (registrationForm ? 'registration' : (attendanceForm ? 'attendance' : (window.location.pathname.includes('register') ? 'registration' : 'attendance')));
    const isRegistrationPage = mode === 'registration';

    const mainContainer = document.querySelector(".main-container"); 
    const messageBox = document.getElementById("message");
    const loader = document.getElementById("loader");
    const loaderText = loader ? loader.querySelector('.loader-text') : null;
    const captureBtn = document.getElementById('capture');
    const video = document.getElementById('video');
    const faceCanvas = document.getElementById('canvas');
    const livenessOverlay = document.getElementById('liveness-overlay');
    const livenessStatus = document.getElementById('liveness-status');
    const livenessProgress = document.getElementById('liveness-progress');
    const livenessIcon = document.getElementById('liveness-icon');

    // INITIAL STATE: Wait for user gesture
    captureBtn.innerHTML = `<i class="fas fa-play-circle"></i> Enable Camera & Location`;
    captureBtn.disabled = false;
    captureBtn.style.background = 'linear-gradient(135deg, #8a2be2 0%, #6a1fcf 100%)';

    let permissionsGranted = false;

    async function handleStartApp() {
        showLoader("Initializing System...");
        
        // 1. Request Camera First (Mobile browsers hate simultaneous prompts)
        try {
            await initCamera();
            if (video) {
                await video.play();
                console.log("Video playback started via click.");
            }
        } catch (e) {
            console.error("Camera initialization failed:", e);
            hideLoader();
            return; // Stop if camera fails
        }

        // 2. Request Geolocation Second
        if (navigator.geolocation) {
            await new Promise((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const userLat = pos.coords.latitude;
                        const userLng = pos.coords.longitude;
                        let inAllowedArea = false;
                        for (const loc of ALLOWED_LOCATIONS) {
                            const distance = getDistance(userLat, userLng, loc.lat, loc.lng);
                            if (distance <= loc.radius) { inAllowedArea = true; break; }
                        }
                        if (inAllowedArea) {
                            messageBox.innerHTML = "✅ Location Verified. Proceed with face check.";
                            messageBox.classList.add("success");
                        } else {
                            messageBox.innerHTML = "❌ Out of allowed area. Attendance disabled.";
                            messageBox.classList.add("error");
                            if (submitButton) submitButton.disabled = true;
                        }
                        messageBox.style.display = "block";
                        resolve();
                    },
                    (err) => {
                        messageBox.innerHTML = "⚠️ Location blocked. Please enable it in site settings.";
                        messageBox.style.display = "block";
                        resolve();
                    },
                    { enableHighAccuracy: true, timeout: 5000 }
                );
            });
        }
        
        hideLoader();
        permissionsGranted = true;
        
        // Update captureBtn to its actual function
        captureBtn.removeEventListener('click', handleStartApp);
        captureBtn.addEventListener('click', handleCaptureClick);
    }

    captureBtn.addEventListener('click', handleStartApp);

    async function initCamera() {
        if (!captureBtn || !video) return;

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            let msg = "❌ Camera API not supported.";
            if (!window.isSecureContext) {
                msg = "❌ Camera requires HTTPS (Secure Context).";
            }
            captureBtn.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${msg}`;
            captureBtn.disabled = true;
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user' } // Removed strict width/height to avoid mobile constraint errors
            });
            video.srcObject = stream;
            video.setAttribute('playsinline', 'true'); // Required for iOS Safari
            video.setAttribute('muted', 'true');
            video.muted = true; // Extra safety for mobile auto-play
            
            // Try playing immediately
            video.play().catch(e => {
                console.warn("First play attempt failed, waiting for metadata:", e);
                video.onloadedmetadata = () => video.play();
            });

            captureBtn.innerHTML = `<i class="fas fa-camera"></i> ${mode === 'registration' ? 'Register Face' : 'Verify Face'}`;
            captureBtn.disabled = false;
        } catch (err) {
            console.error("Camera Error:", err);
            let msg = "Camera Denied/Unavailable";
            if (err.name === 'NotAllowedError') {
                msg = "Camera Blocked. Click Lock Icon 🔒 to Allow.";
            }
            captureBtn.innerHTML = `<i class="fas fa-sync"></i> ${msg} (Tap to Retry)`;
            captureBtn.disabled = false; 
            captureBtn.onclick = () => {
                captureBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Requesting...';
                initCamera();
            };
        }
    }


    // 2. INJECT DEVICE REQUEST MODAL (Phase 4)
    const modalHtml = `
        <div id="device-request-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:9999; align-items:center; justify-content:center;">
            <div style="background:#1a1a2e; border:1px solid rgba(138,43,226,0.4); border-radius:16px; padding:32px; max-width:460px; width:90%; box-shadow:0 20px 60px rgba(0,0,0,0.6);">
                <h2 style="margin:0 0 8px; color:white; font-size:1.2rem;"><i class="fas fa-mobile-alt" style="color:#ff5252;"></i> Unauthorized Device Detected</h2>
                <p style="color:#aaa; font-size:0.9rem; margin:0 0 20px;">Your face was recognized, but this device is not registered to your account. You can request an admin to approve this device.</p>
                <div style="margin-bottom:14px;">
                    <label style="color:#aaa; font-size:0.85rem; display:block; margin-bottom:6px;">Your Registered Name</label>
                    <input type="text" id="modal-student-name" placeholder="Enter your full name" style="width:100%; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.15); border-radius:8px; padding:10px 14px; color:white; font-family:'Poppins',sans-serif; outline:none; box-sizing:border-box;">
                </div>
                <div style="margin-bottom:20px;">
                    <label style="color:#aaa; font-size:0.85rem; display:block; margin-bottom:6px;">Reason for Device Change</label>
                    <textarea id="modal-reason" placeholder="e.g. My old phone broke, I bought a new one..." rows="3" style="width:100%; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.15); border-radius:8px; padding:10px 14px; color:white; font-family:'Poppins',sans-serif; outline:none; resize:vertical; box-sizing:border-box;"></textarea>
                </div>
                <div id="modal-msg" style="display:none; margin-bottom:14px; padding:10px 14px; border-radius:8px; font-size:0.85rem;"></div>
                <div style="display:flex; gap:12px;">
                    <button id="modal-submit" style="flex:1; background:linear-gradient(135deg,#8a2be2,#6a1fcf); color:white; border:none; border-radius:10px; padding:12px; font-weight:600; cursor:pointer; font-family:'Poppins',sans-serif;">
                        <i class="fas fa-paper-plane"></i> Submit Request
                    </button>
                    <button id="modal-cancel" style="background:rgba(255,255,255,0.08); color:#aaa; border:1px solid rgba(255,255,255,0.15); border-radius:10px; padding:12px 20px; cursor:pointer; font-family:'Poppins',sans-serif;">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const deviceModal = document.getElementById('device-request-modal');
    if (document.getElementById('modal-cancel')) {
        document.getElementById('modal-cancel').addEventListener('click', () => { deviceModal.style.display = 'none'; });
    }
    if (document.getElementById('modal-submit')) {
        document.getElementById('modal-submit').addEventListener('click', async () => {
            const studentName = document.getElementById('modal-student-name').value.trim();
            const reason = document.getElementById('modal-reason').value.trim();
            const msgBox = document.getElementById('modal-msg');
            const btn = document.getElementById('modal-submit');

            if (!studentName || !reason) {
                msgBox.style.display = 'block'; msgBox.style.color = '#ff5252';
                msgBox.style.background = 'rgba(255,82,82,0.1)'; msgBox.style.border = '1px solid #ff5252';
                msgBox.innerText = 'Please fill in both fields.';
                return;
            }

            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

            try {
                const deviceId = getOrCreateDeviceId();
                const deviceInfo = getDeviceInfo();
                const res = await fetch('/api/request_device_change', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: studentName, newDeviceId: deviceId, newDeviceInfo: deviceInfo, reason })
                });
                const result = await res.json();
                msgBox.style.display = 'block';
                msgBox.style.color = result.success ? '#4CAF50' : '#ff5252';
                msgBox.style.background = result.success ? 'rgba(76,175,80,0.1)' : 'rgba(255,82,82,0.1)';
                msgBox.style.border = `1px solid ${result.success ? '#4CAF50' : '#ff5252'}`;
                msgBox.innerText = result.message;
                if (result.success) { setTimeout(() => { deviceModal.style.display = 'none'; }, 3000); }
            } catch {
                msgBox.style.display = 'block'; msgBox.innerText = 'Network error. Please try again.';
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Request';
            }
        });
    }

    // 3. FORM LOGIC STARTS
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];
    const dateField = document.getElementById("date");
    if (dateField) dateField.value = formattedDate;

    function getCurrentTime(includeSeconds = false) {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        if (includeSeconds) {
            const seconds = String(now.getSeconds()).padStart(2, '0');
            return `${hours}:${minutes}:${seconds}`;
        }
        return `${hours}:${minutes}`;
    }

    // 💡 Generate and retrieve a unique device ID (based on localStorage).
    function getOrCreateDeviceId() {
        let deviceId = localStorage.getItem("deviceId");
        if (!deviceId) {
            deviceId = "device_" + Date.now() + Math.random().toString(36).substring(2, 9);
            localStorage.setItem("deviceId", deviceId);
        }
        return deviceId;
    }

    function getDeviceInfo() {
        const ua = navigator.userAgent;
        let browser = "Unknown Browser";
        if (ua.includes("Firefox/")) browser = "Firefox";
        else if (ua.includes("SamsungBrowser/")) browser = "Samsung Internet";
        else if (ua.includes("Opera") || ua.includes("OPR/")) browser = "Opera";
        else if (ua.includes("Trident/") || ua.includes("MSIE ")) browser = "Internet Explorer";
        else if (ua.includes("Edg/")) browser = "Edge";
        else if (ua.includes("Chrome/")) browser = "Chrome";
        else if (ua.includes("Safari/")) browser = "Safari";

        let os = "Unknown OS";
        if (ua.includes("Win")) os = "Windows";
        else if (ua.includes("Android")) os = "Android";
        else if (ua.includes("like Mac OS X")) os = "iOS";
        else if (ua.includes("Mac")) os = "MacOS";
        else if (ua.includes("Linux")) os = "Linux";

        return `${browser} on ${os}`;
    }

    // Assuming you have an 'inTime' field, setting outTime to current time is fine for an 'out' form
    // but the original code was setting outTime. Let's assume you want 'inTime' to be set here.
    // I'll correct the original code's variable use here, assuming 'inTime' is the field for the current time.
    // If you have a different ID for the field that should show the current time, please adjust.
    // The original code was: document.getElementById("outTime").value = getCurrentTime();
    // It's more likely this should be inTime for a check-in form, but I'll stick to the ID from the original.
    // Since the submit logic uses outTime, I'll update the ID to 'inTime' as is common for check-in time.
    // You should check your HTML field IDs. I am sticking to the provided code for now:
      const currentTime = getCurrentTime();
      const inTimeField = document.getElementById("inTime");
      const outTimeField = document.getElementById("outTime");
      if (inTimeField) inTimeField.value = currentTime; 
      if (outTimeField) outTimeField.value = currentTime; 

    if (registrationForm) {
        registrationForm.addEventListener("submit", (e) => e.preventDefault());
    }
    
    const submitButton = attendanceForm ? attendanceForm.querySelector('button[type="submit"]') : null; 

    let lastVerifiedConfidence = 1.0; 

    // Check if critical elements exist before proceeding with logic that relies on them
    if (!messageBox || !mainContainer || !loader || !loaderText || !captureBtn) {
        console.error("Critical UI elements (messageBox, loader, captureBtn) are missing. Logic disabled.");
        return;
    }

    if (submitButton) submitButton.disabled = true;

    // 🚀 NEW: PROACTIVE SECURE CONTEXT CHECK 🚀
    if (!window.isSecureContext) {
        const httpsWarning = document.createElement('div');
        httpsWarning.style.cssText = "background:#ff5252; color:white; padding:15px; text-align:center; position:fixed; top:0; left:0; right:0; z-index:10000; font-weight:bold; box-shadow:0 4px 10px rgba(0,0,0,0.3); font-family:sans-serif;";
        httpsWarning.innerHTML = `
            <i class="fas fa-lock-open"></i> INSECURE CONNECTION DETECTED<br>
            <span style="font-weight:normal; font-size:0.85rem;">
                Mobile browsers block Camera & Location on HTTP. 
                Please use <strong>HTTPS</strong> (e.g. https://...) to fix this.
            </span>
        `;
        document.body.prepend(httpsWarning);
        document.body.style.paddingTop = "60px";
    }

    const savedUser = JSON.parse(localStorage.getItem("userData"));
    const lastSubmission = JSON.parse(localStorage.getItem("lastSubmission"));
    const formZoomWrap = document.querySelector('.card-wrap');

    // ⭐ Loader display functions
    function showLoader(text) {
        loaderText.innerText = text;
        loader.style.display = "flex";
        mainContainer.style.display = "none"; // Hide the main content while the loader is running.
    }

    function hideLoader() {
        loader.style.display = "none";
        mainContainer.style.display = "block"; // Show the main content when the loader is removed.
    }
    
    // If old information is saved, then fill the fields and lock them.
    if (savedUser) {
        document.getElementById("name").value = savedUser.name;
        document.getElementById("mobile").value = savedUser.mobile;
        document.getElementById("email").value = savedUser.email;
        document.getElementById("name").disabled = true;
        document.getElementById("mobile").disabled = true;
        document.getElementById("email").disabled = true;
    }

    // If it has already been submitted today, then hide the form
     if (lastSubmission && lastSubmission.date === formattedDate) {
         messageBox.innerText = "You have already submitted today's attendance!✅";
         messageBox.style.display = "block";
         messageBox.classList.add("success");

         if (formZoomWrap) {
             formZoomWrap.style.display = "none";
         }
         if (attendanceForm) {
             attendanceForm.style.display = "none";
         }
         hideLoader(); 
         return;
     }

    // Allowed Geo-Locations
    const ALLOWED_LOCATIONS = [
        { lat: 21.13092947063975, lng: 79.11654813692904, radius: 100 }, // Tiranga Branch
        { lat: 21.115247212063938, lng: 79.01166670397053, radius: 100 },  // Bansi Branch
    ];

    // Distance formula (Haversine)
    function getDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    // 🟢 VALIDATION FUNCTION 🟢
    function validateForm(name, mobile, email, inTime, topic) {
        if (!name || !mobile || !email || !inTime || !topic) {
            return "⚠️ Please fill all fields before submitting!";
        }

        const nameRegex = /^[A-Za-z\s]+$/;
        if (!nameRegex.test(name)) {
            return "❌ Name should only contain letters and spaces.";
        }

        const mobileRegex = /^\d{10}$/;
        if (!mobileRegex.test(mobile)) {
            return "❌ Mobile number must be exactly 10 digits.";
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return "❌ Please enter a valid email address (e.g., user@example.com).";
        }

        return true;
    }
    
    
    // ====== ASK LOCATION ON PAGE LOAD (IMPROVED ERROR HANDLING) ======
    // (Location request moved to handleStartApp for user gesture compliance)



    // ====== MANUAL SUBMIT AFTER LOCATION ALLOWED ======
    if (attendanceForm) {
        attendanceForm.addEventListener("submit", function (e) {
            e.preventDefault();

            if (submitButton.disabled) {
                alert("❌ Submission is disabled. Check location message.");
                return;
            }

            const name = document.getElementById("name").value.trim();
            const mobile = document.getElementById("mobile").value.trim();
            const email = document.getElementById("email").value.trim();
            const date = document.getElementById("date").value;
            const inTime = document.getElementById("inTime").value.trim();
            const outTime = document.getElementById("outTime").value.trim();
            const topic = document.getElementById("topic").value.trim();
            const status = "Present"; // Simplified status

            const validationResult = validateForm(name, mobile, email, inTime, topic);

            if (validationResult !== true) {
                messageBox.innerText = validationResult;
                messageBox.style.display = "block";
                messageBox.classList.remove("success");
                messageBox.classList.add("error");
                return; 
            }
            
            // Clear previous error/success state
            messageBox.classList.remove("error", "success");

            const deviceId = getOrCreateDeviceId();
            const confidence = lastVerifiedConfidence;

            submitAttendance({ name, mobile, email, date, inTime, outTime, topic, status, deviceId, confidence });
        });
    }



    // (initCamera was moved to top of onload)


    let isLivenessActive = false;
    let livenessAttempts = 0;
    let MAX_LIVENESS_ATTEMPTS = 30; // ~18 seconds total
    let livenessInterval = null;

    function startLivenessSequence() {
        if (isLivenessActive) return;
        
        isLivenessActive = true;
        livenessAttempts = 0;
        livenessOverlay.style.display = 'flex';
        livenessOverlay.style.opacity = '1';
        livenessStatus.innerText = "PLEASE BLINK";
        livenessIcon.innerHTML = '<i class="fas fa-eye"></i>';
        livenessProgress.style.width = '0%';
        
        captureBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking Liveness...';
        captureBtn.disabled = true;

        async function checkLiveness() {
            if (!isLivenessActive) return;

            livenessAttempts++;
            const progress = (livenessAttempts / MAX_LIVENESS_ATTEMPTS) * 100;
            livenessProgress.style.width = `${progress}%`;

            if (livenessAttempts > MAX_LIVENESS_ATTEMPTS) {
                stopLivenessSequence("Liveness timeout. Please look at the camera and blink clearly.");
                return;
            }

            // Diagnostic: check if video is actually producing frames
            if (video.readyState < 2 || video.paused) {
                console.warn("Video not ready for capture. Current state:", video.readyState);
                video.play().catch(() => {});
                livenessStatus.innerText = "WAITING FOR CAMERA...";
                return;
            }

            // Capture frame for liveness
            const context = faceCanvas.getContext('2d');
            faceCanvas.width = video.videoWidth || 640;
            faceCanvas.height = video.videoHeight || 480;
            context.drawImage(video, 0, 0, faceCanvas.width, faceCanvas.height);
            const imageData = faceCanvas.toDataURL('image/jpeg', 0.5); 

            // If the image is just a black frame (mobile common issue), notify user
            const pixel = context.getImageData(faceCanvas.width/2, faceCanvas.height/2, 1, 1).data;
            if (pixel[0] === 0 && pixel[1] === 0 && pixel[2] === 0 && pixel[3] !== 0) {
                // Potential black frame
                livenessStatus.innerText = "ADJUSTING CAMERA...";
            } else {
                livenessStatus.innerText = "PLEASE BLINK";
            }

            try {
                const res = await fetch('/api/liveness_check', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: imageData })
                });
                const result = await res.json();

                if (result.blink) {
                    livenessStatus.innerText = "BLINK DETECTED!";
                    livenessIcon.innerHTML = '<i class="fas fa-check-circle" style="color:#4CAF50;"></i>';
                    livenessOverlay.style.background = 'rgba(76, 175, 80, 0.2)';
                    
                    setTimeout(() => {
                        stopLivenessSequence(null, true);
                        processFaceVerification(); 
                    }, 800);
                    return; // Stop recursion
                }
            } catch (err) {
                console.error("Liveness request error:", err);
            }

            // Recursive call for next frame
            if (isLivenessActive) {
                livenessInterval = setTimeout(checkLiveness, 600);
            }
        }

        checkLiveness();
    }

    function stopLivenessSequence(errorMsg, success = false) {
        if (livenessInterval) {
            clearTimeout(livenessInterval);
            livenessInterval = null;
        }
        isLivenessActive = false;
        
        if (!success) {
            livenessOverlay.style.display = 'none';
            captureBtn.disabled = false;
            captureBtn.innerHTML = '<i class="fas fa-camera"></i> Verify Face';
            if (errorMsg) alert(errorMsg);
        } else {
            // Keep overlay for a moment then hide
            setTimeout(() => {
                livenessOverlay.style.display = 'none';
                livenessOverlay.style.background = 'rgba(138,43,226,0.2)';
            }, 500);
        }
    }

    // Split click handler into a separate function for clean event management
    function handleCaptureClick() {
        const nameInput = document.getElementById("name");
        
        // Use session name if available (from auth portal)
        const sessionUser = JSON.parse(localStorage.getItem("userData"));
        if (sessionUser && sessionUser.name && !nameInput.value) {
            nameInput.value = sessionUser.name;
        }

        const name = nameInput.value.trim();

        const mobile = document.getElementById("mobile").value.trim();
        const email = document.getElementById("email").value.trim();

        if (mode === 'registration') {
            if (!name || !mobile || !email) {
                alert("Please enter your Name, Mobile, and Email before registering your face.");
                return;
            }
            // Simple regex validation
            if (!/^\d{10}$/.test(mobile)) {
                alert("Mobile number must be 10 digits.");
                return;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                alert("Please enter a valid email address.");
                return;
            }
        }

        // Phase 8B: Start liveness check before processing
        startLivenessSequence();
    }

    function processFaceVerification() {
        const nameInput = document.getElementById("name");
        const name = nameInput.value.trim();

        const context = faceCanvas.getContext('2d');
        faceCanvas.width = video.videoWidth;
        faceCanvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, faceCanvas.width, faceCanvas.height);
        
        // Get image data
        const imageData = faceCanvas.toDataURL('image/jpeg');
        
        const endpoint = mode === 'registration' ? '/register_face' : '/verify_face';
        const deviceId = getOrCreateDeviceId();
        const deviceInfo = getDeviceInfo();
        const payload = mode === 'registration' ? 
            { 
                image: imageData, 
                name: name, 
                mobile: document.getElementById("mobile").value.trim(),
                email: document.getElementById("email").value.trim(),
                deviceId: deviceId, 
                deviceInfo: deviceInfo 
            } : 
            { image: imageData, deviceId: deviceId, deviceInfo: deviceInfo };

        showLoader(mode === 'registration' ? "Registering Face..." : "Verifying Face...");
        
        fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(result => {
            hideLoader();
            if (result.success) {
                if (mode === 'registration') {
                    captureBtn.innerHTML = `<i class="fas fa-check"></i> Registered!`;
                    captureBtn.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
                    alert("Face registered successfully! You can now mark attendance.");
                    // Redirect to home page (attendance mode)
                    window.location.href = "/";
                } else {
                    lastVerifiedConfidence = result.confidence || 1.0;
                    const matchText = result.match_percentage ? ` (${result.match_percentage}%)` : '';
                    captureBtn.innerHTML = `<i class="fas fa-check"></i> Verified: ${result.name}${matchText}`;
                    captureBtn.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
                    captureBtn.disabled = true;
                    
                    if (messageBox.classList.contains("success") || messageBox.classList.contains("warning")) {
                        submitButton.disabled = false;
                    }
                    
                    if (result.name) {
                        nameInput.value = result.name;
                        nameInput.disabled = true;
                        
                        // Also update email if we have it in local storage (sync)
                        const sessionUser = JSON.parse(localStorage.getItem("userData"));
                        if (sessionUser && sessionUser.email) {
                            document.getElementById("email").value = sessionUser.email;
                            document.getElementById("email").disabled = true;
                        }
                    }
                }
            } else {
                const matchText = result.match_percentage ? ` [Match: ${result.match_percentage}%]` : '';
                captureBtn.innerHTML = `<i class="fas fa-redo"></i> ${mode === 'registration' ? 'Retry Registration' : 'Retry Verification'}`;
                
                // Phase 4: Show device request modal instead of plain error
                const isUnauthorized = result.message && (
                    result.message.toLowerCase().includes("unauthorized device") || 
                    result.message.toLowerCase().includes("security alert")
                );

                if (isUnauthorized) {
                    const modal = document.getElementById('device-request-modal');
                    if (modal) { modal.style.display = 'flex'; }
                    messageBox.innerHTML = `⚠️ <strong style="color: #ff5252;">SECURITY ALERT:</strong> Unauthorized device detected. <span style="color:#8a2be2; cursor:pointer; text-decoration:underline;" onclick="document.getElementById('device-request-modal').style.display='flex'">Request device change →</span>`;
                } else {
                    messageBox.innerText = `❌ ${mode === 'registration' ? 'Registration' : 'Verification'} Failed: ` + (result.message || "Unknown error") + matchText;
                }
                
                messageBox.style.display = "block";
                messageBox.classList.add("error");
                if (submitButton) submitButton.disabled = true;
            }
        })
        .catch(err => {
            hideLoader();
            console.error("Error:", err);
            captureBtn.innerHTML = '<i class="fas fa-redo"></i> Retry';
            alert("Network error during process.");
        });
    }

    function submitAttendance(data) {
        localStorage.setItem(
            "userData",
            JSON.stringify({
                name: data.name,
                mobile: data.mobile,
                email: data.email,
            })
        );

        showLoader("Submitting to Cloud...");
        messageBox.style.display = "none";
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

        const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzUQ9_tMbFP86YO6nI8feohNFQRQPtKPwGvOJqPZrwfbMznhSAURBfjUlKY_0u6IRfY/exec";
        
        // Add action field for Apps Script
        data.action = "attendance";

        fetch(APP_SCRIPT_URL, {
            method: "POST",
            // Use text/plain to avoid CORS preflight issues with Google Apps Script
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(data),
        })
            .then((res) => res.json())
            .then((result) => {
                hideLoader();
                submitButton.disabled = false;
                submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Attendance';

                if (result.success) {
                    localStorage.setItem(
                        "lastSubmission",
                        JSON.stringify({ date: data.date })
                    );
                    messageBox.innerText = result.message || "✅ Submitted Successfully! You cannot submit again today.";
                    messageBox.style.display = "block";
                    messageBox.classList.add("success");

                    if (formZoomWrap) {
                        formZoomWrap.style.display = "none";
                    }
                    attendanceForm.style.display = "none";

                } else {
                    messageBox.innerText = (result.message || result.error || "❌ Unknown Error Occurred.");
                    messageBox.style.display = "block";
                    messageBox.classList.add("error");
                }
            })
            .catch((err) => {
                hideLoader();
                submitButton.disabled = false;
                submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Attendance';
                console.error("Fetch Error:", err);
                messageBox.innerText =
                    "❌ Network error. Please check your connection and try again.";
                messageBox.style.display = "block";
                messageBox.classList.add("error");
            });
    }
};