## MapTiler API KEY

The application uses MapLibre GL JS with tiles from MapTiler.

### Adding a free key

Create a `.env` file or simply copy and/or rename the `.env.example` file.

Open the `.env` file, you will need to add/replace **PUBLIC_MAPTILER_API_KEY** with your own MapTiler API key.

Your MapTiler account access key is on your MapTiler [Cloud](https://cloud.maptiler.com/account/keys/) account page.

:information_source: If you don't have an API KEY, you can create it for free at https://www.maptiler.com/cloud/

## REST API

The app uses a REST API. At the other end, there's a server with a database connection. The server is available [here](https://github.com/JuliaLind/vteam-server).

If you havn't already, create a `.env` file or copy the `.env.example` file.

Make sure you have the **PUBLIC_REST_API_URL** set to the server's url.

The url is no secret. You'll find the exact url in the `.env.example` file.

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of the app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

## Docker

To build a production version of the app and run it inside a container:

```bash
docker compose up --build
```

> The app uses the node-adapter. You may need to install a different [adapter](https://kit.svelte.dev/docs/adapters) for your target environment and change the app settings accordingly.
