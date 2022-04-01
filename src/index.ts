import express from 'express';
import WebSocket from 'ws';
import ShareDB from 'sharedb';
import WebSocketJSONStream from '@teamwork/websocket-json-stream';
import http from 'http';
import { genId, getLogger } from '@nexteditorjs/nexteditor-core/dist/common';
import richText from '@nexteditorjs/nexteditor-core/dist/ot-types/rich-text';
import { NextEditorCustomMessage, NextEditorJoinMessage, NextEditorUser, NextEditorWelcomeMessage } from '@nexteditorjs/nexteditor-sharedb/dist/messages';
import * as json1 from 'ot-json1';
import path from 'path';
import assert from 'assert';
import LokiDb from './db/loki-db';

const console = getLogger('main');

json1.type.registerSubtype(richText.type);
json1.type.name = 'ot-json1';
ShareDB.types.register(json1.type);

const app = express();
const server = http.createServer(app);
const webSocketServer = new WebSocket.Server({ server });

const users = [
  {
    userId: 'user-1',
    name: 'Bruce',
    avatarUrl: '',
  },
  {
    userId: 'user-2',
    name: 'Steve',
    avatarUrl: '',
  },
  {
    userId: 'user-3',
    name: 'James',
    avatarUrl: '',
  },
];

class OnlineUsers {
  private users = new Map<string, Map<string, NextEditorUser> >();

  addUser(presenceChannel: string, user: NextEditorUser) {
    const users = this.users.get(presenceChannel);
    if (users) {
      users.set(user.clientId, user);
    } else {
      const newUsers = new Map<string, NextEditorUser>();
      newUsers.set(user.clientId, user);
      this.users.set(presenceChannel, newUsers);
    }
  }

  removeUser(presenceChannel: string, clientId: string) {
    const users = this.users.get(presenceChannel);
    if (!users) return;
    users.delete(clientId);
  }

  getOnlineUsers(presenceChannel: string) {
    const users = this.users.get(presenceChannel);
    if (!users) return [];
    return Array.from(users.values());
  }
}

const onlineUsers = new OnlineUsers();

function getRandomUser(token: string) {
  const n = [...token].reduce((p, c) => p + c.charCodeAt(0), 0);
  return users[n % users.length];
}

async function sendInitMessage(stream: WebSocketJSONStream, token: string) {
  const user: NextEditorUser = {
    ...getRandomUser(token),
    clientId: genId(),
  };
  const message: NextEditorCustomMessage = {
    nexteditor: 'init',
    user,
  };
  // eslint-disable-next-line no-param-reassign
  return new Promise<void>((resolve, reject) => {
    stream.ws.send(JSON.stringify(message), (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function sendWelcomeMessage(stream: WebSocketJSONStream, presenceChannel: string) {
  const message: NextEditorWelcomeMessage = {
    nexteditor: 'welcome',
    onlineUsers: onlineUsers.getOnlineUsers(presenceChannel),
  };
  // eslint-disable-next-line no-param-reassign
  return new Promise<void>((resolve, reject) => {
    stream.ws.send(JSON.stringify(message), (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

const dbPath = path.join(__dirname, '../data');

const backend = new ShareDB({
  db: new LokiDb(dbPath),
  presence: true,
  doNotForwardSendPresenceErrorsToClient: true,
});

webSocketServer.on('connection', async (webSocket, req) => {
  const token = req.headers['sec-websocket-protocol'] as string ?? '';
  // verify token
  const stream = new WebSocketJSONStream(webSocket);
  try {
    await sendInitMessage(stream, token);
    backend.listen(stream, req);
  } catch (err) {
    webSocket.close();
  }
});

backend.use('receivePresence', (context, next) => {
  // Do something with the context
  const data = context.presence.p;
  if (data === null) {
    const message = context.agent.custom as NextEditorJoinMessage;
    console.debug(`${message.user.name} [${message.user.clientId}] leave`);
    onlineUsers.removeUser(context.presence.ch, message.user.clientId);
  } else if (data.nexteditor === 'join') {
    //
    const message = data as NextEditorJoinMessage;
    //
    const old = context.agent.custom as NextEditorJoinMessage;
    if (old && old.user) {
      if (old.user.clientId === message.user.clientId) {
        console.debug(`resent join message, ${message.user.name} ${message.user.clientId} to new client`);
      } else {
        console.error(`invalid resent join message, from ${old.user.name} ${old.user.clientId} to ${message.user.name} ${message.user.clientId}`);
      }
    } else {
      console.debug(`${message.user.name} [${message.user.clientId}] join`);
      context.agent.custom = data;
      onlineUsers.addUser(context.presence.ch, message.user);
      sendWelcomeMessage(context.agent.stream as WebSocketJSONStream, context.presence.ch);
    }
  }
  next();
});

server.listen(8080);
