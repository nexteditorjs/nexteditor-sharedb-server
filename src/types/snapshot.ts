export class Snapshot {
  constructor(
    public id: string,
    public v: number,
    public type: string | null,
    public data?: unknown,
    public m?: {
      ctime?: number;
      mtime: number;
    },
  ) {
  }
}
