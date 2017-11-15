# Qewl

**Qewl** (pronounced: /kuːl/) is a **GraphQL Application Framework**.
It is inspired by Koa, built on Apollo Server, and turns your GraphQL endpoint into a Koa-like application, with support for context, middleware, and many other features.

It is great for setting up an API Gateway on top of existing GraphQL endpoint, applying concepts like **remote schemas** and **schema stitching**. But it also makes it very easy to set up a GraphQL Server **from scratch**.

## Concepts

Qewl crosses the bridge between commonly used patterns for HTTP middleware frameworks like Koa and Express, and GraphQL endpoints.
A GraphQL server is composed of three components:
- GraphQL schemas
- Resolvers
- Context

Qewl uses these same three components:
- GraphQL schemas define the **routes** of our server
- Resolvers define the **implementation** of these routes
- Middleware is used to construct the **context** passed to every resolver, and to add **common functionality** to the resolvers

## Installation
Qewl requires **node v7.6.0** or higher for ES2015 and async function support.
```bash
$ yarn add qewl
```

## Examples

### [Getting started](./examples/getting-started#readme)
Set up your first GraphQL Server in minutes using Express and Qewl.

### [Deep Dive](./examples/deep-dive#readme)
Qewl makes it easy to set up a GraphQL Server from scratch. But this example really takes it to the next level by combining two existing GraphQL endpoints, link them together, and apply some middleware on top.
