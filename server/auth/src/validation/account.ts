// Keep identical to client/src/validation/account.ts; account.test.cjs checks parity.
// Both applications build independently, including in Docker.
export const PASSWORD_HINT = 'Use pelo menos 15 caracteres. Prefira uma frase longa e exclusiva. Limite de 72 bytes (acentos e emojis ocupam mais de um byte).';
export const normalizeEmail = (value: string) => value.trim().toLowerCase();
export const normalizeName = (value: string) => value.normalize('NFC').trim().replace(/ +/g, ' ');
const unsafeText = /[\p{Cc}\p{Cf}<>]/u;

export function nameError(value: string): string | undefined {
  const name = normalizeName(value);
  if (name.length < 2 || name.length > 150) return 'Nome deve ter entre 2 e 150 caracteres';
  if (unsafeText.test(value) || !/\p{L}/u.test(name)) return 'Informe um nome válido, sem caracteres de controle ou marcação';
}

export function emailError(value: string): string | undefined {
  const email = normalizeEmail(value);
  if (email.length > 254 || !/^(?!\.)(?!.*\.\.)(?!.*\.@)([A-Za-z0-9_'+\-.]+)@([A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/.test(email) || email.split('@')[0].length > 64 || email.split('@')[1].split('.').some(label => label.length > 63)) {
    return 'Informe um e-mail válido, como nome@exemplo.com';
  }
}

export function passwordError(value: string, login = false): string | undefined {
  if (login) {
    // Existing credentials must not be subjected to the new signup policy.
    if (!value.length) return 'Senha é obrigatória';
    if (value.length > 1024) return 'Senha muito longa';
    return;
  }
  if (Array.from(value).length < 15) return 'Senha deve ter pelo menos 15 caracteres';
  if (new TextEncoder().encode(value).length > 72) return 'Senha deve ter no máximo 72 bytes';
  if (/\p{Cc}/u.test(value)) return 'Senha não pode conter caracteres de controle';
  if (new Set(value.replace(/\s/g, '').toLowerCase()).size < 4) return 'Evite senhas repetitivas ou compostas apenas por espaços';
}

export function profileError(value: string, label: string, max: number): string | undefined {
  if (value.trim().length > max) return `${label} deve ter no máximo ${max} caracteres`;
  if (unsafeText.test(value)) return `${label} contém caracteres inválidos`;
}
