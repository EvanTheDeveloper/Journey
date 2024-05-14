import initSockets from "./socketHandler.js";
import next from "next";
import {createServer} from "node:http";

const app = next({dev: true, hostname: "localhost", port: 3000});

app.prepare().then(() => {
  const handler = app.getRequestHandler();
  const httpServer = createServer(handler);

  httpServer.listen(3000, () => {
    console.log("Ready on port 3000");
  });

  initSockets(httpServer);
});
