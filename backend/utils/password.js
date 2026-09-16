var RULES = {
  length: 'at least 8 characters',
  lower: 'a lowercase letter',
  upper: 'an uppercase letter',
  digit: 'a number',
  special: 'a special character (e.g. !@#$%^&*)'
};

function validatePassword(value) {
  var pw = String(value == null ? '' : value);
  var missing = [];
  if (pw.length < 8) missing.push(RULES.length);
  if (!/[a-z]/.test(pw)) missing.push(RULES.lower);
  if (!/[A-Z]/.test(pw)) missing.push(RULES.upper);
  if (!/\d/.test(pw)) missing.push(RULES.digit);
  if (!/[^A-Za-z0-9]/.test(pw)) missing.push(RULES.special);
  if (missing.length) {
    return { ok: false, error: 'Password must include ' + missing.join(', ') + '.' };
  }
  return { ok: true };
}

module.exports = { validatePassword: validatePassword };