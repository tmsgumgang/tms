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
        pdf.text("수질자동측정기기 현장확인서", 105, 20, { align: 'center' });
        pdf.text("[WTMS-QI-101-02(rev.0)]", 105, 30, { align: 'center' });

        // 기본 정보
        pdf.text(`사업장명: ${data['사업장명']}`, 20, 50);
        pdf.text(`방류구번호: ${data['방류구번호']}`, 20, 60);
        pdf.text(`시험일자: ${data['시험일자']}`, 20, 70);

        // 측정기 모델
        pdf.text("측정기 모델", 20, 90);
        const fields = ['pH', 'TOC', 'SS', 'TN', 'TP', '유량계', '자동시료채취기'];
        let yPosition = 100;
        fields.forEach(field => {
            pdf.text(`${field}:`, 20, yPosition);
            pdf.text(`모델명: ${data[`${field}_모델명`]}`, 60, yPosition);
            pdf.text(`제작사: ${data[`${field}_제작사`]}`, 110, yPosition);
            pdf.text(`제작국: ${data[`${field}_제작국`]}`, 160, yPosition);
            yPosition += 10;
        });

        // 전송기 모델
        pdf.text("전송기 모델", 20, yPosition);
        yPosition += 10;
        const transmissionFields = ['DL', 'FEP'];
        transmissionFields.forEach(field => {
            pdf.text(`${field}:`, 20, yPosition);
            pdf.text(`모델명: ${data[`${field}_모델명`]}`, 60, yPosition);
            pdf.text(`버전: ${data[`${field}_버전`]}`, 110, yPosition);
            yPosition += 10;
        });

        // 시험 종류
        pdf.text("시험 종류", 20, yPosition);
        yPosition += 10;
        if (data['통합시험']) {
            pdf.text("통합시험", 20, yPosition);
            yPosition += 10;
        }
        if (data['확인검사']) {
            pdf.text("확인검사", 20, yPosition);
            yPosition += 10;
        }
        if (data['상대정확도시험']) {
            pdf.text("상대정확도시험", 20, yPosition);
            yPosition += 10;
        }
        pdf.text(`시험특이사항: ${data['시험특이사항']}`, 20, yPosition);
        yPosition += 20;

        // 서명
        const signatures = ['sign-pad1', 'sign-pad2', 'sign-pad3'];
        signatures.forEach(async (id, index) => {
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
                pdf.addImage(savedSignature, 'PNG', 20, yPosition, pdfWidth, pdfHeight);
                yPosition += pdfHeight + 10;
            }
        });

        // 추가 정보
        pdf.text("※ 이외에 관제센터에서의 사후 확인과정에서 추가로 문제점이 발견될 수 있습니다.", 20, yPosition);

        pdf.save('현장확인서.pdf');
    });
});
