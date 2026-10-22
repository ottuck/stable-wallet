export type NetworkId =
  'polygon' | 'ethereum' | 'avalanche' | 'polygon-amoy' | 'sepolia' | 'avalanche-fuji';

export type NetworkConfig = {
  id: NetworkId;
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  native: { symbol: 'POL' | 'ETH' | 'AVAX'; decimals: 18 };
  testnet: boolean;
};

// 기본은 무료 공개 RPC(publicnode). EXPO_PUBLIC_RPC_*로 덮어쓴다 — 앱에 들어가므로 공개값이다.
// Expo는 process.env.EXPO_PUBLIC_*를 빌드 때 그대로 치환하므로 하나씩 적는다.
export const NETWORKS: Record<NetworkId, NetworkConfig> = {
  polygon: {
    id: 'polygon',
    chainId: 137,
    name: 'Polygon',
    rpcUrl: process.env.EXPO_PUBLIC_RPC_POLYGON || 'https://polygon-bor-rpc.publicnode.com',
    explorerUrl: 'https://polygonscan.com',
    native: { symbol: 'POL', decimals: 18 },
    testnet: false,
  },
  ethereum: {
    id: 'ethereum',
    chainId: 1,
    name: 'Ethereum',
    rpcUrl: process.env.EXPO_PUBLIC_RPC_ETHEREUM || 'https://ethereum-rpc.publicnode.com',
    explorerUrl: 'https://etherscan.io',
    native: { symbol: 'ETH', decimals: 18 },
    testnet: false,
  },
  avalanche: {
    id: 'avalanche',
    chainId: 43114,
    name: 'Avalanche',
    rpcUrl: process.env.EXPO_PUBLIC_RPC_AVALANCHE || 'https://avalanche-c-chain-rpc.publicnode.com',
    explorerUrl: 'https://snowtrace.io',
    native: { symbol: 'AVAX', decimals: 18 },
    testnet: false,
  },
  'polygon-amoy': {
    id: 'polygon-amoy',
    chainId: 80002,
    name: 'Polygon Amoy',
    rpcUrl:
      process.env.EXPO_PUBLIC_RPC_POLYGON_AMOY || 'https://polygon-amoy-bor-rpc.publicnode.com',
    explorerUrl: 'https://amoy.polygonscan.com',
    native: { symbol: 'POL', decimals: 18 },
    testnet: true,
  },
  sepolia: {
    id: 'sepolia',
    chainId: 11155111,
    name: 'Sepolia',
    rpcUrl: process.env.EXPO_PUBLIC_RPC_SEPOLIA || 'https://ethereum-sepolia-rpc.publicnode.com',
    explorerUrl: 'https://sepolia.etherscan.io',
    native: { symbol: 'ETH', decimals: 18 },
    testnet: true,
  },
  'avalanche-fuji': {
    id: 'avalanche-fuji',
    chainId: 43113,
    name: 'Avalanche Fuji',
    rpcUrl:
      process.env.EXPO_PUBLIC_RPC_AVALANCHE_FUJI ||
      'https://avalanche-fuji-c-chain-rpc.publicnode.com',
    explorerUrl: 'https://testnet.snowtrace.io',
    native: { symbol: 'AVAX', decimals: 18 },
    testnet: true,
  },
};

/** 빌드 하나는 테스트넷이나 메인넷 중 하나로만 동작한다(eas.json 프로필). */
export const isMainnet = process.env.EXPO_PUBLIC_NETWORK_MODE === 'mainnet';

export const activeNetworks: NetworkConfig[] = Object.values(NETWORKS).filter(
  (n) => n.testnet !== isMainnet,
);
