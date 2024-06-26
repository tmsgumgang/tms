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

    const submitButton = document.getElementById('save-pdf');

    submitButton.addEventListener('click', async function() {
        const { PDFDocument } = PDFLib;

        // 여기에 템플릿 PDF의 경로를 넣으세요.
        const existingPdfBytes = await fetch('https://github.com/tmsgumgang/tms/raw/main/3.%EC%88%98%EC%A7%88%EC%9E%90%EB%8F%99%EC%B8%A1%EC%A0%95%EA%B8%B0%EA%B8%B0%20%ED%98%84%EC%9E%A5%ED%99%95%EC%9D%B8%EC%84%9C%20%EC%96%91%EC%8B%9D.pdf').then(res => res.arrayBuffer());

        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];

        const form = document.getElementById('form');
        const formElements = form.elements;

        firstPage.drawText(formElements['사업장명'].value, { x: 100, y: 700, size: 12 });
        firstPage.drawText(formElements['방류구번호'].value, { x: 300, y: 700, size: 12 });
        firstPage.drawText(formElements['시험일자'].value, { x: 100, y: 680, size: 12 });

        // 여기에 다른 폼 요소에 대한 코드를 추가합니다.
        // 예:
        firstPage.drawText(formElements['pH_모델명'].value, { x: 100, y: 660, size: 12 });
        firstPage.drawText(formElements['pH_제작사'].value, { x: 200, y: 660, size: 12 });
        firstPage.drawText(formElements['pH_제작국'].value, { x: 300, y: 660, size: 12 });

        // 서명 추가
        const signPad1Data = localStorage.getItem('sign-pad1');
        if (signPad1Data) {
            const signPad1Image = await pdfDoc.embedPng(signPad1Data);
            firstPage.drawImage(signPad1Image, { x: 100, y: 100, width: 100, height: 50 });
        }

        const pdfBytes = await pdfDoc.save();

        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = '현장확인서.pdf';
        link.click();
    });
});
