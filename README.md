# Qewl

**Qewl** (pronounced: /kuːl/) is a **GraphQL Application Framework**.
It is inspired by Koa, built on Apollo Server, and turns your GraphQL endpoint into a Koa-like application, with support for context, middleware, and many other features.

It is great for working with **remote schemas** and **schema stitching** and things like **authentication**. But it also makes it very easy to set up a GraphQL Server **from scratch**.

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

## Getting started

_Coming Soon_
