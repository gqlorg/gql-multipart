import {buildSchema} from "graphql";
import {database} from "./data";
import fs from "fs";
import assert from "assert";

export const schema = buildSchema(`
  scalar File

  type User {
    id: Int
    name: String
    email: String
  }
  
  type Query {    
    user(id: Int!): User
  }
  
  type Mutation {
    createUser(name: String, email: String): User
    uploadFile(userId: Int!, file: File!): String    
    uploadFiles(userId: Int!, files: [File!]!): [String]
  }
  
`);

export const resolvers = {

    user: (args: any) => {
        for (const i in database.users.items) {
            if (database.users.items[i].id === args.id) {
                return database.users.items[i];
            }
        }
    },

    uploadFile: (args: any) => {
        return fs.readFileSync(args.file.tempFile, args.file.encoding);
    },

    uploadFiles: (args: any) => {
        if (!args.files)
            return;
        const a = [];
        for (const f of args.files) {
            a.push(fs.readFileSync(f.tempFile, f.encoding));
            f.destroy();
            assert(!fs.existsSync(f.tempFile));
        }
        return a;
    }

};
