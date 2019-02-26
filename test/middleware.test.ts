import './support/env';
import assert from "assert";
import fs from "fs";
import ExpressApp from "./support/ExpressApp";
import KoaApp from "./support/KoaApp";
import fetch from "node-fetch";
import FormData from "form-data";

const frameWorks = [
    {
        name: 'Express',
        app: new ExpressApp()
    },
    {
        name: 'Koa',
        app: new KoaApp()
    }
];

for (const framework of frameWorks) {

    const app = framework.app;

    describe(framework.name, () => {

        before(() => {
            return app.start(3999);
        });

        after(() => {
            return app.stop();
        });

        it("Should accept multipart requests (`payload`)", () => {
            const form = new FormData();
            const x = {
                query: `query ($id: Int!) {
              user(id: $id) {
                name
              }            
            }`
            };
            form.append('payload', JSON.stringify(x));
            form.append('$id', 1, {
                header: {'content-type': 'application/json'}
            });
            return fetch('http://localhost:3999/graphql', {
                method: 'POST',
                body: form
            }).then(async (res) => {
                assert.strictEqual(res.status, 200, res.statusText);
                const json = await res.json();
                assert(json);
                assert(!json.errors, json.errors && json.errors[0].message);
                assert(json.data);
                assert(json.data.user);
                assert.strictEqual(json.data.user.name, 'User 1');
            });
        });

        it("Should accept multipart requests (`query`, `variables`)", () => {
            const form = new FormData();
            const query = `query ($id: Int!) {
              user(id: $id) {
                name
              }            
            }`;
            form.append('query', query);
            form.append('variables', JSON.stringify({id: 1}));
            return fetch('http://localhost:3999/graphql', {
                method: 'POST',
                body: form
            }).then(async (res) => {
                assert.strictEqual(res.status, 200, res.statusText);
                const json = await res.json();
                assert(json);
                assert(!json.errors, json.errors && json.errors[0].message);
                assert(json.data);
                assert(json.data.user);
                assert.strictEqual(json.data.user.name, 'User 1');
            });
        });

        it("Should accept file uploads", () => {
            const form = new FormData();
            const x = {
                query: `mutation ($userId: Int!, $file: File!) {
              uploadFile(userId: $userId, file: $file)           
            }`
            };
            form.append('payload', JSON.stringify(x));
            form.append('$userId', 1, {
                header: {'content-type': 'application/json'}
            });
            const stream = fs.createReadStream(__dirname + '/support/file1.txt');
            form.append('$file', stream);
            return fetch('http://localhost:3999/graphql', {
                method: 'POST',
                body: form
            }).then(async (res) => {
                assert.strictEqual(res.status, 200);
                const json = await res.json();
                assert(json);
                assert(!json.errors, json.errors && json.errors[0].message);
                assert(json.data);
                assert.strictEqual(json.data.uploadFile, 'This is the 1.st test file\n');
            });
        });

        it("Should accept array of file uploads", () => {
            const form = new FormData();
            const x = {
                query: `mutation ($userId: Int!, $files: [File!]!) {
              uploadFiles(userId: $userId, files: $files)           
            }`
            };
            form.append('payload', JSON.stringify(x));
            form.append('$userId', 1, {
                header: {'content-type': 'application/json'}
            });
            form.append('$note', 'Any note');
            form.append('$files', fs.createReadStream(__dirname + '/support/file1.txt'), {
                header: {'content-transfer-encoding': 'utf8'}
            });
            form.append('$files', fs.createReadStream(__dirname + '/support/file2.txt'));
            return fetch('http://localhost:3999/graphql', {
                method: 'POST',
                body: form
            }).then(async (res) => {
                assert.strictEqual(res.status, 200, res.statusText);
                const json = await res.json();
                assert(json);
                assert(!json.errors, json.errors && json.errors[0].message);
                assert(json.data);
                assert.deepStrictEqual(json.data.uploadFiles,
                    ['This is the 1.st test file\n', 'This is the 2.th test file\n']
                );
            });
        });

        it("Should return status 400 if payload is not a valid json", () => {
            const form = new FormData();
            form.append('payload', '>0<');
            return fetch('http://localhost:3999/graphql', {
                method: 'POST',
                body: form
            }).then((res) => {
                assert.strictEqual(res.status, 400, res.statusText);
                assert(res.statusText.includes('Invalid JSON'), res.statusText);
            });
        });

        it("Should return status 400 if `variables` part is not a valid json", () => {
            const form = new FormData();
            form.append('query', '{}');
            form.append('variables', '>0<');
            return fetch('http://localhost:3999/graphql', {
                method: 'POST',
                body: form
            }).then((res) => {
                assert.strictEqual(res.status, 400, res.statusText);
                assert(res.statusText.includes('Invalid JSON'), res.statusText);
            });
        });

        it("Should return status 400 if any json field value is not a valid json", () => {
            const form = new FormData();
            form.append('payload', '{}');
            form.append('$x', '>0<', {
                header: {'content-type': 'application/json'}
            });
            return fetch('http://localhost:3999/graphql', {
                method: 'POST',
                body: form
            }).then((res) => {
                assert.strictEqual(res.status, 400, res.statusText);
                assert(res.statusText.includes('Invalid JSON'), res.statusText);
            });
        });

        it("Should return status 400 if a fields does not start with $", () => {
            const form = new FormData();
            form.append('payload', '{}');
            form.append('x', 1);
            return fetch('http://localhost:3999/graphql', {
                method: 'POST',
                body: form
            }).then((res) => {
                assert.strictEqual(res.status, 400);
                assert(res.statusText.includes('Variable fields must start with'), res.statusText);
            });
        });

        it("Should return status 400 if first part is not payload", () => {
            const form = new FormData();
            form.append('$files', fs.createReadStream(__dirname + '/support/file1.txt'));
            return fetch('http://localhost:3999/graphql', {
                method: 'POST',
                body: form
            }).then(async (res) => {
                assert.strictEqual(res.status, 400);
                assert(res.statusText.includes('First multipart field must be "payload"'), res.statusText);
            });
        });

        it("Should return status 400 if payload part not sent", () => {
            const form = new FormData();
            return fetch('http://localhost:3999/graphql', {
                method: 'POST',
                body: form
            }).then(async (res) => {
                assert.strictEqual(res.status, 400);
                assert(res.statusText.includes('Missing "payload" multipart field'), res.statusText);
            });
        });

        it("Should ignore mw if request is not not multipart", () => {
            const body = {
                query: `query{
              user(id: 1) {
                name
              }            
            }`
            };
            return fetch('http://localhost:3999/graphql', {
                method: 'POST',
                body: JSON.stringify(body),
                headers: {'Content-Type': 'application/json'},
            }).then(async (res) => {
                const json = await res.json();
                assert(json);
                assert(!json.errors, json.errors && json.errors[0].message);
                assert(json.data);
                assert(json.data.user);
                assert.strictEqual(json.data.user.name, 'User 1');
            });
        });

    });

}
