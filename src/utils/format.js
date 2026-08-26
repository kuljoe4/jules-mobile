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
  return mathStr.replace(/\\text\{([^{}]+)\}/g, "$1");
};
