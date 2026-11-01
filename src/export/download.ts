function baixarComLink(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

const ehCelular = () => typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;

/**
 * No celular, abre o compartilhamento do sistema com o arquivo (para mandar direto no WhatsApp)
 * quando `navigator.canShare({ files })` existe. Nos demais casos, baixa com um link blob:.
 * Devolve false se o usuário fechou o compartilhamento sem enviar.
 */
export async function baixar(blob: Blob, nome: string, texto?: string): Promise<boolean> {
  const arquivo = new File([blob], nome, { type: blob.type });
  if (ehCelular() && typeof navigator.canShare === "function" && navigator.canShare({ files: [arquivo] })) {
    try {
      await navigator.share({ files: [arquivo], title: nome, text: texto });
      return true;
    } catch (e) {
      // Usuário fechou a folha de compartilhamento: não baixar de novo.
      if (e instanceof DOMException && e.name === "AbortError") return false;
      // Outro erro (ex.: ativação do toque expirou): cai no download normal.
    }
  }
  baixarComLink(blob, nome);
  return true;
}

export function baixarTexto(texto: string, nome: string, tipo = "application/json") {
  baixarComLink(new Blob([texto], { type: tipo }), nome);
}
