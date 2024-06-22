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
});

function saveSignature(padId) {
    const canvas = document.getElementById(padId);
    const signaturePad = new SignaturePad(canvas);

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
    .then(response => response.ok ? response.blob() : Promise.reject('서명을 불러올 수 없습니다.'))
    .then(blob => {
        const img = new Image();
        img.onload = () => displaySignature(padId, img.src);
        img.src = URL.createObjectURL(blob);
    })
    .catch(error => console.error('Error:', error));
}

function displaySignature(padId, imgData) {
    const canvas = document.getElementById(padId);
    const parent = canvas.parentNode;
    const img = new Image();
    img.onload = () => {
        img.style.width = `${canvas.width}px`;
        img.style.height = `${canvas.height}px`;
        parent.replaceChild(img, canvas);
    };
    img.src = imgData;
}

function clearSignature(padId) {
    const canvas = document.getElementById(padId);
    const signaturePad = new SignaturePad(canvas);
    signaturePad.clear();
}
