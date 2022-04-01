import Docs from '../docs/docs';

type BasicCallback = (err?: Error) => void;

class LokiDb {
  docs: Docs;

  constructor(dbPath: string) {
    this.docs = new Docs(dbPath);
  }

  close(callback?: BasicCallback): void {
    //
  }

  commit(collection: string, id: string, op: any, snapshot: any, options: any, callback: (...args: any[]) => any): void {
    this.docs.getDoc(collection, id).then((doc) => {
      const ret = doc.commit(op, snapshot, options);
      callback(null, ret);
    }).catch((err) => callback(err));
  }

  getOps(collection: string, id: string, from: number | null, to: number | null, options: any, callback: (...args: any[]) => any): void {
    this.docs.getDoc(collection, id).then((doc) => {
      const ret = doc.getOps(from, to, options);
      callback(null, ret);
    }).catch((err) => callback(err));
  }

  getSnapshot(collection: string, id: string, fields: any, options: any, callback: (...args: any[]) => any): void {
    this.docs.getDoc(collection, id).then((doc) => {
      const ret = doc.getSnapshot(fields, options);
      callback(null, ret);
    }).catch((err) => callback(err));
  }
}

export default LokiDb;
