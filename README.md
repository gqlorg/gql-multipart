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

## Setup

Just mount express-graphql as a route handler before any graphql handler middleware.

#### Setup for Express

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
