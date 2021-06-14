function compress() {
  const file = document.querySelector('#comp').files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.readAsDataURL(file);

  reader.onload = event => {
    const imgEl = document.createElement('img');
    imgEl.src = event.target.result;

    imgEl.onload = e => {
      const canvas = document.createElement('canvas');
      const maxWidth = 150;
      const scaleSize = maxWidth / e.target.width;
      canvas.width = maxWidth;
      canvas.height = e.target.height * scaleSize;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(e.target, 0, 0, canvas.width, canvas.height);

      const srcEncoded = ctx.canvas.toDataURL('image/jpeg', 1);
      const input = document.getElementById('imgInput');
      input.value = srcEncoded;
    };
  };
}
