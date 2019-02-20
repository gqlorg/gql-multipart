import {Request, Response} from "express";
import {processRequest, IGQLMultipartOptions} from './process_request';

export {IGQLMultipartOptions};

export function gqlMultipartExpress(options: IGQLMultipartOptions = {}) {
    return function gqlMultipartExpressMw(
        request: Request,
        response: Response,
        next: (error?: Error) => void) {

        if (!request.is('multipart/form-data'))
            return next();

        processRequest(request, response, options).then(body => {
            if (body) {
                request.body = body;
                request.headers['content-type'] = 'application/graphql';
            }
            next();
        }).catch(error => {
            // @ts-ignore
            if (error.status && error.expose) {
                // @ts-ignore
                response.status(error.status);
                response.statusMessage = error.message;
                response.end();
                return;
            }
            /* istanbul ignore next */
            next(error);
        });

    };

}
