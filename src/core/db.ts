// 이 설치에서 앱을 연 적이 있는지와 앱 설정(비민감 key-value). 저장은 platform(기기 SQLite, 웹 데모는 메모리)이 한다.
// 복구 문구·키는 절대 넣지 않는다.
export { getMeta, isInstalled, markInstalled, setMeta } from '../platform/services';
