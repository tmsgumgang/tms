document.addEventListener('DOMContentLoaded', () => {
    const signaturePads = {};

    document.querySelectorAll(".signature-pad").forEach(canvas => {
        const signaturePad = new SignaturePad(canvas, {
            backgroundColor: 'rgb(255, 255, 255)'
        });
        signaturePads[canvas.id] = signaturePad;

        function resizeCanvas() {
            const data = signaturePad.toData();
            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            canvas.width = canvas.offsetWidth * ratio;
            canvas.height = canvas.offsetHeight * ratio;
            canvas.getContext("2d").scale(ratio, ratio);
            signaturePad.clear();
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

        // 제목
        pdf.setFontSize(16);
        pdf.text('수질자동측정기기 현장확인서', 105, 20, { align: 'center' });
        pdf.setFontSize(12);
        pdf.text('[WTMS-QI-101-02(rev.0)]', 105, 30, { align: 'center' });
        pdf.setFontSize(10);

        // 기본 정보
        pdf.text(`사업장명: ${data['사업장명']}`, 20, 40);
        pdf.text(`방류구번호: ${data['방류구번호']}`, 120, 40);
        pdf.text(`시험일자: ${data['시험일자']}`, 20, 50);

        // 측정기 모델
        pdf.text('측정기 모델', 20, 60);
        pdf.text(`pH: ${data['pH_모델명']} (${data['pH_제작사']}, ${data['pH_제작국']})`, 30, 70);
        pdf.text(`TOC: ${data['TOC_모델명']} (${data['TOC_제작사']}, ${data['TOC_제작국']})`, 30, 80);
        pdf.text(`SS: ${data['SS_모델명']} (${data['SS_제작사']}, ${data['SS_제작국']})`, 30, 90);
        pdf.text(`TN: ${data['TN_모델명']} (${data['TN_제작사']}, ${data['TN_제작국']})`, 30, 100);
        pdf.text(`TP: ${data['TP_모델명']} (${data['TP_제작사']}, ${data['TP_제작국']})`, 30, 110);
        pdf.text(`유량계: ${data['유량계_모델명']} (${data['유량계_제작사']}, ${data['유량계_제작국']})`, 30, 120);
        pdf.text(`자동시료채취기: ${data['자동시료채취기_모델명']} (${data['자동시료채취기_제작사']}, ${data['자동시료채취기_제작국']})`, 30, 130);

        // 전송기 모델
        pdf.text('전송기 모델', 20, 140);
        pdf.text(`D/L: ${data['DL_모델명']}, ${data['DL_버전']}`, 30, 150);
        pdf.text(`FEP: ${data['FEP_모델명']}, ${data['FEP_버전']}`, 30, 160);

        // 시험 종류
        pdf.text('시험 종류', 20, 170);
        let yPos = 180;
        if (data['통합시험']) pdf.text('☑ 통합시험', 30, yPos), yPos += 10;
        if (data['확인검사']) pdf.text('☑ 확인검사', 30, yPos), yPos += 10;
        if (data['상대정확도시험']) pdf.text('☑ 상대정확도시험', 30, yPos), yPos += 10;

        pdf.text(`시험특이사항: ${data['시험특이사항']}`, 20, yPos + 10);

        // 서명
        pdf.text('확인자 정보', 20, 220);
        const signatures = ['sign-pad1', 'sign-pad2', 'sign-pad3'];
        const titles = ['사업장', '유지관리 업체', '관제센터'];
        const yPositions = [230, 250, 270];

        for (let i = 0; i < signatures.length; i++) {
            const savedSignature = localStorage.getItem(signatures[i]);
            pdf.text(`${titles[i]}:`, 20, yPositions[i]);
            if (savedSignature) {
                pdf.addImage(savedSignature, 'PNG', 60, yPositions[i] - 10, 40, 20);
            }
        }

        pdf.text('※ 이외에 관제센터에서의 사후 확인과정에서 추가로 문제점이 발견될 수 있습니다.', 20, 290);

        pdf.save('수질자동측정기기_현장확인서.pdf');
    });
});
