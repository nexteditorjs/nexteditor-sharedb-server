const express = require('express');
const WebSocket = require('ws');
const ShareDB = require('sharedb');
const WebSocketJSONStream = require('@teamwork/websocket-json-stream');
const http = require('http');
const richText = require('@nexteditorjs/nexteditor-core/dist/ot-types/rich-text');
const json1 = require('ot-json1');

json1.type.registerSubtype(richText.type);
json1.type.name = 'ot-json1';
ShareDB.types.register(json1.type);

const app = express();
const server = http.createServer(app);
const webSocketServer = new WebSocket.Server({server: server});

const backend = new ShareDB();
webSocketServer.on('connection', (webSocket) => {
  var stream = new WebSocketJSONStream(webSocket);
  backend.listen(stream);
})

server.listen(8080);
