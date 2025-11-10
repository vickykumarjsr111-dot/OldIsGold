// Normalizes Indian WhatsApp numbers by default (change '91' if needed)
export function toWhatsAppLink(rawNumber, message = "") {
  if (!rawNumber) return null;
  // keep digits only
  const digits = String(rawNumber).replace(/\D/g, "");
  // if number already starts with country code keep it; else prefix 91 (India)
  const withCC = digits.length >= 11 && digits.startsWith("91") ? digits : `91${digits}`;
  const text = encodeURIComponent(message || "");
  return `https://wa.me/${withCC}${text ? `?text=${text}` : ""}`;
}
