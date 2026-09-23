/**
 * Valida variáveis de ambiente públicas do Lumo.
 * Útil em runtime no cliente/servidor para falhar cedo com mensagem clara.
 */
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórias. Copie .env.example para .env.local."
    );
  }

  if (
    url.includes("YOUR_PROJECT") ||
    url.includes("placeholder") ||
    anonKey.includes("YOUR_") ||
    anonKey.includes("placeholder")
  ) {
    throw new Error(
      "Configure as chaves reais do Supabase em .env.local (veja .env.example)."
    );
  }

  return { url, anonKey };
}

export function hasSupabaseEnv() {
  try {
    getSupabaseEnv();
    return true;
  } catch {
    return false;
  }
}
