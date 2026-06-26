(() => {
  const parts = [
    "main.part1.js",
    "main.part2.js",
    "main.part3.js",
    "main.part4.js",
    "main.part5.js",
    "main.part6.js",
  ];

  Promise.all(parts.map((part) => fetch(part, { cache: "no-store" }).then((response) => {
    if (!response.ok) {
      throw new Error(`Falha ao carregar ${part}`);
    }
    return response.text();
  })))
    .then((chunks) => {
      (0, eval)(`${chunks.join("\n")}\n//# sourceURL=cobra-world-main.js`);
    })
    .catch((error) => {
      console.error(error);
      document.body.innerHTML = "<main style='min-height:100vh;display:grid;place-items:center;background:#111722;color:#f6f7d7;font:700 18px Courier New,monospace;text-align:center;padding:24px'>Nao foi possivel carregar o Cobra World. Atualize a pagina.</main>";
    });
})();
