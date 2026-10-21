import { errorCode, type WalletErrorCode } from '@/core/errors';

const MESSAGES: Record<WalletErrorCode | 'Unknown', string> = {
  InvalidAddress: '주소를 확인해 주세요.',
  InvalidAmount: '금액을 확인해 주세요.',
  InvalidMnemonic: '복구 문구가 올바르지 않습니다. 단어와 순서를 확인해 주세요.',
  InsufficientTokenBalance: '잔액이 부족합니다.',
  InsufficientGasBalance: '수수료(가스)로 쓸 잔액이 부족합니다.',
  RpcUnavailable: '네트워크에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.',
  GasEstimationFailed: '수수료를 계산하지 못했습니다.',
  SigningFailed: '서명하지 못했습니다.',
  BroadcastFailed: '전송하지 못했습니다.',
  TransactionReverted: '거래가 실패했습니다.',
  NetworkMismatch: '네트워크가 맞지 않습니다.',
  UnsupportedAsset: '지원하지 않는 자산입니다.',
  AuthCancelled: '인증이 취소되었습니다.',
  BiometricsUnavailable: 'Face ID(또는 기기 암호)를 설정한 뒤 다시 시도해 주세요.',
  WalletNotFound: '저장된 지갑이 없습니다.',
  WalletExists: '이미 지갑이 있습니다.',
  Unknown: '문제가 생겼습니다. 다시 시도해 주세요.',
};

export function errorMessage(error: unknown): string {
  return MESSAGES[errorCode(error)];
}
