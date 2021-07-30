# Kwik

Kwik is a deno database using messagepack files.

# Examples

```ts
import { Kwik, KwikTable } from "https://deno.land/x/kwik@v1.0.4/mod.ts";

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
[msgpack](https://deno.land/x/msgpack_javascript@v2.7.0#extension-types)

```ts
import { Kwik, KwikTable } from "https://deno.land/x/kwik@v1.0.4/mod.ts";
import { decode, encode } from "https://esm.sh/@msgpack/msgpack/mod.ts";

const kwik = new Kwik();
const table = new KwikTable(kwik, "table");

// Add Map<T> supports
kwik.msgpackExtensionCodec.register({
  type: 1,
  encode: (object: unknown): Uint8Array => {
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
