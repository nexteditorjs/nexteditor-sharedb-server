import './config';
import express from 'express';
import WebSocket from 'ws';
import http from 'http';
import { getLogger } from '@nexteditorjs/nexteditor-core/dist/common';
import yargs from 'yargs';
import ShareDB from 'sharedb';
import richText from '@nexteditorjs/nexteditor-core/dist/ot-types/rich-text';
import * as json1 from 'ot-json1';
import fakeRouter from './fake/fake-token';
import LokiDb from './db/loki-db';
import { dbPath } from './config/db-path';
import { addActions } from './actions';
import { initWebSocket } from './websocket';

const logger = getLogger('main');
const argv = yargs(process.argv.slice(2)).parse();

json1.type.registerSubtype(richText.type);
json1.type.name = 'ot-json1';
ShareDB.types.register(json1.type);

const backend = new ShareDB({
  db: new LokiDb(dbPath),
  presence: true,
  doNotForwardSendPresenceErrorsToClient: true,
});

addActions(backend);

const app = express();
const server = http.createServer(app);
const webSocketServer = new WebSocket.Server({ server });

if (argv.enableFakeToken) {
  logger.warn('Fake token is enabled');
  app.use('/fake', fakeRouter);
}

// init websocket
initWebSocket(webSocketServer, backend);

// start server
server.listen(8080);
