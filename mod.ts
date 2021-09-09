import { msgpack } from "./deps.ts";

export * from "./kwik.ts";
export * from "./table.ts";
export const encode = msgpack.encode;
export const decode = msgpack.decode;
