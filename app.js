document.addEventListener('DOMContentLoaded', () => {
    const signaturePads = {};

    // Initialize signature pads
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

    document.getElementById('save-pdf').addEventListener('click', async function() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');

        // Add form data to PDF
        const formData = new FormData(document.getElementById('form'));
        let yPos = 20; // Start y position
        formData.forEach((value, key) => {
            if (key && value) {
                doc.text(`${key}: ${value}`, 10, yPos);
                yPos += 10;
            }
        });

        // Add signatures to PDF
        for (const [padId, signaturePad] of Object.entries(signaturePads)) {
            const imgData = localStorage.getItem(padId);
            if (imgData) {
                const img = new Image();
                img.src = imgData;
                await new Promise(resolve => {
                    img.onload = () => {
                        doc.addImage(img, 'PNG', 10, yPos, 50, 30); // Adjust the position and size
                        yPos += 40; // Adjust y position for the next signature
                        resolve();
                    };
                });
            }
        }

        // Save the PDF
        doc.save('현장확인서.pdf');
    });
});
