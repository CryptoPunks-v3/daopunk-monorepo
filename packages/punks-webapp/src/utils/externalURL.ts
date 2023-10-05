export enum ExternalURL {
  discord,
  twitter,
  notion,
  discourse,
}

export const externalURL = (externalURL: ExternalURL) => {
  switch (externalURL) {
    case ExternalURL.discord:
      return 'https://discord.gg/daopunks';
    case ExternalURL.twitter:
      return 'https://twitter.com/daopunks';
    case ExternalURL.notion:
      return 'https://www.notion.so/CryptoPunks-DAO-Treasury-Docs-db000b97f1384807a27463ac496b24f6';
    case ExternalURL.discourse:
      return 'https://discourse.daopunks.wtf/';
  }
};
