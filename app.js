document.addEventListener('DOMContentLoaded', () => {
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

    async function savePDF() {
        const form = document.getElementById('form');
        const data = new FormData(form);

        const pdfUrl = 'https://your-pdf-url-here.pdf'; // 업로드된 PDF 파일의 URL을 사용하세요.
        const existingPdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
        const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();

        // 기본 정보
        firstPage.drawText(data.get('사업장명') || '', { x: 130, y: height - 85, size: 12 });
        firstPage.drawText(data.get('방류구번호') || '', { x: 350, y: height - 85, size: 12 });
        firstPage.drawText(data.get('시험일자') || '', { x: 130, y: height - 105, size: 12 });

        // 측정기 모델 정보
        const models = ['pH', 'TOC', 'SS', 'TN', 'TP', '유량계', '자동시료채취기'];
        models.forEach((model, index) => {
            const offsetY = height - 155 - (index * 20);
            firstPage.drawText(data.get(`${model}_모델명`) || '', { x: 60, y: offsetY, size: 12 });
            firstPage.drawText(data.get(`${model}_제작사`) || '', { x: 200, y: offsetY, size: 12 });
            firstPage.drawText(data.get(`${model}_제작국`) || '', { x: 340, y: offsetY, size: 12 });
        });

        // 전송기 모델 정보
        firstPage.drawText(data.get('DL_모델명') || '', { x: 60, y: height - 335, size: 12 });
        firstPage.drawText(data.get('DL_버전') || '', { x: 200, y: height - 335, size: 12 });
        firstPage.drawText(data.get('FEP_모델명') || '', { x: 60, y: height - 355, size: 12 });
        firstPage.drawText(data.get('FEP_버전') || '', { x: 200, y: height - 355, size: 12 });

        // 시험 종류
        if (data.get('통합시험')) firstPage.drawText('✔', { x: 50, y: height - 375, size: 12 });
        if (data.get('확인검사')) firstPage.drawText('✔', { x: 150, y: height - 375, size: 12 });
        if (data.get('상대정확도시험')) firstPage.drawText('✔', { x: 250, y: height - 375, size: 12 });

        // 시험 특이사항
        firstPage.drawText(data.get('시험특이사항') || '', { x: 60, y: height - 395, size: 12, maxWidth: 450 });

        // 서명
        for (let i = 1; i <= 3; i++) {
            const padId = `sign-pad${i}`;
            const savedSignature = localStorage.getItem(padId);
            if (savedSignature) {
                const img = new Image();
                img.src = savedSignature;
                img.onload = () => {
                    const signatureImage = await pdfDoc.embedPng(savedSignature);
                    const signatureDims = signatureImage.scale(0.5);
                    firstPage.drawImage(signatureImage, {
                        x: 150,
                        y: height - (440 + (i * 40)),
                        width: signatureDims.width,
                        height: signatureDims.height,
                    });
                };
            }
        }

        const pdfBytes = await pdfDoc.save();
        download(pdfBytes, "현장확인서.pdf", "application/pdf");
    }

    document.getElementById('save-pdf').addEventListener('click', savePDF);

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
});
