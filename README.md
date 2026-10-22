# Henry Wallet

A lightweight self-custody EVM stablecoin wallet built with React Native (Expo).

- **Networks**: Polygon, Ethereum, Avalanche (testnets: Polygon Amoy, Sepolia, Avalanche Fuji)
- **Assets**: USDC, JPYC (+ POL / ETH / AVAX for gas)
- **Features**: Create / Import, secure local key storage, balance, send / receive, QR, local transaction history

## Security model

- The recovery phrase never leaves the device (iOS Keychain / Android Keystore, this-device-only, Face ID to read).
- No backend, no custody. Transactions are signed locally and sent to a public RPC.
- No home-made cryptography: key derivation and signing use [ethers v6](https://docs.ethers.org/v6/).

## Development

```bash
pnpm install
pnpm start          # Metro for the development build
pnpm check          # lint + typecheck + test + format
```

The app runs as an Expo development build (`eas build --profile development --platform ios`), not in Expo Go.

Docs: [`docs/PROJECT.md`](docs/PROJECT.md) (spec), [`docs/ROADMAP.md`](docs/ROADMAP.md) (phases).

## Disclaimer

This is an experimental personal wallet built for learning. It has not been audited.
Use test networks or small amounts only. Do not store significant funds in it.
