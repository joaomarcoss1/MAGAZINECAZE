export function safeReturnPath(path?: string | null) {
  return path?.startsWith("/") && !path.startsWith("//") && !Array.from(path).some((char) => char === "\\" || char.charCodeAt(0) <= 32)
    ? path : "/conta";
}
