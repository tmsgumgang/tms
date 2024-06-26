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

    const templateImageBase64 = "data:image/png;base64,이미지의Base64코드"; // Base64 코드로 변환한 이미지 데이터를 포함하세요.

    document.getElementById('save-pdf').addEventListener('click', async () => {
        const button = document.getElementById('save-pdf');
        button.disabled = true; // Disable the button to prevent multiple clicks
        button.textContent = '처리 중...'; // Change the button text to indicate processing

        try {
            const form = document.getElementById('form');
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            pdf.setFontSize(10);

            // Add the template image to the PDF
            pdf.addImage(templateImageBase64, 'PNG', 0, 0, 210, 297); // Adjust width and height as necessary

            // Fill in the form data into the template
            pdf.text(data['사업장명'] || '', 42, 37);
            pdf.text(data['방류구번호'] || '', 162, 37);
            pdf.text(data['시험일자'] || '', 42, 43);

            // 측정기 모델
            const startY = 84;
            const stepY = 14;
            let currentY = startY;

            const fields = ['pH', 'TOC', 'SS', 'TN', 'TP', '유량계', '자동시료채취기'];
            fields.forEach(field => {
                pdf.text(data[`${field}_모델명`] || '', 52, currentY);
                pdf.text(data[`${field}_제작사`] || '', 112, currentY);
                pdf.text(data[`${field}_제작국`] || '', 172, currentY);
                currentY += stepY;
            });

            // 전송기 모델
            pdf.text(data['DL_모델명'] || '', 52, currentY);
            pdf.text(data['DL_버전'] || '', 112, currentY);
            currentY += stepY;

            pdf.text(data['FEP_모델명'] || '', 52, currentY);
            pdf.text(data['FEP_버전'] || '', 112, currentY);
            currentY += stepY;

            // 시험 종류
            const typesY = currentY + 20;
            if (data['통합시험']) {
                pdf.text('통합시험', 32, typesY);
            }
            if (data['확인검사']) {
                pdf.text('확인검사', 92, typesY);
            }
            if (data['상대정확도시험']) {
                pdf.text('상대정확도시험', 152, typesY);
            }

            pdf.text(data['시험특이사항'] || '', 42, typesY + 10);

            // 서명
            const signatures = ['sign-pad1', 'sign-pad2', 'sign-pad3'];
            const yPositions = [204, 220, 236];

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
                    pdf.addImage(savedSignature, 'PNG', 140, yPositions[i], pdfWidth, pdfHeight);
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
        } catch (error) {
            console.error("Error generating PDF:", error);
        }

        button.disabled = false;
        button.textContent = '제출';
    });
});
