export function initDashboardUI() {
    console.log("📺 Dashboard UI Initialized");
    // เซ็ตสถานะเริ่มต้นเป็น No Detection
    updateStatusUI('none');
}


export function updateStatusUI(status) {
    const badge = document.getElementById('status-badge'); // ตัวอักษรสถานะ
    const scanner = document.getElementById('scanner');   // เส้นเลเซอร์สแกน
    const videoContainer = document.querySelector('.video-container'); // กรอบวิดีโอ

    resetEffects(badge, videoContainer);

    switch (status) {
        case 'detecting':
            badge.innerText = "Detecting...";
            badge.classList.add('status-warning');
            scanner.style.display = "block"; 

        case 'leopard':
            badge.innerText = "Leopard Detected!";
            badge.classList.add('status-danger');
            scanner.style.display = "none"; 
            videoContainer.classList.add('leopard-detected');
            playAlertSound(); 
            break;

        case 'domestic':
            badge.innerText = "Domestic Animal";
            badge.classList.add('status-info');
            scanner.style.display = "none";
            break;

        default:
            
            badge.innerText = "No Detection";
            badge.classList.add('status-normal');
            scanner.style.display = "none";
            break;
    }
}

function resetEffects(badge, container) {
    badge.className = ""; 
    container.classList.remove('leopard-detected');
}

function playAlertSound() {
    const alertAudio = new Audio('assets/sounds/alert.mp3');
    alertAudio.play().catch(error => {
        console.log("Audio play blocked by browser. Interaction required.");
    });
}