# gql-multipart

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Build Status][travis-image]][travis-url]
[![Test Coverage][coveralls-image]][coveralls-url]
[![Dependencies][dependencies-image]][dependencies-url]
[![DevDependencies][devdependencies-image]][devdependencies-url]

[![NPM](https://nodei.co/npm/gql-multipart.png?downloads=true&downloadRank=true)](https://nodei.co/npm/gql-multipart/)

Complementary middleware for [express-graphql](https://github.com/graphql/express-graphql) and [koa-graphql](https://github.com/keithwhor/nodal-graphql) which adds support parsing multipart request and file uploads.

## Installation

```sh
$ npm install gql-multipart
```

## API

#### gqlMultipartExpress()

This method creates middleware for [Express](https://github.com/expressjs/expressjs.com) library

```javascript
gqlMultipartExpress([options: GQLMultipartOptions])
```

#### gqlMultipartKoa()

This method creates middleware for [Koa](https://github.com/koajs/koa) library

```javascript
gqlMultipartKoa([options: GQLMultipartOptions])
```


#### GQLMultipartOptions

  
  - **highWaterMark** - integer: highWaterMark to use for multipart parser instance (Default: WritableStream default).
  - **fileHwm** - integer: highWaterMark to use for temp file streams (Default: ReadableStream default).                     
  - **defCharset** - string: Default character set to use when one isn't defined (Default: 'utf8').
  - **tempDir** - string: Determines temp directory. Default OS temp directory.
  - **maxFieldNameSize** - integer:  Max field name size (in bytes) (Default: 100 bytes).
  - **maxFieldSize** - integer: Max field value size (in bytes) (Default: 1MB).
  - **maxFields** - integer: Max number of non-file fields (Default: Infinity). 
  - **maxFileSize** - integer: The max file size (in bytes) (Default: Infinity).                          
  - **maxFiles** - integer: The max number of file fields (Default: Infinity).
  - **maxHeaderPairs** - integer: The max number of header key=>value pairs to parse Default: 2000 (same as node's http).



## Setup

Just mount express-graphql as a route handler before any graphql handler middleware.

#### Setup for Express

GraphQL schema used in following examples:
```javascript
import {buildSchema} from "graphql";

const schema = buildSchema(`
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

const resolvers = {

   user: (args) => {
         // return user instance
       },
   
       uploadFile: ({file}) => {
         // do anything with file
         const data = fs.readFileSync(file.tempFile, file.encoding);    
         return 'OK'
       },
   
       uploadFiles: ({files}) => {        
           for (const f of files) {
             // do anything with file
             const data = fs.readFileSync(f.tempFile, f.encoding);            
           }
           return 'OK';
       }

};

module.exports = {schema, resolvers};
```

````javascript
import express from "express";
import graphqlHTTP from "express-graphql";
import {gqlMultipartExpress} from "gql-multipart";
import {schema, resolvers} from "./my-schema";

const app = express();
app.use('/graphql', gqlMultipartExpress()); // Must be mounted before express-graphql
app.use('/graphql', graphqlHTTP({
    schema: this.schema,
    rootValue: resolvers
}));
````

#### Setup for Koa

````javascript
import Koa from "Koa";
import mount from "koa-mount";
import {gqlMultipartKoa} from "gql-multipart";
import {schema, resolvers} from "./my-schema";

const app = new Koa();
app.use(mount('/graphql', gqlMultipartKoa()));  // Must be mounted before koa-graphql
app.use(mount('/graphql', graphqlHTTP({
    schema: this.schema,
    rootValue: resolvers
})));
````

## Client implementation

Request can be send easily using any client implementation which supports multipart form data. 

## SPEC

Consider the following guidelines:

1. First part must contain graphql payload data as JSON encoded string and part name must be "payload"

2. Following parts must contain variables and names must start with "$" character.

3. Non string variables (number, boolean, array, object) must be encoded as JSON and Content-Type must be application/json. 

4. To send array of file for single variable, use same part name.


## Simple client using fetch

gql-multipart spec is very simple and you do not need any client implementations. Following example uses FormData and fetch() method.

````javascript

function uploadFile(ownerId, ownerName, file, encoding) {
  const form = new FormData();
  const payload = {
      query: `
          mutation ($userId: Int!, $file: File!) {
            uploadFile(userId: $userId, file: $file)           
          }`
  };
  form.append('payload', JSON.stringify(payload));
  form.append('$userId', ownerId, {
      header: {'content-type': 'application/json'}
  }); 
  form.append('$file', file, {
      header: encoding ? {'content-transfer-encoding': encoding}: null
  });
  
  return fetch('http://localhost:4000/graphql', {
      method: 'POST',
      body: form
  }).then((res) => {
      // Upload complete
  });
}

````

````javascript

function uploadFiles(ownerId, ownerName, files) {
  const form = new FormData();
  const payload = {
      query: `
          mutation ($userId: Int!, $files: [File!]!) {
            uploadFiles(userId: $userId, files: $files)           
          }`
  };
  form.append('payload', JSON.stringify(payload));
  form.append('$userId', ownerId, {
      header: {'content-type': 'application/json'}
  }); 
  for (const f of files) {
    form.append('$files', f);
  }
  
  return fetch('http://localhost:4000/graphql', {
      method: 'POST',
      body: form
  }).then((res) => {
      // Upload complete
  });
}

````


#### Sample request body

```sh
--------------------------5743007ba5b4
Content-Disposition: form-data; name="payload"

{ "query": "mutation ($userId: Int!, $file: File!) { uploadFile(userId: $userId, file: $file) }" }
--------------------------5743007ba5b4
Content-Disposition: form-data; name="$userId"
Content-Type: application/json

1528
--------------------------5743007ba5b4
Content-Disposition: form-data; name="$file"; filename="anyfile.txt"
Content-Type: text/plain

Any file content.

--------------------------5743007ba5b4--
```

### Known client implementations

* [gql-fetch](https://github.com/gqlorg/gql-fetch)

## Compatibility

  - node with Express `>= 6.x`;
  - node with Koa `>= 8.x`;
  
### License
[MIT](LICENSE)

[npm-image]: https://img.shields.io/npm/v/gql-multipart.svg
[npm-url]: https://npmjs.org/package/gql-multipart
[travis-image]: https://img.shields.io/travis/gqlorg/gql-multipart/master.svg
[travis-url]: https://travis-ci.org/gqlorg/gql-multipart
[coveralls-image]: https://img.shields.io/coveralls/gqlorg/gql-multipart/master.svg
[coveralls-url]: https://coveralls.io/r/gqlorg/gql-multipart
[downloads-image]: https://img.shields.io/npm/dm/gql-multipart.svg
[downloads-url]: https://npmjs.org/package/gql-multipart
[gitter-image]: https://badges.gitter.im/gqlorg/gql-multipart.svg
[gitter-url]: https://gitter.im/gqlorg/gql-multipart?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge
[dependencies-image]: https://david-dm.org/gqlorg/gql-multipart/status.svg
[dependencies-url]:https://david-dm.org/gqlorg/gql-multipart
[devdependencies-image]: https://david-dm.org/gqlorg/gql-multipart/dev-status.svg
[devdependencies-url]:https://david-dm.org/gqlorg/gql-multipart?type=dev
[quality-image]: http://npm.packagequality.com/shield/gql-multipart.png
[quality-url]: http://packagequality.com/#?package=gql-multipart
