export const fmtBytes = b => b<1?`${(b*1024).toFixed(0)}B`:b<1024?`${b.toFixed(1)}KB`:`${(b/1024).toFixed(2)}MB`;
export const fmtChars = n => n<1000?`${n}c`: `${(n/1000).toFixed(1)}kc`;
export const safeSlice = (str, limit) => {
  if (!str) return "";
  const chars = Array.from(str);
  if (chars.length <= limit) return str;
  return chars.slice(0, limit).join("");
};

export const cleanMathText = (mathStr) => {
  if (typeof mathStr !== "string") return mathStr;
  let str = mathStr;
  str = str.replace(/\\text\{([^{}]+)\}/g, "$1");
  str = str
    .replace(/\\(?:quad|qquad)\b|\/quad\b/g, " ")
    .replace(/\\(?:dots|ldots|cdots)\b/g, "…")
    .replace(/\\times\b/g, "×")
    .replace(/\\cdot\b/g, "·")
    .replace(/\\le(?:q)?\b/g, "≤")
    .replace(/\\ge(?:q)?\b/g, "≥")
    .replace(/\\neq\b/g, "≠")
    .replace(/\\approx\b/g, "≈")
    .replace(/\\pm\b/g, "±")
    .replace(/\\infty\b/g, "∞")
    .replace(/\\div\b/g, "÷")
    .replace(/_\{([^{}]+)\}/g, "_$1")
    .replace(/\^\{([^{}]+)\}/g, "^$1");
  return str.trim();
};

export const formatSmartDashItems = (text) => {
  if (typeof text !== "string" || !text) return text;
  const lines = text.split("\n");
  const processedLines = [];

  for (let line of lines) {
    if (!line.trim() || line.trim().startsWith("```")) {
      processedLines.push(line);
      continue;
    }

    let formatted = line;

    // 1. Break sublist prefixes ending with colons/semicolons followed by dashes
    // e.g., "The plan includes: - Item A - Item B" or "Steps i.e.: - First - Second"
    formatted = formatted.replace(/([.:;!\]\)])\s*-\s+(?=[A-Za-z*`"'\\[{(])/g, "$1\n- ");

    // 2. Break inline prefix phrases that introduce sublists (e.g. "including:", "such as:", "i.e.", "e.g.") followed by a dash
    formatted = formatted.replace(/\b(including|such as|i\.e\.|e\.g\.|following|details|steps|overall|notes|summary)[:;]?\s*-\s+(?=[A-Za-z*`"'\\[{(])/gi, "$1:\n- ");

    // 3. Break bullet dashes between clause words and capitalized/formatted item titles
    // e.g. "Step title - Sub item title" or "First point - Second point"
    formatted = formatted.replace(/([a-zA-Z0-9_>)]+)\s+-\s+([A-Z*`"'\\[{(]|\d+\.)/g, "$1\n- $2");

    // 4. Break bullet dashes where a dash is preceded by space and followed by space + bullet item start
    formatted = formatted.replace(/(\S)\s+-\s+([a-zA-Z*`"'\\[{(][^-\n]{3,})/g, (match, prev, next) => {
      // Avoid splitting math range (2024 - 2026), single letter variables (x = y - 5), equations, or operators
      if (/^\d+$/.test(prev) && /^\d+/.test(next)) return match;
      if (prev.length === 1 && /^[a-zA-Z]$/.test(prev)) return match;
      if (prev === "-" || prev === "+" || prev === "=" || prev === "<" || prev === ">") return match;
      return prev + "\n- " + next;
    });

    processedLines.push(formatted);
  }

  return processedLines.join("\n");
};
