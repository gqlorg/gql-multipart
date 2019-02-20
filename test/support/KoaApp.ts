import Koa from "Koa";
import mount from "koa-mount";
import {schema, resolvers} from "./schema";
import {gqlMultipartKoa} from "../../src";

const graphqlHTTP = require("koa-graphql");

export default class ExpressApplication {

    private app: Koa;
    private server: any;
    private schema = schema;

    constructor() {
        this.app = new Koa();
        this.app.use(mount('/graphql', gqlMultipartKoa()));
        this.app.use(mount('/graphql', graphqlHTTP({
            schema: this.schema,
            rootValue: resolvers
        })));
    }

    start(port?: number) {
        return new Promise(((resolve, reject) => {
            this.server = this.app.listen(port || 4000, (err?: Error) => {
                if (err)
                    return reject(err);
                resolve();
            });
        }));
    }

    stop() {
        return new Promise((resolve => {
            this.server.on('close', resolve);
            this.server.close();
        }));
    }
}
