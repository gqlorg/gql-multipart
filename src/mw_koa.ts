import {Context} from "koa";
import {processRequest, IGQLMultipartOptions} from './process_request';

export {IGQLMultipartOptions};

export function gqlMultipartKoa(options: IGQLMultipartOptions = {}) {
    return function gqlMultipartKoaMw(
        ctx: Context,
        next: (error?: Error) => void) {

        if (!ctx.request.is('multipart/form-data'))
            return next();

        const request = ctx.request.req;
        const response = ctx.response.res;

        return processRequest(request, response, options).then(body => {
            if (body) {
                // @ts-ignore
                request.body = body;
                request.headers['content-type'] = 'application/graphql';
            }
            return next();
        }).catch(error => {
            // @ts-ignore
            if (error.status && error.expose) {
                // @ts-ignore
                response.statusCode = error.status;
                response.statusMessage = error.message;
                response.end();
                return;
            }
            /* istanbul ignore next */
            return next(error);
        });

    };

}
