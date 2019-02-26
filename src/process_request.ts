import fs from 'fs';
import tmp from 'tmp';
import {SynchrounousResult} from 'tmp';
import createError from 'http-errors';
import {IncomingMessage, OutgoingMessage} from "http";

const Busboy = require('busboy');

export interface IGQLMultipartOptions {
    highWaterMark?: number;
    fileHwm?: number;
    defCharset?: string;
    tempDir?: string;
    maxFieldNameSize?: number;
    maxFieldSize?: number;
    maxFields?: number;
    maxFileSize?: number;
    maxFiles?: number;
    maxHeaderPairs?: number;
}

interface IPayload {
    query: string;
    variables?: {
        [x: string]: any;
    };
}

class FileInfo {
    private readonly tempFile: string;

    constructor(private _tmp: SynchrounousResult,
                public readonly name: string,
                public readonly encoding: string,
                public readonly mimeType: string) {
        this.tempFile = this._tmp.name;
        this.encoding = encoding === '7bit' ? 'ascii' : encoding;
    }

    destroy() {
        this._tmp.removeCallback();
    }
}

export function processRequest(
    req: IncomingMessage,
    res: OutgoingMessage,
    options: IGQLMultipartOptions): Promise<any> {

    return new Promise((resolve, reject) => {

        /*istanbul ignore next*/
        if (req.method !== 'POST')
            return resolve();

        const tempFiles: tmp.SynchrounousResult[] = [];
        let filesTobeWait = 0;
        let finished = false;
        const cleanup = () => {
            for (const f of tempFiles)
                f.removeCallback();
        };
        let payload: IPayload;

        const doCallback = (error?: Error) => {
            if (filesTobeWait) {
                setImmediate(() => doCallback(error));
                return;
            }
            // Be sure request resumes after busboy destroyed.
            setImmediate(() => req.resume());
            if (error) {
                cleanup();
                reject(error);
            } else {
                resolve(payload);
            }
        };

        /**
         * Exits request processing with an error
         */
        const done = (error?: Error) => {
            if (finished)
                return;
            finished = true;
            req.unpipe(busboy);
            doCallback(error);
        };

        // noinspection SpellCheckingInspection
        const busboy = new Busboy({
            headers: req.headers,
            limits: {
                fieldNameSize: options.maxFieldNameSize,
                fieldSize: options.maxFieldSize,
                fields: options.maxFields,
                fileSize: options.maxFileSize,
                files: options.maxFiles,
                headerPairs: options.maxHeaderPairs
            }
        });

        busboy.on('field', (fieldName: string,
                            value: any,
                            fieldnameTruncated: boolean,
                            valTruncated: boolean,
                            encoding: string, mimetype: string) => {
            if (fieldName === 'payload') {
                try {
                    payload = JSON.parse(value);
                    return;
                } catch (error) {
                    done(createError(400, 'Invalid JSON in the "payload" multipart field'));
                }
            }
            if (fieldName === 'query') {
                payload = {query: value};
                return;
            }
            if (!payload)
                return done(createError(400, 'First multipart field must be "payload" or "query"'));
            if (fieldName === 'variables') {
                try {
                    payload.variables = JSON.parse(value);
                    return;
                } catch (error) {
                    done(createError(400, 'Invalid JSON in the "variables" multipart field'));
                }
            }
            if (!fieldName.startsWith('$'))
                return done(createError(400, 'Variable fields must start with "$" character'));
            if (mimetype === 'application/json')
                try {
                    value = JSON.parse(value);
                } catch (error) {
                    done(createError(400, `Invalid JSON data in the "${fieldName}" multipart field`));
                    return;
                }
            payload.variables = payload.variables || {};
            payload.variables[fieldName.substring(1)] = value;
        });

        busboy.on('file', (fieldName: string,
                           stream: NodeJS.ReadableStream,
                           filename: string,
                           encoding: string,
                           mimeType: string) => {
            if (!payload)
                return done(createError(400, 'First multipart field must be "payload"'));
            /* istanbul ignore next */
            if (!fieldName.startsWith('$'))
                return done(createError(400, 'Variable fields must start with "$" character'));

            const tmpFile = tmp.fileSync({
                prefix: 'gqlmp-',
                dir: options.tempDir
            });
            tempFiles.push(tmpFile);
            const targetFile = fs.createWriteStream(tmpFile.name);

            const fi = new FileInfo(tmpFile, filename, encoding, mimeType);
            const n = fieldName.substring(1);
            payload.variables = payload.variables || /*istanbul ignore next*/ {};
            if (payload.variables[n]) {
                /* istanbul ignore else */
                if (!Array.isArray(payload.variables[n]))
                    payload.variables[n] = [payload.variables[n]];
                payload.variables[n].push(fi);
            } else
                payload.variables[n] = fi;

            stream.pipe(targetFile);
            stream.on('error', /*istanbul ignore next: hard to evaluate*/ (e) => {
                stream.unpipe(targetFile);
                targetFile.close();
                done(e);
            });
            stream.on('end', () => {
                stream.unpipe(targetFile);
                filesTobeWait++;
                targetFile.on('finish', () => {
                    filesTobeWait--;
                });
                targetFile.end();
            });
            stream.on('limit', /*istanbul ignore next: We dont test busboy*/() => {
                stream.unpipe(targetFile);
                targetFile.close();
                done(createError(413, `File exceeds the maximum file size limit. ${options.maxFileSize})`));
            });
        });

        busboy.once('error', done);
        busboy.once('filesLimit', /*istanbul ignore next: We dont test busboy*/ () =>
            done(createError(413, `${options.maxFiles} max file uploads exceeded.`))
        );
        let requestEnded: boolean;
        busboy.on('finish', () => {
            requestEnded = true;
            if (!payload)
                return done(createError(400, 'Missing "payload" multipart field'));
            done();
        });

        req.once('close', () => {
            /*istanbul ignore next: hard to evaluate*/
            if (!requestEnded)
                done(createError(499, 'Client disconnected'));
        });

        res.on('finish', () => cleanup());

        req.pipe(busboy);

    });
}
