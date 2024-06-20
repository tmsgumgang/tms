document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById("signatureModal");
    const canvas = document.getElementById("signatureCanvas");
    const ctx = canvas.getContext("2d");
    let signaturePad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)'
    });
    let currentPad = null;

    // 캔버스 크기 조정 함수
    function resizeCanvas() {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        // 캔버스 요소의 CSS 크기를 기준으로 크기 조정
        const width = canvas.offsetWidth;
        const height = canvas.offsetHeight;
        canvas.width = width * ratio;
        canvas.height = height * ratio;
        canvas.getContext("2d").scale(ratio, ratio);
        signaturePad.clear(); // 캔버스 크기 조정 후 서명을 초기화
    }

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas(); // 초기 로드 시 캔버스 크기 조정

    document.querySelectorAll(".signature-btn").forEach(button => {
        button.addEventListener("click", function () {
            currentPad = document.getElementById(this.dataset.target);
            modal.style.display = "block";
            resizeCanvas(); // 서명 창 열릴 때 캔버스 크기 조정
        });
    });

    document.querySelector(".close").addEventListener("click", function () {
        modal.style.display = "none";
        signaturePad.clear();
    });

    document.getElementById("saveSignature").addEventListener("click", function () {
        if (currentPad && !signaturePad.isEmpty()) {
            const imgData = signaturePad.toDataURL("image/png");
            const img = new Image();
            img.src = imgData;
            img.style.width = "100%";
            img.style.height = "100%";
            currentPad.innerHTML = "";
            currentPad.appendChild(img);
            modal.style.display = "none";
            signaturePad.clear();
        }
    });

    document.getElementById("clearSignature").addEventListener("click", function () {
        signaturePad.clear();
    });

    window.onclick = function (event) {
        if (event.target === modal) {
            modal.style.display = "none";
            signaturePad.clear();
        }
    };

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
            ["사업장", formData.get("사업장_부서"), formData.get("사업장_직위"), formData.get("사업장_성명")],
            ["유지관리 업체", formData.get("유지관리_업체"), formData.get("유지관리_부서"), formData.get("유지관리_직위"), formData.get("유지관리_성명")],
            ["관제센터", formData.get("관제센터_소속"), "충청권환경본부 환경서비스처 유역관리부", formData.get("관제센터_성명")]
        ];
        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 10,
            head: [["확인자", "부서", "직위", "성명"]],
            body: confirmers
        });

        // 서명 이미지를 추가하는 부분 수정
        document.querySelectorAll('.signature-pad').forEach((pad, index) => {
            const img = pad.querySelector('img');
            if (img) {
                const imgData = img.src;
                doc.addImage(imgData, 'PNG', 160, doc.lastAutoTable.finalY + 10 + (index * 30), 30, 15);
            }
        });

        doc.text("※ 이외에 관제센터에서의 사후 확인과정에서 추가로 문제점이 발견될 수 있습니다.", 10, doc.lastAutoTable.finalY + 20);

        doc.save("현장확인서.pdf");
    });
});
