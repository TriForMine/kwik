import { exists, msgpack } from "./deps.ts";
import { Kwik } from "./kwik.ts";

export class KwikTable<T> {
  private tableName: string;
  private kwik: Kwik;

  constructor(kwik: Kwik, tableName: string) {
    this.kwik = kwik;
    this.tableName = tableName;

    this.kwik.tables.set(tableName, this);
  }

  /** Saves the provided document as a file */
  private async saveFile(id: string, data: Partial<T>) {
    return await Deno.writeFile(
      `${this.kwik.directoryPath}${this.tableName}/${id}.kwik`,
      msgpack.encode(data, { extensionCodec: this.kwik.msgpackExtensionCodec }),
    );
  }

  /** Create a document with the provided data */
  async create(id: string, data: Partial<T> = {}) {
    if (await this.has(id)) {
      return this.kwik.error(
        `[Kwik: create] Cannot create already existing file file://${this.kwik.directoryPath}${this.tableName}/${id}.kwik`,
      );
    }
    return await this.saveFile(id, data);
  }

  /** Check if a document exists */
  async has(id: string): Promise<boolean> {
    return await exists(
      `${this.kwik.directoryPath}${this.tableName}/${id}.kwik`,
    );
  }

  /** Get a document from the table. */
  async get(id: string): Promise<T | undefined> {
    try {
      const data = await Deno.readFile(
        `${this.kwik.directoryPath}${this.tableName}/${id}.kwik`,
      );
      return msgpack.decode(data, {
        extensionCodec: this.kwik.msgpackExtensionCodec,
      });
    } catch (error) {
      await this.kwik.error(
        `[Kwik: get] Unable to read file file://${this.kwik.directoryPath}${this.tableName}/${id}.kwik`,
        error,
      );
    }
  }

  /** Get all documents of the table. */
  async getAll(): Promise<Map<string, T>> {
    const data = new Map<string, T>();

    for await (
      const file of Deno.readDir(
        Deno.realPathSync(`${this.kwik.directoryPath}${this.tableName}`),
      )
    ) {
      if (!file.name || !file.isFile) continue;

      try {
        const name = file.name.substring(0, file.name.lastIndexOf("."));
        const decodedData = await this.get(name);
        if (decodedData) {
          data.set(name, decodedData);
        }
      } catch (error) {
        this.kwik.error(
          `[Kwik: getAll]: Unable to read file ${this.kwik.directoryPath}${this.tableName}/${file.name}`,
          error,
        );
      }
    }

    return data;
  }

  /** Set a document data. */
  async set(id: string, data: T) {
    return await this.saveFile(id, data);
  }
  
  /** Updates a documents data. If this document does not exist, it will create the document. */
  async update(id: string, data: Partial<T> = {}) {
    const existing = await this.get(id) || {};
    return this.create(id, existing ? { ...existing, ...data } : data);
  }

  /** Deletes a document from the table. */
  async delete(id: string): Promise<boolean> {
    try {
      await Deno.remove(
        `${this.kwik.directoryPath}${this.tableName}/${id}.kwik`,
      );
      return true;
    } catch (error) {
      await this.kwik.error(
        `[Kwik: delete]: Unable to delete file ${this.kwik.directoryPath}${this.tableName}/${id}.json`,
        error,
      );
      return false;
    }
  }
}
