// Loan amounts use whole pesos; keep the currency sign attached during editing.
const formatter = new Intl.NumberFormat('es-MX', {
  maximumFractionDigits: 0,
});

function numericText(input: string) {
  return input.trim().replace(/^\$\s*/, '').replace(/\s*MXN$/i, '').replace(/[\s,]/g, '');
}

export function formatCurrencyInput(value: number) {
  return `$${formatter.format(value)}`;
}

export function parseCurrencyInput(input: string) {
  const raw = numericText(input);
  if (!/^\d+$/.test(raw)) return NaN;
  return Number(raw);
}

/** Preserve selection while adding grouping separators during editing. */
export function formatCurrencyEdit(
  input: string,
  selectionStart = input.length,
  selectionEnd = selectionStart,
) {
  const raw = numericText(input);
  if (!/^\d*$/.test(raw)) return null;

  const text = `$${raw.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  const position = (offset: number) => {
    const significant = (input.slice(0, offset).match(/\d/g) ?? []).length;
    if (significant === 0) return 1;
    let count = 0;
    for (let index = 0; index < text.length; index += 1) {
      if (/\d/.test(text[index]) && ++count === significant) return index + 1;
    }
    return text.length;
  };

  return { text, selectionStart: position(selectionStart), selectionEnd: position(selectionEnd) };
}
