export const PASSWORD_MIN_LENGTH = 8;

export const passwordRegex = {
  hasLetter: /[a-zA-Z]/,
  hasNumber: /[0-9]/,
};

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push('Mat khau phai co it nhat 8 ky tu');
  }
  if (!passwordRegex.hasLetter.test(password)) {
    errors.push('Mat khau phai chua chu cai');
  }
  if (!passwordRegex.hasNumber.test(password)) {
    errors.push('Mat khau phai chua so');
  }

  return { valid: errors.length === 0, errors };
}
