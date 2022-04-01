import path from 'path';
import Loki from 'lokijs';
import { Snapshot } from '../types/snapshot';

class LokiDoc {
  db: Loki;

  private opsCollection: Loki.Collection | null = null;

  private snapshotsCollection: Loki.Collection | null = null;

  private constructor(
    public dbPath: string,
    public collection: string,
    public id: string,
    autoloadCallback: (err?: Error) => void,
  ) {
    this.db = new Loki(dbPath, {
      autoload: true,
      autoloadCallback,
      autosave: true,
      autosaveInterval: 100,
    });
  }

  private init() {
    const createCollection = (colName: string) => {
      if (this.db.getCollection(colName) == null) this.db.addCollection(colName);
    };
    createCollection('ops');
    createCollection('snapshots');
  }

  static async getDoc(dbPath: string, collection: string, id: string): Promise<LokiDoc> {
    const dbFilePath = path.join(dbPath, 'doc.loki');
    const promise = new Promise<LokiDoc>((resolve, reject) => {
      const db = new LokiDoc(dbFilePath, collection, id, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve(db);
        }
      });
    });
    //
    const db = await promise;
    db.init();
    return db;
  }

  private getOpsCollection() {
    if (this.opsCollection) return this.opsCollection;
    this.opsCollection = this.db.getCollection('ops');
    return this.opsCollection;
  }

  private getSnapshotsCollection() {
    if (this.snapshotsCollection) return this.snapshotsCollection;
    this.snapshotsCollection = this.db.getCollection('snapshots');
    return this.snapshotsCollection;
  }

  commit(op: any, snapshot: Snapshot, options: any): boolean {
    const collection = this.collection;
    const id = this.id;
    const version = this._getOpVer();
    if (snapshot.v !== version + 1) {
      return false;
    }
    //
    const createSnapshot = () => {
      const exists = this.getSnapshotsCollection().findOne({ $and: [{ collection }, { id }] });
      if (exists !== null) {
        const newDoc = {
          ...exists,
          ver: snapshot.v,
          mtime: snapshot.m!.mtime,
          atime: Date.now(),
          data: snapshot.data,
        };
        //
        this.getSnapshotsCollection().update(newDoc);
        return true;
      }
      //
      const obj = {
        collection,
        id,
        ver: snapshot.v,
        type: snapshot.type,
        mtime: snapshot.m!.mtime,
        ctime: snapshot.m!.ctime!,
        atime: Date.now(),
        data: snapshot.data,
        deleted: false,
      };
      this.getSnapshotsCollection().insert(obj);
      return true;
    };

    const createOp = () => {
      const ver = op.v;
      const one = this.getOpsCollection().findOne({ $and: [{ collection }, { id }, { ver }] });
      if (one !== null) {
        return false;
      }
      this.getOpsCollection().insert({
        collection,
        id,
        ver,
        op,
        ctime: Date.now(),
      });
      return true;
    };
    //
    if (!createOp()) {
      return false;
    }
    if (!createSnapshot()) {
      return false;
    }
    //
    return true;
  }

  getOps(from: number | null, to: number | null, options: any): any[] {
    const collection = this.collection;
    const id = this.id;
    let rets;
    if (to != null) {
      rets = this.getOpsCollection().find({ $and: [{ collection }, { id }, { ver: { $gte: from } }, { ver: { $lt: to } }] });
    } else {
      rets = this.getOpsCollection().find({ $and: [{ collection }, { id }, { ver: { $gte: from } }] });
    }
    const ops = rets.map((r) => r.op);
    return ops;
  }

  getSnapshot(fields: any, options: any): Snapshot {
    const collection = this.collection;
    const id = this.id;
    const results = this.getSnapshotsCollection().find({ $and: [{ collection }, { id }] });
    if (results.length === 0) {
      return new Snapshot(id, 0, null, undefined, undefined);
    }
    if (results.length !== 1) {
      throw new Error('multi snapshots founded');
    }
    const row = results[0];
    return new Snapshot(id, row.ver, row.type, row.data, {
      ctime: row.ctime,
      mtime: row.mtime,
    });
  }

  private _getOpVer(): number {
    const collection = this.collection;
    const id = this.id;
    const rows = this.getOpsCollection().find({ $and: [{ collection }, { id }] });
    if (rows.length === 0) {
      return 0;
    }
    //
    let ver = 0;
    rows.forEach((row) => { ver = Math.max(row.op.v, ver); });
    return ver + 1;
  }
}

export default LokiDoc;
