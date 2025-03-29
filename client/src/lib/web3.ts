// Check if MetaMask is installed
export function isMetaMaskInstalled(): boolean {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
}

// Request account access
export async function connectMetaMask(): Promise<string> {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed. Please install MetaMask to connect your wallet.');
  }

  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    return accounts[0];
  } catch (error: any) {
    if (error.code === 4001) {
      // User rejected the request
      throw new Error('Please connect to MetaMask to continue.');
    } else {
      throw new Error('Error connecting to MetaMask: ' + error.message);
    }
  }
}

// Get current account
export async function getCurrentAccount(): Promise<string | null> {
  if (!isMetaMaskInstalled()) {
    return null;
  }

  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    return accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error('Error getting current account:', error);
    return null;
  }
}

// Listen for account changes
export function listenForAccountChanges(callback: (accounts: string[]) => void): void {
  if (isMetaMaskInstalled()) {
    window.ethereum.on('accountsChanged', callback);
  }
}

// Send transaction using MetaMask
export async function sendTransaction(params: {
  to: string;
  value: string; // Value in wei (hexadecimal)
}): Promise<string> {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed.');
  }

  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (accounts.length === 0) {
      throw new Error('Please connect to MetaMask first.');
    }

    const from = accounts[0];
    const transactionParameters = {
      from,
      to: params.to,
      value: params.value,
    };

    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [transactionParameters],
    });

    return txHash;
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('Transaction rejected by user.');
    } else {
      throw new Error('Error sending transaction: ' + error.message);
    }
  }
}

// Convert ETH to Wei
export function ethToWei(amount: number): string {
  // 1 ETH = 10^18 Wei
  const wei = BigInt(Math.round(amount * 1e18));
  return '0x' + wei.toString(16);
}

// Convert Wei to ETH
export function weiToEth(wei: string): number {
  // Remove 0x prefix if present
  const weiValue = wei.startsWith('0x') ? wei.slice(2) : wei;
  return parseInt(weiValue, 16) / 1e18;
}

// Add MetaMask typings to the window object
declare global {
  interface Window {
    ethereum: {
      isMetaMask: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}
