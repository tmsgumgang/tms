document.addEventListener('DOMContentLoaded', () => {
    const { PDFDocument } = PDFLib;
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
            signaturePad.clear();
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

    document.getElementById('save-pdf').addEventListener('click', async () => {
        const form = document.getElementById('form');
        const formData = new FormData(form);

        const existingPdfBytes = await fetch('https://사용자명.github.io/리포지토리명/3.수질자동측정기기 현장확인서 양식.pdf').then(res => res.arrayBuffer());

        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];

        const formFields = {
            '사업장명': formData.get('사업장명'),
            '방류구번호': formData.get('방류구번호'),
            '시험일자': formData.get('시험일자'),
            'pH_모델명': formData.get('pH_모델명'),
            'pH_제작사': formData.get('pH_제작사'),
            'pH_제작국': formData.get('pH_제작국'),
            'TOC_모델명': formData.get('TOC_모델명'),
            'TOC_제작사': formData.get('TOC_제작사'),
            'TOC_제작국': formData.get('TOC_제작국'),
            'SS_모델명': formData.get('SS_모델명'),
            'SS_제작사': formData.get('SS_제작사'),
            'SS_제작국': formData.get('SS_제작국'),
            'TN_모델명': formData.get('TN_모델명'),
            'TN_제작사': formData.get('TN_제작사'),
            'TN_제작국': formData.get('TN_제작국'),
            'TP_모델명': formData.get('TP_모델명'),
            'TP_제작사': formData.get('TP_제작사'),
            'TP_제작국': formData.get('TP_제작국'),
            '유량계_모델명': formData.get('유량계_모델명'),
            '유량계_제작사': formData.get('유량계_제작사'),
            '유량계_제작국': formData.get('유량계_제작국'),
            '자동시료채취기_모델명': formData.get('자동시료채취기_모델명'),
            '자동시료채취기_제작사': formData.get('자동시료채취기_제작사'),
            '자동시료채취기_제작국': formData.get('자동시료채취기_제작국'),
            'DL_모델명': formData.get('DL_모델명'),
            'DL_버전': formData.get('DL_버전'),
            'FEP_모델명': formData.get('FEP_모델명'),
            'FEP_버전': formData.get('FEP_버전'),
            '시험특이사항': formData.get('시험특이사항')
        };

        for (const key in formFields) {
            if (formFields.hasOwnProperty(key)) {
                firstPage.drawText(formFields[key], {
                    x: 100, // 해당 필드의 x 위치
                    y: 100, // 해당 필드의 y 위치
                    size: 12,
                });
            }
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = '수질자동측정기기_현장확인서.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
});
