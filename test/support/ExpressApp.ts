import express from "express";
import graphqlHTTP from "express-graphql";
import {schema, resolvers} from "./schema";
import {gqlMultipartExpress} from "../../src";

export default class ExpressApplication {

    private app: express.Application;
    private server: any;
    private schema = schema;

    constructor() {
        this.app = express();
        this.app.use('/graphql', gqlMultipartExpress());
        this.app.use('/graphql', graphqlHTTP({
            schema: this.schema,
            rootValue: resolvers
        }));
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
