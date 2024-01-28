# E-Bike Renting System - Admin Web Client

🚴‍♂️ Readers Beware: This is a school project 🚴‍♀️

Welcome to the administrative web client for our e-bike renting system – a school project that pedals its way into the world of big bike tech. This isn't just any admin panel; it's the central command station for managing a fleet of e-bikes that (hypothetically) rule the streets!

## Quick Links

### App Running Live

 Get a feel for the apps features, functionality, and user interface:

- **Live Demo**: Visit [Lenticode](https://vteam-admin.lenticode.com/login) to see the application live.

**Important Note**: To run the app live, you'll need an account. Feel free to [contact me](mailto:alexlindqvist@me.com) for further information.

### Root Repository

For a comprehensive view of all our related projects and to access the entire collection of repositories, please visit our root repository:

- **VTeam Root Repository**: [p0ntan/vteam-root](https://github.com/p0ntan/vteam-root)

This root repository serves as the central hub for our projects, providing links and information to all associated repositories.

Here you will find instructions on how to set up and run all repositories on your local machine.

---
## Custom Setup Instructions

While we recommend using our [root repository](https://github.com/p0ntan/vteam-root) for a smoother ride, you may choose to set up this repository directly, especially if you're planning to adapt the code. So, if you're feeling adventurous and want to ditch the training wheels, follow the steps below.

### MapTiler API Key

This application utilizes MapLibre GL JS with tiles from MapTiler.

#### Adding Your Free Key
1. Create or rename a `.env` file based on the `.env.example`.
2. Add or update the `PUBLIC_MAPTILER_API_KEY` with your own key from MapTiler.
3. Your key can be found on your MapTiler [Cloud](https://cloud.maptiler.com/account/keys/) account page.
4. If you don't have an API key yet, sign up for a free one at [MapTiler Cloud](https://www.maptiler.com/cloud/).

### REST API Configuration

The app interfaces with a REST API connected to a backend server and database.

1. If not already done, create or copy the `.env.example` file to `.env`.
2. Set `PUBLIC_REST_API_URL` to the server's URL.
3. The server URL is no secret and is provided in the `.env.example` file.
4. Server code can be found at [JuliaLind/vteam-server](https://github.com/JuliaLind/vteam-server).

### Local Development

Once you've created a project and installed the dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# Optionally, to open the app in a new browser tab:
npm run dev -- --open
```

### Building for Production

To create a production version of the app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

## Docker Deployment

To build a production version of the app and run it inside a container:

```bash
docker compose up --build
```

> The app uses the node-adapter by default. You may need to install a different [adapter](https://kit.svelte.dev/docs/adapters) for your target environment and change the app settings accordingly.
