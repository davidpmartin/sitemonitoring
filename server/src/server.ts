import express from "express";
import path from "path";
import mongoose from "mongoose";
import { Server } from "http";
import shell from "node-powershell";
import SocketIO from "socket.io";
import fs from "fs";
import cron from "node-cron";
import log4js from "log4js";
import { router } from "@routes/api";
import { applyMiddleware } from "@utils/index";
import { middleware } from "@middleware/index";

/**
 * Main server class
 */
export class MonitoringServer {
  // Default members
  private app: express.Application;
  private logger!: log4js.Logger;
  private server!: Server;
  private port!: string | number;
  private db!: mongoose.Connection;
  private io!: SocketIO.Server;
  private task!: cron.ScheduledTask;
  private appRoot!: string;
  private shell!: shell;
  private scriptRunning!: boolean;
  private scriptRunTime!: number;

  // Parameters
  private loggerConfPath = "./src/config/log4js.json";        // Path to logger configuration file
  private relServerPath = "server";                           // Default path to server folder (from cwd)
  private scriptInterval = "*/2 * * * *"                      // Time format in cron syntax


  constructor() {
    this.app = express();
    this.config();
    this.database();
  }

  /**
   * Perform the required configuration tasks
   */
  private config(): void {
    this.logging();
    this.validate();
    this.path();
    this.static();
    this.ports();
    this.middleware();
    this.routes();
    this.eventListeners();
  }

  /**
   * Sets app listeners to perform  tasks in sequence when the server is ready to start
   */
  private eventListeners(): void {

    // On DB connection
    this.app.on('ready', () => {
      this.schedule();
      this.start();
      this.monitor();
      this.socket();
    });
  }


  /**
   * Initializes the logger
   */
  private logging(): void {
    try {
      log4js.configure(this.loggerConfPath);
      this.logger = log4js.getLogger("MonitoringServer.class");
      this.logger.info("Logging configured");
    } catch (err) {
      console.log("ERROR: Unable to configure logger");
      this.stop(1);
    }
  }

  /**
   * Validates the required environment is in place
   */
  private validate(): void {
    const envVars = [
      process.env.EXEC_ENV,
      process.env.DB_HOST,
      process.env.SERVER_PORT,
      process.env.API_URL,
      process.env.EP_POST,
      process.env.API_TOKEN
    ];
    this.logger.info("Checking environment variables: ");
    envVars.forEach(val => this.logger.info(`>> ${val}`));
    if (envVars.includes(undefined)) {
      this.logger.error(
        "Required environment variables are not set. Exiting..."
      );
      this.stop(1);
    }
  }

  /**
   * Establishes the relative context of the application and the project root
   */
  private path(): void {
    try {
      if (!fs.existsSync(this.relServerPath)) {
        this.relServerPath = path.join(__dirname, "../..", this.relServerPath);
      }
    } catch (err) {
      this.logger.error("Unable to establish the relative context of the application with the project root")
    }
    this.appRoot = path.dirname(this.relServerPath);
    this.logger.info(`Project root located: ${this.appRoot}`);
  }

  /**
   * Serve static HTML files
   */
  private static(): void {
    this.app.use("/", express.static(path.join(this.appRoot, "client/dist")));
  }

  /**
   * Configures the server port
   */
  private ports(): void {
    this.port = process.env.SERVER_PORT || process.env.PORT!;
  }

  /**
   * Configures the database connection
   */
  private database(): void {
    this.logger.info(
      `Attempting to connect to database: ${process.env.DB_HOST}`
    );
    mongoose
      .connect(process.env.DB_HOST!, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      })
      .catch((err: string) => {
        this.logger.error("Failed to connect to database");
      });

    // If a connect has not yet been attempted
    if (!this.db) {
      this.db = mongoose.connection;
      this.db.on("error", err => {
        this.logger.error("Database error occured: " + err)
        this.logger.error("Attempting to reconnect in 15 seconds...");
        setTimeout(() => this.database(), 15000);
      });
      this.db.once("open", () => {
        this.logger.info("Successfully connected to database");
        this.app.emit('ready');
      });
    }
  }

  /**
   * Configures middlwares
   */
  private middleware(): void {
    this.logger.info("Configuring middleware");
    applyMiddleware(middleware, this.app);
  }

  /**
   * Configures the API routes
   */
  private routes(): void {
    this.logger.info("Setting API routes");
    this.app.use("/_api", router);
  }

  /**
   * Initiates the web socket and sets socket listeners
   */
  private socket(): void {
    this.logger.info("Setting web socket listeners")
    try {
      this.io = SocketIO(this.server);
      this.io.on("connection", socket => {
        this.logger.info(
          `Client connection from address: ${socket.handshake.address}`
        );
        socket.on("disconnect", () => {
          this.logger.info(
            `Client disconnected from address: ${socket.handshake.address}`
          );
        });
        socket.on("UPDATE_ACK", () => {
          this.logger.info(
            `Change acknowledgement received from address: ${socket.handshake.address}`
          );
        });
        socket.on("reconnect", () => {
          this.logger.info(
            `Client re-established connection from address: ${socket.handshake.address}`
          );
        });
      });
    } catch (err) {
      this.logger.error("Error setting web socket listeners");
      this.stop(1);
    }
  }

  /**
   * Schedules execution of the monitor method
   */
  private schedule(): void {
    this.logger.info("Setting schedule for monitoring script");
    try {
      this.task = cron.schedule(this.scriptInterval, () => this.monitor(), {
        scheduled: true
      });
    } catch (err) {
      this.logger.info("Failed to schedule monitoring script");
      this.stop(1);
    }
  }

  /**
   * Executes and schedules the monitoring script
   */
  private async monitor(): Promise<void> {
    if (this.scriptRunning && this.scriptRunTime >= 10) {
      this.logger.warn("Script execution time has exceeded 10 minutes - Terminating and restarting...")
      await this.shell.dispose();
    }
    else if (this.scriptRunning) {
      this.scriptRunTime += 2;
      this.logger.info("Last execution of monitoring script still in progress");
      this.logger.info(`Script has been running for ${this.scriptRunTime} minutes`);
      return
    }
    this.shell = new shell({
      pwsh: true,
      executionPolicy: "Bypass",
      noProfile: true
    });
    this.shell.addCommand(
      `&"${path.join(this.appRoot, "server/scripts/Get-SiteStatus.ps1")}"`
    );
    this.logger.info("Executing Powershell monitoring script...");
    this.scriptRunning = true;
    this.scriptRunTime = 0;
    this.shell.invoke()
      .then(async (output: any) => {
        this.logger.info("Powershell monitoring script completed");
        this.scriptRunning = false;
        await this.shell.dispose();
      })
      .catch(async (err: any) => {
        this.logger.error("Powershell script completed with errors");
        this.scriptRunning = false;
        await this.shell.dispose();
      });
  }

  /**
   * Starts the server
   */
  private start(): void {
    this.server = this.app.listen(this.port, () => {
      this.logger.info(`Server listening on port ${this.port}`);
    });
  }

  /**
   * Terminates the server
   */
  public stop(exitCode: number): void {
    this.logger.info("Stopping server...");
    process.exit(exitCode);
  }

  /**
   * Retrives the IO connection
   */
  public getSocketConnection(): SocketIO.Server {
    return this.io;
  }
}
