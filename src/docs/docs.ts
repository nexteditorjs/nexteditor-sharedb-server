import path from 'path';
import { SimpleCache } from '@nexteditorjs/nexteditor-core/dist/common';
import fs from 'fs-extra';
import LokiDoc from './loki-doc';

export default class Docs {
  private docs = new SimpleCache<LokiDoc>(1000 * 60 * 3);

  constructor(private rootPath: string) {

  }

  async getDoc(connection: string, id: string) {
    const key = `${connection}/${id}`;
    const doc = this.docs.get(key, this.getDocByKey);
    return doc;
  }

  private getDocByKey = async (key: string): Promise<LokiDoc> => {
    const [collection, id] = key.split('/');
    const sub = id.substring(0, 2);
    const docPath = path.join(this.rootPath, collection, sub, id);
    await fs.mkdirp(docPath);
    const doc = await LokiDoc.getDoc(docPath, collection, id);
    return doc;
  };
}
