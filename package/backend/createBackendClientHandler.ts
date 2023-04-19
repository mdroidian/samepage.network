import handleErrorOperation from "../internal/handleErrorOperation";
import handleSharePageForceOperation from "../internal/handleSharePageForceOperation";
import handleSharePageOperation from "../internal/handleSharePageOperation";
import handleSharePageResponseOperation from "../internal/handleSharePageResponseOperation";
import handleSharePageUpdateOperation from "../internal/handleSharePageUpdateOperation";
import handleRequestPageUpdateOperation from "../internal/handleRequestPageUpdateOperation";
import { onAppEvent } from "../internal/registerAppEventListener";
import {
  ApplyState,
  NotebookRequestHandler,
  NotebookResponseHandler,
  zBackendWebSocketMessage,
} from "../internal/types";
import sendEmail from "./sendEmail.server";
import handleRequestDataOperation from "../internal/handleRequestDataOperation";
import handleRequestOperation from "../internal/handleRequestOperation";
import sendExtensionError from "../internal/sendExtensionError";
import setupRegistry from "../internal/registry";
import OperationNotificationEmail from "../components/OperationNotificationEmail";

const createBackendClientHandler =
  ({
    applyState,
    notebookRequestHandler,
    notebookResponseHandler,
  }: {
    applyState: ApplyState;
    notebookRequestHandler: NotebookRequestHandler;
    notebookResponseHandler: NotebookResponseHandler;
  }) =>
  async (args: Record<string, unknown>) => {
    try {
      const { source, uuid, credentials, ...data } =
        zBackendWebSocketMessage.parse(args);
      setupRegistry({
        getSetting(s) {
          if (s === "uuid") return credentials.notebookUuid;
          if (s === "token") return credentials.token;
          return "";
        },
      });
      onAppEvent("log", (e) => {
        if (
          e.intent === "info" ||
          e.intent === "debug" ||
          e.intent === "success"
        )
          console.log(e.type, "-", e.content);
        if (e.intent === "warning") console.warn(e.type, "-", e.content);
        if (e.intent === "error") console.error(e.type, "-", e.content);
      });
      onAppEvent("notification", async (e) => {
        const to = credentials.email;
        await sendEmail({
          subject: e.notification.title,
          body: OperationNotificationEmail({
            description: e.notification.description,
            actions: e.notification.buttons,
            operation: e.notification.operation,
            messageUuid: e.notification.uuid,
          }),
          to,
        });
      });

      if (data.operation === "ERROR") {
        handleErrorOperation(data);
      } else if (data.operation === "AUTHENTICATION") {
        // TODO - Unsupported right?
      } else if (data.operation === "PONG") {
        // TODO - Unsupported right?
      } else if (data.operation === "SHARE_PAGE") {
        handleSharePageOperation(data, source, uuid);
      } else if (data.operation === "SHARE_PAGE_RESPONSE") {
        handleSharePageResponseOperation(data, source);
      } else if (data.operation === "SHARE_PAGE_UPDATE") {
        await handleSharePageUpdateOperation(data, applyState);
      } else if (data.operation === "SHARE_PAGE_FORCE") {
        await handleSharePageForceOperation(data, applyState);
      } else if (data.operation === "REQUEST_PAGE_UPDATE") {
        await handleRequestPageUpdateOperation(data, source);
      } else if (data.operation === "REQUEST_DATA") {
        handleRequestDataOperation(data, source, uuid);
      } else if (data.operation === "REQUEST") {
        await handleRequestOperation(data, source, [notebookRequestHandler]);
      } else if (data.operation === "RESPONSE") {
        await notebookResponseHandler(data.response);
      }
      return { success: true };
    } catch (e) {
      sendExtensionError({
        type: "Error in createBackendClientHandler",
        data: args,
        error: e as Error,
      });
      return { success: false };
    }
  };

export default createBackendClientHandler;
