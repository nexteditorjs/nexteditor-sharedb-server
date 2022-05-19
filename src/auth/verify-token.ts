import * as jwt from 'jsonwebtoken';
import assert from 'assert';
import { TokenInfo } from '../types/common';

const EDITOR_KEY = process.env.EDITOR_KEY as string;
assert(EDITOR_KEY, 'EDITOR_KEY is not set');

export function verifyToken(token: string): TokenInfo {
  const user = jwt.verify(token, EDITOR_KEY, {}) as TokenInfo;
  return user;
}
