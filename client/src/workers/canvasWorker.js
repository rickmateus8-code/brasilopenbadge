// worker.js (Blob Worker para processamento no Canvas)
self.onmessage = function(e) {
  const { imageData, type } = e.data;
  // Simulação de processamento pesado (OCR/Canvas)
  if (type === 'process') {
    // Aqui entra a lógica de processamento de imagem/OCR off-main-thread
    self.postMessage({ success: true, processed: true });
  }
};
