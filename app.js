document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll(".signature-pad").forEach(canvas => {
        const signaturePad = new SignaturePad(canvas, {
            backgroundColor: 'rgb(255, 255, 255)'
        });

        function resizeCanvas() {
            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            canvas.width = canvas.offsetWidth * ratio;
            canvas.height = canvas.offsetHeight * ratio;
            canvas.getContext("2d").scale(ratio, ratio);
            signaturePad.clear();
        }

        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();

        // Load signature if it exists
        loadSignature(canvas.id);
    });

    document.getElementById("save-pdf").addEventListener("click", function () {
        const doc = new jsPDF();
        const form = document.getElementById("form");
        const formData = new FormData(form);

        doc.text("수질자동측정기기 현장확인서", 105, 20, null, null, "center");
        doc.text("[WTMS-QI-101-02(rev.0)]", 105, 30, null, null, "center");

        const basicInfo = [
            ["사업장명", formData.get("사업장명"), "방류구번호", formData.get("방류구번호")],
            ["시험일자", formData.get("시험일자"), "", ""]
        ];
        doc.autoTable({
            startY: 40,
            head: [["항목", "내용", "항목", "내용"]],
            body: basicInfo
        });

        const measuringDeviceModels = [
            ["pH", formData.get("pH_모델명"), formData.get("pH_제작사"), formData.get("pH_제작국")],
            ["TOC", formData.get("TOC_모델명"), formData.get("TOC_제작사"), formData.get("TOC_제작국")],
            ["SS", formData.get("SS_모델명"), formData.get("SS_제작사"), formData.get("SS_제작국")],
            ["TN", formData.get("TN_모델명"), formData.get("TN_제작사"), formData.get("TN_제작국")],
            ["TP", formData.get("TP_모델명"), formData.get("TP_제작사"), formData.get("TP_제작국")],
            ["유량계", formData.get("유량계_모델명"), formData.get("유량계_제작사"), formData.get("유량계_제작국")],
            ["자동시료채취기", formData.get("자동시료채취기_모델명"), formData.get("자동시료채취기_제작사"), formData.get("자동시료채취기_제작국")]
        ];
        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 10,
            head: [["항목", "모델명", "제작사", "제작국"]],
            body: measuringDeviceModels
        });

        const transmitterModels = [
            ["D/L", formData.get("DL_모델명"), formData.get("DL_버전")],
            ["FEP", formData.get("FEP_모델명"), formData.get("FEP_버전")]
        ];
        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 10,
            head: [["항목", "모델명", "버전"]],
            body: transmitterModels
        });

        const testTypes = [
            ["통합시험", formData.get("통합시험") ? "O" : "X"],
            ["확인검사", formData.get("확인검사") ? "O" : "X"],
            ["상대정확도시험", formData.get("상대정확도시험") ? "O" : "X"],
            ["시험 특이사항", formData.get("시험특이사항")]
        ];
        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 10,
            head: [["항목", "내용"]],
            body: testTypes
        });

        const confirmers = [
            ["소속기관", "서명"]
        ];
        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 10,
            head: confirmers,
            body: [
                ["사업장", formData.get("사업장_성명")],
                ["유지관리 업체", formData.get("유지관리_성명")],
                ["관제센터", formData.get("관제센터_성명")]
            ]
        });

        document.querySelectorAll('.signature-pad').forEach((canvas, index) => {
            const imgData = canvas.toDataURL("image/png");
            doc.addImage(imgData, 'PNG', 160, doc.lastAutoTable.finalY + 10 + (index * 40), 40, 20);
        });

        doc.text("※ 이외에 관제센터에서의 사후 확인과정에서 추가로 문제점이 발견될 수 있습니다.", 10, doc.lastAutoTable.finalY + 20);

        doc.save("현장확인서.pdf");
    });
});

function saveSignature(padId) {
    const canvas = document.getElementById(padId);
    const signaturePad = new SignaturePad(canvas);
    const imgData = signaturePad.toDataURL("image/png");

    // 서버로 서명 데이터를 전송
    fetch('/save-signature', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            padId: padId,
            imgData: imgData
        })
    })
    .then(response => response.text())
    .then(data => {
        console.log(data);
        alert('서명이 저장되었습니다.');
        // 캔버스를 이미지로 변환하여 수정 불가능하게 함
        displaySignature(padId, imgData);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('서명 저장에 실패했습니다.');
    });
}

function loadSignature(padId) {
    const canvas = document.getElementById(padId);

    fetch(`/get-signature/${padId}`)
    .then(response => {
        if (response.ok) {
            return response.blob();
        }
        throw new Error('서명을 불러올 수 없습니다.');
    })
    .then(blob => {
        const img = new Image();
        img.onload = function() {
            displaySignature(padId, img.src);
        };
        img.src = URL.createObjectURL(blob);
    })
    .catch(error => {
        console.error('Error:', error);
        // 서명을 불러올 수 없을 때 팝업창 뜨지 않도록 함
    });
}

function displaySignature(padId, imgData) {
    const canvas = document.getElementById(padId);
    const context = canvas.getContext("2d");
    const img = new Image();
    img.onload = function() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = imgData;
}

function clearSignature(padId) {
    const canvas = document.getElementById(padId);
    const signaturePad = new SignaturePad(canvas);
    signaturePad.clear();

    // 서버에 저장된 서명 데이터 삭제
    fetch(`/save-signature/${padId}`, {
        method: 'DELETE'
    })
    .then(response => response.text())
    .then(data => {
        console.log(data);
        alert('서명이 삭제되었습니다.');
    })
    .catch(error => {
        console.error('Error:', error);
        alert('서명 삭제에 실패했습니다.');
    });
}
