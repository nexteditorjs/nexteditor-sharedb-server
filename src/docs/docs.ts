import path from 'path';
import { getLogger, SimpleCache } from '@nexteditorjs/nexteditor-core/dist/common';
import fs from 'fs-extra';
import LokiDoc from './loki-doc';

const console = getLogger('docs');

export default class Docs {
  private docs = new SimpleCache<LokiDoc>(60 * 3); // 3 minutes

  constructor(private rootPath: string) {
    this.docs.on('delete', this.handleFreeDoc);
  }

  async getDoc(connection: string, id: string) {
    const key = `${connection}/${id}`;
    const doc = this.docs.get(key, this.getDocByKey);
    return doc;
  }

  private getDocByKey = async (key: string): Promise<LokiDoc> => {
    const [collection, id] = key.split('/');
    console.debug(`open doc: ${collection}/${id}`);
    const sub = id.substring(0, 2);
    const docPath = path.join(this.rootPath, collection, sub, id);
    await fs.mkdirp(docPath);
    const doc = await LokiDoc.getDoc(docPath, collection, id);
    return doc;
  };

  private handleFreeDoc = (doc: LokiDoc) => {
    console.debug(`close doc: ${doc.collection}/${doc.id}`);
  };
}
