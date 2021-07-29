import {KwikTable} from "./table.ts";
import {fromFileUrl, msgpack} from "./deps.ts";
import {uuid4} from "./utils.ts";

export class Kwik {
    public directoryPath = `${
        fromFileUrl(Deno.mainModule.substring(0, Deno.mainModule.lastIndexOf("/")))
    }/db/`;
    public tables = new Map<string, KwikTable<unknown>>();
    public msgpackExtensionCodec = new msgpack.ExtensionCodec();

    /** Initializes all the tables **/
    async init() {
        await Deno.mkdir(this.directoryPath).catch(() => undefined);

        for (const table of this.tables) {
            await Deno.mkdir(`${this.directoryPath}/${table[0]}`).catch(() =>
                undefined
            )
        }
    }

    async error(...data: any[]) {
        console.error(...data);
    }

    /** Returns an UUID V4 string **/
    uuid4() {
        return uuid4();
    }
}
