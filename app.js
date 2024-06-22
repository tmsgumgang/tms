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

    document.querySelectorAll('.signature-btn.save').forEach(button => {
        button.addEventListener('click', function() {
            const target = this.getAttribute('data-target');
            saveSignature(target);
        });
    });
});

function saveSignature(padId) {
    const canvas = document.getElementById(padId);
    const signaturePad = new SignaturePad(canvas);

    if (signaturePad.isEmpty()) {
        alert("서명이 없습니다.");
        return;
    }

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
    const parent = canvas.parentNode;
    const img = new Image();
    img.onload = function() {
        img.style.width = canvas.width + 'px';
        img.style.height = canvas.height + 'px';
        parent.replaceChild(img, canvas);
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
