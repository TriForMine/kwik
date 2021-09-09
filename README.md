# Kwik

[![nest badge](https://nest.land/badge.svg)](https://nest.land/package/Kwik)

Kwik is a deno database using messagepack files.

Based on: [sabr](https://deno.land/x/sabr)

# Examples

```ts
import { Kwik, KwikTable } from "https://deno.land/x/kwik@v1.0.8/mod.ts";

interface UserSchema {
  username: string;
  createdAt: Date;
}

const kwik = new Kwik();
const users = new KwikTable<UserSchema>(kwik, "users");

await kwik.init();

const userId = kwik.uuid4();
await users.set(userId, {
  username: "TriForMine",
  createdAt: new Date(),
});
if (await users.has(userId)) {
  const user = await users.get(userId);
  console.log(user);
} else {
  console.error("An error occurred, the user was not added to the database.");
}
```

# Message Pack Customization

Here is an example to setup custom extension types for
[msgpack](https://deno.land/x/msgpack_javascript@v2.7.1#extension-types)

```ts
import {
  decode,
  encode,
  Kwik,
  KwikTable,
} from "https://deno.land/x/kwik@v1.0.8/mod.ts";

const kwik = new Kwik();
const table = new KwikTable(kwik, "table");

// Add Map<T> supports
kwik.msgpackExtensionCodec.register({
  type: 1,
  encode: (object: unknown): Uint8Array | null => {
    if (object instanceof Map) {
      return encode([...object]);
    } else {
      return new Uint8Array(0);
    }
  },
  decode: (data: Uint8Array) => {
    const array = decode(data) as Array<[unknown, unknown]>;
    return new Map(array);
  },
});

await kwik.init();

await table.set("test", new Map<string, string>());
```

# Handling BigInt
```ts
import {
  decode,
  encode,
  Kwik,
  KwikTable,
} from "https://deno.land/x/kwik@v1.0.8/mod.ts";

const kwik = new Kwik();
const table = new KwikTable(kwik, "table");

// Add BigInt supports
kwik.msgpackExtensionCodec.register({
  type: 0,
  encode: (object: unknown): Uint8Array | null => {
    if (typeof object === "bigint") {
      if (object <= Number.MAX_SAFE_INTEGER && object >= Number.MIN_SAFE_INTEGER) {
        return encode(parseInt(object.toString(), 10));
      } else {
        return encode(object.toString());
      }
    } else {
      return null;
    }
  },
  decode: (data: Uint8Array) => {
    return BigInt(decode(data));
  },
});

await kwik.init();

await table.set("test", 5n);
```
