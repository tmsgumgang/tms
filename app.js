document.addEventListener('DOMContentLoaded', () => {
    const signaturePads = {};

    document.querySelectorAll(".signature-pad").forEach(canvas => {
        const signaturePad = new SignaturePad(canvas, {
            backgroundColor: 'rgb(255, 255, 255)'
        });
        signaturePads[canvas.id] = signaturePad;

        function resizeCanvas() {
            const data = signaturePad.toData(); // 서명 데이터를 임시로 저장합니다.
            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            canvas.width = canvas.offsetWidth * ratio;
            canvas.height = canvas.offsetHeight * ratio;
            canvas.getContext("2d").scale(ratio, ratio);
            signaturePad.clear(); // 캔버스 크기 변경 시 패드를 초기화합니다.
            if (data) {
                signaturePad.fromData(data);
            }
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
            signaturePad.fromDataURL(imgData);
        };
        img.src = imgData;
    }

    function clearSignature(padId) {
        const signaturePad = signaturePads[padId];
        signaturePad.clear();
        localStorage.removeItem(padId);
    }

    document.getElementById('save-pdf').addEventListener('click', async () => {
        const form = document.getElementById('form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        pdf.setFontSize(10);

        // Load the template image
        const img = new Image();
        img.src = 'path/to/your/template.png'; // 경로를 실제 이미지 경로로 변경하세요.
        await new Promise((resolve) => { img.onload = resolve; });

        // Add the template image to the PDF
        pdf.addImage(img, 'PNG', 0, 0, 210, 297); // Adjust width and height as necessary

        // 기본 정보
        pdf.text(data['사업장명'], 40, 37);
        pdf.text(data['방류구번호'], 140, 37);
        pdf.text(data['시험일자'], 40, 43);

        // 측정기 모델
        const startY = 58;
        const stepY = 8;
        let currentY = startY;

        const fields = ['pH', 'TOC', 'SS', 'TN', 'TP', '유량계', '자동시료채취기'];
        fields.forEach(field => {
            pdf.text(data[`${field}_모델명`], 22, currentY);
            pdf.text(data[`${field}_제작사`], 68, currentY);
            pdf.text(data[`${field}_제작국`], 108, currentY);
            currentY += stepY;
        });

        // 전송기 모델
        pdf.text(data['DL_모델명'], 22, currentY);
        pdf.text(data['DL_버전'], 68, currentY);
        currentY += stepY;

        pdf.text(data['FEP_모델명'], 22, currentY);
        pdf.text(data['FEP_버전'], 68, currentY);
        currentY += stepY;

        // 시험 종류
        const typesY = currentY + 10;
        if (data['통합시험']) {
            pdf.text('통합시험', 22, typesY);
        }
        if (data['확인검사']) {
            pdf.text('확인검사', 52, typesY);
        }
        if (data['상대정확도시험']) {
            pdf.text('상대정확도시험', 92, typesY);
        }

        pdf.text(data['시험특이사항'], 22, typesY + 10);

        // 서명
        const signatures = ['sign-pad1', 'sign-pad2', 'sign-pad3'];
        const yPositions = [187, 202, 217];

        for (let i = 0; i < signatures.length; i++) {
            const savedSignature = localStorage.getItem(signatures[i]);
            if (savedSignature) {
                const img = new Image();
                await new Promise((resolve) => {
                    img.onload = resolve;
                    img.src = savedSignature;
                });
                const imgProps = pdf.getImageProperties(img);
                const pdfWidth = 50;
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                pdf.addImage(savedSignature, 'PNG', 150, yPositions[i], pdfWidth, pdfHeight);
            }
        }

        const blob = pdf.output('blob');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '현장확인서.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
});
