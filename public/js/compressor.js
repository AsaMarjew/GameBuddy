// compress profielfoto's

function compress() {
  const file = document.querySelector('#comp').files[0];
  if (!file) return;

  // als js beschikbaar is verander de form enctype zodat multer niet activeert
  const form = document.querySelector('form');
  form.setAttribute('enctype', 'application/x-www-form-urlencoded');

  // leest de image in als string
  const reader = new FileReader();
  reader.readAsDataURL(file);

  // activeert wanneer de data URL is ingelezen
  reader.onload = event => {
    // maak een nieuwe img element met de ulr encoded data van de image als src
    const imgEl = document.createElement('img');
    imgEl.src = event.target.result;

    imgEl.onload = e => {
      // maak een canvas met met een width van 150 en hoogte vanuit aspect ratio van de image berekend
      const canvas = document.createElement('canvas');
      const maxWidth = 150;
      const scaleSize = maxWidth / e.target.width;
      canvas.width = maxWidth;
      canvas.height = e.target.height * scaleSize;

      // geef aan dat de canvas 2D is en teken de image hierin
      const ctx = canvas.getContext('2d');
      ctx.drawImage(e.target, 0, 0, canvas.width, canvas.height);

      // converteer de content van het canvas naar image url met bestandstype jpeg en een compressie qualiteit van 1
      const srcEncoded = ctx.canvas.toDataURL('image/jpeg', 1);
      const imgOutput = document.getElementById('imgOutput');
      imgOutput.value = srcEncoded;
    };
  };
}
