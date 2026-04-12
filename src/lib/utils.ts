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
  
  if (error.shortMessage) return error.shortMessage;
  if (error.reason) return error.reason;
  
  if (error.message) {
    const msg = error.message;
    if (msg.includes("execution reverted")) {
      if (error.data && typeof error.data === "string" && error.data.startsWith("0x")) {
        return decodeContractError(error.data) || "Execution reverted";
      }
      if (error.error?.data && typeof error.error.data === "string") {
        return decodeContractError(error.error.data) || "Execution reverted";
      }
      return "Execution reverted";
    }
    if (msg.startsWith("0x")) {
      return decodeContractError(msg) || "Transaction failed";
    }
    return msg;
  }
  
  if (error.error) {
    return parseContractError(error.error);
  }
  
  if (error.data && typeof error.data === "string" && error.data.startsWith("0x")) {
    return decodeContractError(error.data) || "Transaction failed";
  }
  
  return "Transaction failed";
}

function decodeContractError(hexData: string): string | null {
  try {
    if (hexData.length < 10) return null;
    const selector = hexData.slice(0, 10);
    const KNOWN_ERRORS: Record<string, string> = {
      "0x08c379a0": "Error(string)",
      "0x4e487b71": "Panic(uint256)",
    };
    if (KNOWN_ERRORS[selector]) {
      if (selector === "0x08c379a0") {
        const data = hexData.slice(10);
        const offset = parseInt(data.slice(0, 64), 16);
        const length = parseInt(data.slice(offset * 2, offset * 2 + 64), 16);
        const message = hexData.slice((offset * 2) + 64, (offset * 2) + 64 + (length * 2));
        const decoded = Buffer.from(message, "hex").toString("utf8");
        return decoded;
      }
      if (selector === "0x4e487b71") {
        const panicCode = parseInt(hexData.slice(10, 74), 16);
        const PANIC_CODES: Record<number, string> = {
          0x00: "Generic compiler panic",
          0x01: "Assert failed",
          0x11: "Arithmetic overflow",
          0x12: "Division by zero",
          0x21: "Invalid enum value",
          0x22: "Storage access out of bounds",
          0x31: "Empty array pop",
          0x32: "Array index out of bounds",
          0x41: "Memory allocation failed",
          0x51: "Invalid internal function call",
        };
        return PANIC_CODES[panicCode] || `Panic(${panicCode})`;
      }
    }
    const customErrors: Record<string, string> = {
      "0x1c3e7a2e": "AgentAlreadyRegistered",
      "0xf4e9a3c5": "AgentNotFound",
      "0x7a2b1c4d": "Unauthorized",
      "0x3c5d8e1f": "InvalidSkill",
      "0x8e2a4f7b": "ProfileNotFound",
      "0x9c1b3d5e": "UserNotRegistered",
      "0x2e8f4a1c": "RateTooLow",
    };
    if (customErrors[selector]) {
      return customErrors[selector];
    }
    return null;
  } catch {
    return null;
  }
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