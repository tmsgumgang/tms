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

        pdf.setFontSize(12);

        // 기본 정보
        pdf.text(data['사업장명'], 50, 30);
        pdf.text(data['방류구번호'], 140, 30);
        pdf.text(data['시험일자'], 50, 40);

        // 측정기 모델
        const fields = ['pH', 'TOC', 'SS', 'TN', 'TP', '유량계', '자동시료채취기'];
        let yPosition = 60;
        fields.forEach(field => {
            pdf.text(data[`${field}_모델명`], 50, yPosition);
            pdf.text(data[`${field}_제작사`], 100, yPosition);
            pdf.text(data[`${field}_제작국`], 150, yPosition);
            yPosition += 10;
        });

        // 전송기 모델
        pdf.text(data['DL_모델명'], 50, yPosition);
        pdf.text(data['DL_버전'], 100, yPosition);
        yPosition += 10;
        pdf.text(data['FEP_모델명'], 50, yPosition);
        pdf.text(data['FEP_버전'], 100, yPosition);
        yPosition += 20;

        // 시험 종류
        if (data['통합시험']) {
            pdf.text("통합시험", 50, yPosition);
            yPosition += 10;
        }
        if (data['확인검사']) {
            pdf.text("확인검사", 50, yPosition);
            yPosition += 10;
        }
        if (data['상대정확도시험']) {
            pdf.text("상대정확도시험", 50, yPosition);
            yPosition += 10;
        }
        pdf.text(data['시험특이사항'], 50, yPosition);
        yPosition += 20;

        // 서명
        const signatures = ['sign-pad1', 'sign-pad2', 'sign-pad3'];
        for (const id of signatures) {
            const savedSignature = localStorage.getItem(id);
            if (savedSignature) {
                const img = new Image();
                await new Promise((resolve) => {
                    img.onload = resolve;
                    img.src = savedSignature;
                });
                const imgProps = pdf.getImageProperties(img);
                const pdfWidth = 50;
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                pdf.addImage(savedSignature, 'PNG', 50, yPosition, pdfWidth, pdfHeight);
                yPosition += pdfHeight + 10;
            }
        }

        // 추가 정보
        pdf.text("※ 이외에 관제센터에서의 사후 확인과정에서 추가로 문제점이 발견될 수 있습니다.", 50, yPosition);

        pdf.save('현장확인서.pdf');
    });
});
