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
            
            // 캔버스 크기 변경 후 서명 다시 로드
            const savedSignature = localStorage.getItem(canvas.id);
            if (savedSignature) {
                displaySignature(canvas.id, savedSignature);
            } else {
                signaturePad.clear(); // 저장된 서명이 없으면 캔버스를 지웁니다.
            }
        }

        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();
        loadSignature(canvas.id);
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

        fetch('/save-signature', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ padId, imgData })
        })
        .then(response => response.text())
        .then(data => {
            alert('서명이 저장되었습니다.');
            localStorage.setItem(padId, imgData);
            displaySignature(padId, imgData);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('서명 저장에 실패했습니다.');
        });
    }

    function loadSignature(padId) {
        const savedSignature = localStorage.getItem(padId);
        if (savedSignature) {
            displaySignature(padId, savedSignature);
        } else {
            fetch(`/get-signature/${padId}`)
            .then(response => response.ok ? response.blob() : Promise.reject('서명을 불러올 수 없습니다.'))
            .then(blob => {
                const reader = new FileReader();
                reader.onloadend = function() {
                    const imgData = reader.result;
                    localStorage.setItem(padId, imgData);
                    displaySignature(padId, imgData);
                }
                reader.readAsDataURL(blob);
            })
            .catch(error => console.error('Error:', error));
        }
    }

    function displaySignature(padId, imgData) {
        const canvas = document.getElementById(padId);
        const signaturePad = signaturePads[padId];
        const ctx = canvas.getContext('2d');
        
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // 캔버스의 크기에 맞게 이미지를 그립니다.
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
