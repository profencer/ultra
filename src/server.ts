import { LRU, readableStreamFromReader, serve } from "./deps.ts";
import assets from "./assets.ts";
import transform from "./transform.ts";
import render from "./render.ts";
import { jsxify, tsxify } from "./resolver.ts";
import { isDev, port } from "./env.ts";

import { StartOptions } from "./types.ts";

const memory = new LRU(500);

const server = (
  {
    importmap,
    dir = "src",
    root = "http://localhost:8000",
    lang = "en",
    env,
  }: StartOptions,
) => {
  const serverStart = Math.ceil(+new Date() / 100);

  const handler = async (request: Request) => {
    const requestStart = Math.ceil(+new Date() / 100);
    const cacheBuster = isDev ? requestStart : serverStart;
    const { raw, transpile } = await assets(dir);
    const url = new URL(request.url);

    // static assets
    if (raw.has(`${dir}${url.pathname}`)) {
      const contentType = raw.get(`${dir}${url.pathname}`);
      const headers = {
        "content-type": contentType,
      };

      const file = await Deno.open(`./${dir}${url.pathname}`);
      const body = readableStreamFromReader(file);

      return new Response(body, { headers });
    }

    const transpilation = async (file: string) => {
      const headers = {
        "content-type": "application/javascript",
      };

      let js = memory.get(url.pathname);

      if (!js) {
        const source = await Deno.readTextFile(`./${file}`);
        const t0 = performance.now();
        js = await transform({
          source,
          importmap,
          root,
          cacheBuster,
          env,
        });
        const t1 = performance.now();
        console.log(`Transpile ${file.replace(dir, "")} in ${t1 - t0}ms`);
        if (!isDev) memory.set(url.pathname, js);
      }

      //@ts-ignore any
      return new Response(js, { headers });
    };

    // jsx
    const jsx = `${dir}${jsxify(url.pathname)}`;
    if (transpile.has(jsx)) {
      return await transpilation(jsx);
    }

    // tsx
    const tsx = `${dir}${tsxify(url.pathname)}`;
    if (transpile.has(tsx)) {
      return await transpilation(tsx);
    }

    return new Response(
      await render({
        url,
        root,
        importmap,
        lang,
        cacheBuster,
      }),
      {
        headers: {
          "content-type": "text/html; charset=utf-8",
        },
      },
    );
  };

  console.log(`Ultra running ${root}`);
  //@ts-ignore any
  return serve(handler, { port: +port });
};

export default server;
