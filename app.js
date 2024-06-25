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

        const signatureData = signaturePad.toData();

        localStorage.setItem(padId, JSON.stringify(signatureData));

        fetch('/save-signature', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ padId, signatureData })
        })
        .then(response => response.text())
        .then(data => {
            alert('서명이 저장되었습니다.');
        })
        .catch(error => {
            console.error('Error:', error);
            alert('서명 저장에 실패했습니다.');
        });
    }

    function loadSignature(padId) {
        const savedSignature = localStorage.getItem(padId);
        if (savedSignature) {
            const signatureData = JSON.parse(savedSignature);
            displaySignature(padId, signatureData);
        } else {
            fetch(`/get-signature/${padId}`)
            .then(response => response.ok ? response.json() : Promise.reject('서명을 불러올 수 없습니다.'))
            .then(signatureData => {
                localStorage.setItem(padId, JSON.stringify(signatureData));
                displaySignature(padId, signatureData);
            })
            .catch(error => console.error('Error:', error));
        }
    }

    function displaySignature(padId, signatureData) {
        const signaturePad = signaturePads[padId];
        signaturePad.fromData(signatureData);
    }

    function clearSignature(padId) {
        const signaturePad = signaturePads[padId];
        signaturePad.clear();
        localStorage.removeItem(padId);
    }
});
