import React, { lazy, Suspense } from "react";
import { Helmet, HelmetProvider } from "helmet";
import { Route } from "wouter";

const Index = lazy(() => import("./index.jsx"));

const Ultra = ({ helmetContext }) => {
  return (
    <HelmetProvider context={helmetContext}>
      <Helmet>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
        <meta charset="UTF-8" />
        <link rel="stylesheet" href="/style.css" />
        <title>Ultra</title>
        <meta
          name="description"
          content="Deno, ESM + React: No build, No bundle, All streaming"
        />
        <link rel="icon" type="image/svg+xml" href="/ultra.svg" />
      </Helmet>
      <Suspense fallback={null}>
        <Route path="/">
          <Index />
        </Route>
      </Suspense>
    </HelmetProvider>
  );
};

export default Ultra;
