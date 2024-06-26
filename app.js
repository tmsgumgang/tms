document.getElementById('upload').addEventListener('change', function (event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
        const img = new Image();
        img.src = e.target.result;
        img.onload = function () {
            const canvas = document.getElementById('template-canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
        };
    };
    reader.readAsDataURL(file);
});

document.getElementById('save-pdf').addEventListener('click', function () {
    const { jsPDF } = window.jspdf;

    const canvas = document.getElementById('template-canvas');
    const imgData = canvas.toDataURL('image/png');

    const doc = new jsPDF('p', 'mm', 'a4');

    // PDF 페이지에 이미지 추가
    doc.addImage(imgData, 'PNG', 0, 0, 210, 297);

    // 폼 데이터 추가
    const formData = new FormData(document.getElementById('form'));
    let yPos = 20;  // 시작 y 좌표
    formData.forEach((value, key) => {
        if (key && value) {
            doc.text(`${key}: ${value}`, 10, yPos);  // 적절한 위치와 스타일로 수정 필요
            yPos += 10;  // 다음 줄로 이동
        }
    });

    doc.save('현장확인서.pdf');
});

// Signature Pad 관련 코드
const signaturePads = {};

document.querySelectorAll(".signature-pad").forEach(canvas => {
    const signaturePad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)'
    });
    signaturePads[canvas.id] = signaturePad;

    function resizeCanvas() {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d").scale(ratio, ratio);
        signaturePad.clear(); // 캔버스 크기 변경 시 패드를 초기화합니다.
        loadSignature(canvas.id);
    }

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
});

document.querySelectorAll('.signature-btn.save').forEach(button => {
    button.addEventListener('click', function() {
        const target = this.getAttribute('data-target');
        saveSignature(target);
    });
});

document.querySelectorAll('.signature-btn.clear').forEach(button => {
    button.addEventListener('click', function() {
        const target = this.getAttribute('data-target');
        clearSignature(target);
    });
});

function saveSignature(padId) {
    const signaturePad = signaturePads[padId];

    if (signaturePad.isEmpty()) {
        alert("서명이 없습니다.");
        return;
    }

    const imgData = signaturePad.toDataURL("image/png");
    localStorage.setItem(padId, imgData);
    alert('서명이 저장되었습니다.');
}

function loadSignature(padId) {
    const savedSignature = localStorage.getItem(padId);
    if (savedSignature) {
        displaySignature(padId, savedSignature);
    }
}

function displaySignature(padId, imgData) {
    const canvas = document.getElementById(padId);
    const signaturePad = signaturePads[padId];
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        signaturePad._isEmpty = false;
    };
    img.src = imgData;
}

function clearSignature(padId) {
    const signaturePad = signaturePads[padId];
    signaturePad.clear();
    localStorage.removeItem(padId);
}
