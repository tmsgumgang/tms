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

        // 기본 정보
        pdf.text(data['사업장명'], 40, 30);
        pdf.text(data['방류구번호'], 140, 30);
        pdf.text(data['시험일자'], 40, 40);

        // 측정기 모델
        pdf.text(data['pH_모델명'], 20, 55);
        pdf.text(data['pH_제작사'], 70, 55);
        pdf.text(data['pH_제작국'], 120, 55);

        pdf.text(data['TOC_모델명'], 20, 65);
        pdf.text(data['TOC_제작사'], 70, 65);
        pdf.text(data['TOC_제작국'], 120, 65);

        pdf.text(data['SS_모델명'], 20, 75);
        pdf.text(data['SS_제작사'], 70, 75);
        pdf.text(data['SS_제작국'], 120, 75);

        pdf.text(data['TN_모델명'], 20, 85);
        pdf.text(data['TN_제작사'], 70, 85);
        pdf.text(data['TN_제작국'], 120, 85);

        pdf.text(data['TP_모델명'], 20, 95);
        pdf.text(data['TP_제작사'], 70, 95);
        pdf.text(data['TP_제작국'], 120, 95);

        pdf.text(data['유량계_모델명'], 20, 105);
        pdf.text(data['유량계_제작사'], 70, 105);
        pdf.text(data['유량계_제작국'], 120, 105);

        pdf.text(data['자동시료채취기_모델명'], 20, 115);
        pdf.text(data['자동시료채취기_제작사'], 70, 115);
        pdf.text(data['자동시료채취기_제작국'], 120, 115);

        // 전송기 모델
        pdf.text(data['DL_모델명'], 20, 125);
        pdf.text(data['DL_버전'], 70, 125);

        pdf.text(data['FEP_모델명'], 20, 135);
        pdf.text(data['FEP_버전'], 70, 135);

        // 시험 종류
        let yPos = 145;
        if (data['통합시험']) {
            pdf.text('통합시험', 20, yPos);
            yPos += 10;
        }
        if (data['확인검사']) {
            pdf.text('확인검사', 20, yPos);
            yPos += 10;
        }
        if (data['상대정확도시험']) {
            pdf.text('상대정확도시험', 20, yPos);
            yPos += 10;
        }

        pdf.text(data['시험특이사항'], 20, yPos + 10);

        // 서명
        const signatures = ['sign-pad1', 'sign-pad2', 'sign-pad3'];
        const yPositions = [180, 190, 200];

        for (let i = 0; i < signatures.length; i++) {
            const savedSignature = localStorage.getItem(signatures[i]);
            if (savedSignature) {
                const img = new Image();
                await new Promise((resolve) => {
                    img.onload = resolve;
                    img.src = savedSignature;
                });
                const imgProps = pdf.getImageProperties(img);
                const pdfWidth = 40;
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                pdf.addImage(savedSignature, 'PNG', 150, yPositions[i], pdfWidth, pdfHeight);
            }
        }

        pdf.save('현장확인서.pdf');
    });
});
