// utils/colorHelper.js
export const getImageBrightness = (src, callback) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    
  
    img.onload = function () {
      const canvas = document.createElement('canvas');
      canvas.width = this.width;
      canvas.height = this.height;
  
      const ctx = canvas.getContext('2d');
      ctx.drawImage(this, 0, 0);
  
      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let data = imageData.data;
      let r, g, b, avg;
      let colorSum = 0;
  
      for (let x = 0, len = data.length; x < len; x += 4) {
        r = data[x];
        g = data[x + 1];
        b = data[x + 2];
        avg = Math.floor((r + g + b) / 3);
        colorSum += avg;
      }
  
      let brightness = Math.floor(colorSum / (img.width * img.height));
      callback(brightness);
    };
  };