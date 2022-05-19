import { TokenInfo } from '../types/common';

const RAINBOW_COUNT = 20;

export function userToRainbow(user: TokenInfo): number {
  let count = 0;
  for (let i = 0; i < user.userId.length; i++) {
    const ch = user.userId.charCodeAt(i);
    count += ch;
  }
  return count % RAINBOW_COUNT;
}
