/* ==================================================================
   SOPHIA — SERVIDOR ESTÁTICO LOCAL
   Serve index.html, css/ e script.js para desenvolvimento local.
   Não é uma API — o site não tem backend nesta etapa do projeto,
   conforme definido no PROJECT_BRIEF (site institucional estático).
   ================================================================== */
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve todos os arquivos estáticos da raiz do projeto
// (index.html, css/, script.js)
app.use(express.static(path.join(__dirname), {
  extensions: ['html']
}));

// Fallback: qualquer rota não encontrada volta para a home
// (site de página única, sem roteamento de backend)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`SophIA rodando em http://localhost:${PORT}`);
});
