export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function parseContractError(error: any): string {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  if (error.message) return error.message;
  if (error.reason) return error.reason;
  return "Transaction failed";
}

export function formatOG(amount: string | number | bigint): string {
  let num: number;
  if (typeof amount === "bigint") {
    num = Number(amount) / 1e18;
  } else if (typeof amount === "string") {
    num = parseFloat(amount);
  } else {
    num = amount;
  }
  return `${num.toFixed(4)} OG`;
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
}

export function formatCountdown(endTime: number): string {
  const now = Date.now();
  const diff = endTime - now;
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

export function avatarGradient(name: string | number): string {
  const gradients = [
    "from-pink-500 to-rose-500",
    "from-violet-500 to-purple-500",
    "from-blue-500 to-cyan-500",
    "from-emerald-500 to-green-500",
    "from-orange-500 to-amber-500",
  ];
  const index = String(name).charCodeAt(0) % gradients.length;
  return gradients[index];
}