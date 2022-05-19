import { NextEditorJoinMessage } from '@nexteditorjs/nexteditor-sharedb/dist/messages';

export type UserPermission = 'w' | 'r';

export type TokenInfo = {
  collectionId: string;
  docId: string;
  permission: UserPermission;
  userId: string;
  name: string;
  avatarUrl: string;
};

export type AgentCustom = {
  tokenInfo: TokenInfo;
  joinMessage?: NextEditorJoinMessage;
};
