import { exists, msgpack } from "./deps.ts";
import { Kwik } from "./kwik.ts";

export class KwikTable<T> {
  private readonly tableName: string;
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
      }) as T;
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
        await this.kwik.error(
          `[Kwik: getAll]: Unable to read file ${this.kwik.directoryPath}${this.tableName}/${file.name}`,
          error,
        );
      }
    }

    return data;
  }

  /** Get all documents from a table that match a filter */
  async findMany(
    filter: Record<string, unknown> | ((value: T) => boolean),
    returnArray?: false,
  ): Promise<Map<string, T>>;
  async findMany(
    filter: Record<string, unknown> | ((value: T) => boolean),
    returnArray?: true,
  ): Promise<T[]>;
  async findMany(
    filter: Record<string, unknown> | ((value: T) => boolean),
    returnArray = false,
  ) {
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
          if (typeof filter === "function") {
            if (filter(decodedData)) data.set(name, decodedData);
          } else {
            const invalid = Object.keys(filter).find((key) =>
              (decodedData as Record<string, unknown>)[key] !== filter[key]
            );
            if (!invalid) data.set(name, decodedData);
          }
        }
      } catch (error) {
        await this.kwik.error(
          `[Kwik Error: findMany]: Unable to read file ${this.kwik.directoryPath}${this.tableName}/${file.name}`,
          error,
        );
      }
    }

    return returnArray ? [...data.values()] : data;
  }

  /** Gets the first document from a table that match a filter */
  async findOne(filter: Record<string, unknown> | ((value: T) => boolean)) {
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
          if (typeof filter === "function") {
            if (filter(decodedData)) return decodedData;
          } else {
            const invalid = Object.keys(filter).find((key) =>
              (decodedData as Record<string, unknown>)[key] !== filter[key]
            );
            if (!invalid) return decodedData;
          }
        }
      } catch (error) {
        await this.kwik.error(
          `[Kwik Error: findOne]: Unable to read file ${this.kwik.directoryPath}${this.tableName}/${file.name}`,
          error,
        );
      }
    }
  }

  /** Set a document data. */
  async set(id: string, data: Partial<T> = {}) {
    return await this.saveFile(id, data);
  }

  /** Updates a documents' data. If this document does not exist, it will create the document. */
  async update(id: string, data: Partial<T> = {}) {
    const existing = await this.get(id) || {};
    return this.set(id, existing ? { ...existing, ...data } : data);
  }

  /** Gets the first document from a table that match a filter */
  async updateOne(
    filter: Partial<T> | ((value: T) => boolean),
    data: Partial<T>,
  ) {
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
          if (typeof filter === "function") {
            if (filter(decodedData)) return this.update(name, data);
          } else {
            const invalid = Object.keys(filter).find((key) =>
              (decodedData as Record<string, unknown>)[key] !== // deno-lint-ignore no-explicit-any
                (filter as any)[key]
            );
            if (!invalid) return this.update(name, data);
          }
        }
      } catch (error) {
        await this.kwik.error(
          `[Kwik Error: updateOne]: Unable to read file ${this.kwik.directoryPath}${this.tableName}/${file.name}`,
          error,
        );
      }
    }
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

  /** Deletes one document in a table that match a filter */
  async deleteOne(filter: Partial<T> | ((value: T) => boolean)) {
    const files = Deno.readDirSync(
      Deno.realPathSync(`${this.kwik.directoryPath}${this.tableName}`),
    );

    for (const file of files) {
      if (!file.name || !file.isFile) continue;

      try {
        const name = file.name.substring(0, file.name.lastIndexOf("."));
        const decodedData = await this.get(name);
        if (decodedData) {
          if (typeof filter === "function") {
            return this.delete(name);
          } else {
            const invalid = Object.keys(filter).find((key) =>
              (decodedData as Record<string, unknown>)[key] !== // deno-lint-ignore no-explicit-any
                (filter as any)[key]
            );
            if (!invalid) return this.delete(name);
          }
        }
      } catch (error) {
        await this.kwik.error(
          `[Kwik Error: deleteMany]: Unable to read file ${this.kwik.directoryPath}${this.tableName}/${file.name}`,
          error,
        );
      }
    }
  }

  /** Deletes all documents in a table that match a filter */
  async deleteMany(filter: Partial<T> | ((value: T) => boolean)) {
    const files = Deno.readDirSync(
      Deno.realPathSync(`${this.kwik.directoryPath}${this.tableName}`),
    );

    for (const file of files) {
      if (!file.name || !file.isFile) continue;

      try {
        const name = file.name.substring(0, file.name.lastIndexOf("."));
        const decodedData = await this.get(name);
        if (decodedData) {
          if (typeof filter === "function") {
            await this.delete(name);
          } else {
            const invalid = Object.keys(filter).find((key) =>
              (decodedData as Record<string, unknown>)[key] !== // deno-lint-ignore no-explicit-any
                (filter as any)[key]
            );
            if (!invalid) await this.delete(name);
          }
        }
      } catch (error) {
        await this.kwik.error(
          `[Kwik Error: deleteMany]: Unable to read file ${this.kwik.directoryPath}${this.tableName}/${file.name}`,
          error,
        );
      }
    }
  }
}
