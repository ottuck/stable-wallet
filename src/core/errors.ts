export type WalletErrorCode =
  | 'InvalidAddress'
  | 'InvalidAmount'
  | 'InvalidMnemonic'
  | 'InsufficientTokenBalance'
  | 'InsufficientGasBalance'
  | 'RpcUnavailable'
  | 'GasEstimationFailed'
  | 'SigningFailed'
  | 'BroadcastFailed'
  | 'TransactionReverted'
  | 'NetworkMismatch'
  | 'UnsupportedAsset'
  | 'AuthCancelled'
  | 'BiometricsUnavailable'
  | 'WalletNotFound'
  | 'WalletExists';

/** 화면 문구는 code로 고른다. message·cause에 키나 복구 문구를 넣지 않는다. */
export class WalletError extends Error {
  constructor(
    readonly code: WalletErrorCode,
    options?: { cause?: unknown },
  ) {
    super(code, options);
    this.name = 'WalletError';
  }
}

export function errorCode(error: unknown): WalletErrorCode | 'Unknown' {
  return error instanceof WalletError ? error.code : 'Unknown';
}
