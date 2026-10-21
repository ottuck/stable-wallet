// https://docs.expo.dev/guides/customizing-metro/
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// ethers가 쓰는 @noble/hashes 1.3.x는 browser 필드로 "./crypto"를 "./crypto.js"로 바꾸는데
// exports에는 "./crypto.js"가 없어 Metro가 매 번들마다 경고하고 같은 파일로 되돌아간다.
// 그 파일(globalThis.crypto를 쓰는 RN용 crypto.js)로 바로 보낸다.
const defaultResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@noble/hashes/crypto') {
    const root = context.originModulePath.match(/^(.*[\\/]@noble[\\/]hashes)[\\/]/);
    if (root) return { type: 'sourceFile', filePath: path.join(root[1], 'crypto.js') };
  }
  return (defaultResolve ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
