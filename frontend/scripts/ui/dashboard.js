export function initDashboardUI() {
    console.log("📺 Dashboard UI Initialized");
    updateStatusUI('none');
}

export function updateStatusUI(status) {
    const badge = document.getElementById('status-badge');
    const scanner = document.getElementById('scanner');
    const videoContainer = document.querySelector('.video-container');

    // ป้องกันการ Error ถ้าหา Element ไม่เจอ
    if (!badge || !videoContainer) {
        console.warn("⚠️ Required UI elements not found!");
        return; 
    }

    resetEffects(badge, videoContainer);

    switch (status) {
        case 'detecting':
            badge.innerText = "Detecting...";
            badge.classList.add('status-warning');
            if (scanner) scanner.style.display = "block"; // เช็คก่อนเปลี่ยน style
            break; // ต้องมี break ตรงนี้!

        case 'leopard':
            badge.innerText = "Leopard Detected!";
            badge.classList.add('status-danger');
            if (scanner) scanner.style.display = "none"; 
            videoContainer.classList.add('leopard-detected');
            playAlertSound(); 
            break;

        case 'domestic':
            badge.innerText = "Domestic Animal";
            badge.classList.add('status-info');
            if (scanner) scanner.style.display = "none";
            break;

        default:
            badge.innerText = "No Detection";
            badge.classList.add('status-normal');
            if (scanner) scanner.style.display = "none";
            break;
    }
}

function resetEffects(badge, container) {
    if (badge) badge.className = "status-badge"; // รักษา class พื้นฐานไว้
    if (container) container.classList.remove('leopard-detected');
}

function playAlertSound() {
    // ใส่ path ให้ถูกตามโครงสร้างโฟลเดอร์ของคุณ
    const alertAudio = new Audio('/assets/sounds/alert.mp3'); 
    alertAudio.play().catch(error => {
        // บราวเซอร์มักจะบล็อกเสียงถ้าเรายังไม่เคยคลิกอะไรในหน้าเว็บ
        console.log("🔊 Sound ready (waiting for user interaction)");
    });
}