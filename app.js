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

    document.getElementById('save-pdf').addEventListener('click', () => {
        const form = document.getElementById('form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        let yOffset = 10;
        doc.setFontSize(12);
        
        // 기본 정보
        doc.text("기본 정보", 10, yOffset);
        yOffset += 10;
        doc.text(`사업장명: ${data['사업장명']}`, 10, yOffset);
        yOffset += 10;
        doc.text(`방류구번호: ${data['방류구번호']}`, 10, yOffset);
        yOffset += 10;
        doc.text(`시험일자: ${data['시험일자']}`, 10, yOffset);
        yOffset += 20;

        // 측정기 모델
        doc.text("측정기 모델", 10, yOffset);
        yOffset += 10;
        const fields = ['pH', 'TOC', 'SS', 'TN', 'TP', '유량계', '자동시료채취기'];
        fields.forEach(field => {
            doc.text(`${field} 모델명: ${data[`${field}_모델명`]}`, 10, yOffset);
            yOffset += 10;
            doc.text(`${field} 제작사: ${data[`${field}_제작사`]}`, 10, yOffset);
            yOffset += 10;
            doc.text(`${field} 제작국: ${data[`${field}_제작국`]}`, 10, yOffset);
            yOffset += 20;
        });

        // 전송기 모델
        doc.text("전송기 모델", 10, yOffset);
        yOffset += 10;
        const transmissionFields = ['DL', 'FEP'];
        transmissionFields.forEach(field => {
            doc.text(`${field} 모델명: ${data[`${field}_모델명`]}`, 10, yOffset);
            yOffset += 10;
            doc.text(`${field} 버전: ${data[`${field}_버전`]}`, 10, yOffset);
            yOffset += 20;
        });

        // 시험 종류
        doc.text("시험 종류", 10, yOffset);
        yOffset += 10;
        if (data['통합시험']) {
            doc.text("통합시험", 10, yOffset);
            yOffset += 10;
        }
        if (data['확인검사']) {
            doc.text("확인검사", 10, yOffset);
            yOffset += 10;
        }
        if (data['상대정확도시험']) {
            doc.text("상대정확도시험", 10, yOffset);
            yOffset += 10;
        }
        doc.text(`시험특이사항: ${data['시험특이사항']}`, 10, yOffset);
        yOffset += 20;

        // 서명
        const signatures = ['sign-pad1', 'sign-pad2', 'sign-pad3'];
        signatures.forEach((id, index) => {
            const savedSignature = localStorage.getItem(id);
            if (savedSignature) {
                const imgProps = doc.getImageProperties(savedSignature);
                const pdfWidth = 50;
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                doc.addImage(savedSignature, 'PNG', 10, yOffset, pdfWidth, pdfHeight);
                yOffset += pdfHeight + 10;
            }
        });

        // 추가 정보
        doc.text("추가 정보", 10, yOffset);
        yOffset += 10;
        doc.text("※ 이외에 관제센터에서의 사후 확인과정에서 추가로 문제점이 발견될 수 있습니다.", 10, yOffset);

        doc.save('현장확인서.pdf');
    });
});
