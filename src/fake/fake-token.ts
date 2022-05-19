import express from 'express';
import * as jwt from 'jsonwebtoken';
import assert from 'assert';
import { getLogger } from '@nexteditorjs/nexteditor-core/dist/common';
import { TokenInfo } from '../types/common';

const logger = getLogger('fake');

const router = express.Router();

router.get('/:collectionId/:docId/token', (req, res) => {
  //
  const { userId, name, avatarUrl, permission } = req.query;
  const { collectionId, docId } = req.params;
  assert(typeof userId === 'string', 'userId is not string');
  assert(typeof name === 'string', 'name is not string');
  assert(typeof avatarUrl === 'string', 'avatarUrl is not string');
  assert(permission === 'w' || permission === 'r', `invalid permission, ${permission}`);
  //
  logger.warn(`generate fake token for ${userId} - ${name}`);
  //
  const tokenInfo: TokenInfo = {
    collectionId,
    docId,
    permission,
    userId,
    name,
    avatarUrl,
  };

  const EDITOR_KEY = process.env.EDITOR_KEY as string;
  assert(EDITOR_KEY, 'EDITOR_KEY is not set');

  const token = jwt.sign(tokenInfo, EDITOR_KEY, { expiresIn: '12h' });
  res.send({ token });
});

export default router;
