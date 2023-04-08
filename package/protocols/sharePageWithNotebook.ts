import apiClient from "../internal/apiClient";
import dispatchAppEvent from "../internal/dispatchAppEvent";
import {
  addCommand,
  removeCommand,
  renderOverlay,
  appRoot,
  actorId,
} from "../internal/registry";
import {
  ApplyState,
  InitialSchema,
  Schema,
  zInitialSchema,
  zRequestPageUpdateWebsocketMessage,
  zSharePageForceWebsocketMessage,
  zSharePageResponseWebsocketMessage,
  zSharePageUpdateWebsocketMessage,
  zSharePageWebsocketMessage,
} from "../internal/types";
import Automerge from "automerge";
import { addNotebookListener } from "../internal/setupMessageHandlers";
import { v4 } from "uuid";
import ViewSharedPages, {
  ViewSharedPagesProps,
} from "../components/ViewSharedPages";
import SharedPageStatus, {
  SharedPageStatusProps,
} from "../components/SharedPageStatus";
import createHTMLObserver from "../utils/createHTMLObserver";
import { onAppEvent } from "../internal/registerAppEventListener";
import binaryToBase64 from "../internal/binaryToBase64";
import { clear, has, deleteId, load, set } from "../utils/localAutomergeDb";
import changeAutomergeDoc from "../utils/changeAutomergeDoc";
import wrapSchema from "../utils/wrapSchema";
import parseZodError from "../utils/parseZodError";
import sendExtensionError from "../internal/sendExtensionError";
import { registerNotificationActions } from "../internal/notificationActions";
import handleSharePageOperation from "../internal/handleSharePageOperation";
import handleSharePageResponseOperation from "../internal/handleSharePageResponseOperation";
import handleSharePageUpdateOperation from "../internal/handleSharePageUpdateOperation";
import handleSharePageForceOperation from "../internal/handleSharePageForceOperation";
import handleRequestPageUpdateOperation from "../internal/handleRequestPageUpdateOperation";
import acceptSharePageOperation from "../internal/acceptSharePageOperation";

const COMMAND_PALETTE_LABEL = "Share Page on SamePage";
const VIEW_COMMAND_PALETTE_LABEL = "View Shared Pages";

type SharedPageObserver = ({
  onload,
  onunload,
}: {
  onload: (notebookPageId: string) => void;
  onunload: (notebookPageId: string) => void;
}) => () => void;

const setupSharePageWithNotebook = ({
  overlayProps = {},
  getCurrentNotebookPageId = () => Promise.resolve(v4()),
  createPage = () => Promise.resolve(),
  openPage = () => Promise.resolve(),
  deletePage = () => Promise.resolve(),
  doesPageExist = () => Promise.resolve(false),
  applyState = () => Promise.resolve(),
  calculateState = () => Promise.resolve({ annotations: [], content: "" }),
  onConnect,
}: {
  overlayProps?: {
    viewSharedPageProps?: ViewSharedPagesProps;
    sharedPageStatusProps?: {
      selector?: string;
      getNotebookPageId?: (element: Node) => Promise<string | null>;
      onCopy?: SharedPageStatusProps["onCopy"];
      getPaths: (notebookPageId: string) => string[];
      observer?: SharedPageObserver;
    };
  };
  getCurrentNotebookPageId?: () => Promise<string>;
  createPage?: (notebookPageId: string) => Promise<unknown>;
  openPage?: (notebookPageId: string) => Promise<unknown>;
  deletePage?: (notebookPageId: string) => Promise<unknown>;
  doesPageExist?: (notebookPageId: string) => Promise<boolean>;
  applyState?: ApplyState;
  calculateState?: (notebookPageId: string) => Promise<InitialSchema>;
  onConnect?: () => () => void;
} = {}) => {
  const { viewSharedPageProps, sharedPageStatusProps } = overlayProps;

  const unloadCallbacks: Record<string, () => void> = {};
  const renderSharedPageStatus = ({
    notebookPageId,
    created = false,
    path,
  }: {
    notebookPageId: string;
    path: string;
    created?: boolean;
  }) => {
    const unmount = renderOverlay({
      id: `samepage-shared-${notebookPageId.replace(/[^\w_-]/g, "")}`,
      Overlay: SharedPageStatus,
      props: {
        notebookPageId,
        defaultOpenInviteDialog: created,
        portalContainer: appRoot,
        onCopy: sharedPageStatusProps?.onCopy,
      },
      path,
    });
    unloadCallbacks[`samepage-shared-${notebookPageId}`] = () => {
      delete unloadCallbacks[`samepage-shared-${notebookPageId}`];
      unmount?.();
    };
  };

  const initPage = ({
    notebookPageId,
    created = false,
  }: {
    notebookPageId: string;
    created?: boolean;
  }) => {
    if (sharedPageStatusProps) {
      sharedPageStatusProps
        .getPaths(notebookPageId)
        .forEach((path) =>
          renderSharedPageStatus({ notebookPageId, created, path })
        );
    }
  };

  const linkNewPage = ({
    title,
    oldNotebookPageId,
    newNotebookPageId,
  }: {
    title: string;
    oldNotebookPageId: string;
    newNotebookPageId: string;
  }) =>
    apiClient({
      oldNotebookPageId,
      newNotebookPageId,
      method: "link-different-page",
    })
      .then(() => {
        load(oldNotebookPageId).then((doc) => {
          set(newNotebookPageId, doc);
          deleteId(oldNotebookPageId);
        });
        dispatchAppEvent({
          type: "log",
          id: "link-page-success",
          content: `Successfully linked ${title} to shared page!`,
          intent: "info",
        });
      })
      .catch((e) =>
        dispatchAppEvent({
          type: "log",
          id: "link-page-success",
          content: `Failed to link to new shared page: ${e.message}`,
          intent: "error",
        })
      );

  let offConnect: (() => void) | undefined;
  const offAppEvent = onAppEvent("connection", (e) => {
    if (e.status === "CONNECTED") {
      if (sharedPageStatusProps) {
        const observerProps: Parameters<SharedPageObserver>[0] = {
          onload: (notebookPageId) => {
            has(notebookPageId).then(
              (exists) =>
                exists &&
                sharedPageStatusProps
                  .getPaths(notebookPageId)
                  .forEach((path) =>
                    renderSharedPageStatus({ path, notebookPageId })
                  )
            );
          },
          onunload: (notebookPageId) => {
            if (notebookPageId) {
              unloadCallbacks[`samepage-shared-${notebookPageId}`]?.();
            }
          },
        };
        const sharedPageObserver = sharedPageStatusProps.observer
          ? { disconnect: sharedPageStatusProps.observer(observerProps) }
          : createHTMLObserver({
              selector: sharedPageStatusProps.selector || "body",
              callback: (el) =>
                sharedPageStatusProps
                  .getNotebookPageId?.(el)
                  .then((s) => s && observerProps.onload(s)),
              onRemove: (el) =>
                sharedPageStatusProps
                  .getNotebookPageId?.(el)
                  .then((s) => s && observerProps.onunload(s)),
            });
        unloadCallbacks["shared-page-observer"] = () => {
          delete unloadCallbacks["shared-page-observer"];
          sharedPageObserver.disconnect();
        };
      }

      registerNotificationActions({
        operation: "SHARE_PAGE",
        actions: {
          accept: acceptSharePageOperation({
            doesPageExist,
            createPage,
            openPage,
            deletePage,
            applyState,
            calculateState,
            initPage,
          }),
          reject: async ({ title }) =>
            apiClient({
              method: "remove-page-invite",
              notebookPageId: title,
            }),
        },
      });

      unloadCallbacks["SHARE_PAGE"] = addNotebookListener({
        operation: "SHARE_PAGE",
        handler: (e, source, uuid) =>
          handleSharePageOperation(
            zSharePageWebsocketMessage.parse(e),
            source,
            uuid
          ),
      });

      unloadCallbacks["SHARE_PAGE_RESPONSE"] = addNotebookListener({
        operation: "SHARE_PAGE_RESPONSE",
        handler: (data, source) =>
          handleSharePageResponseOperation(
            zSharePageResponseWebsocketMessage.parse(data),
            source
          ),
      });

      unloadCallbacks["SHARE_PAGE_UPDATE"] = addNotebookListener({
        operation: "SHARE_PAGE_UPDATE",
        handler: async (data) =>
          handleSharePageUpdateOperation(
            zSharePageUpdateWebsocketMessage.parse(data),
            applyState
          ),
      });

      unloadCallbacks["SHARE_PAGE_FORCE"] = addNotebookListener({
        operation: "SHARE_PAGE_FORCE",
        handler: (data) =>
          handleSharePageForceOperation(
            zSharePageForceWebsocketMessage.parse(data),
            applyState
          ),
      });

      unloadCallbacks["REQUEST_PAGE_UPDATE"] = addNotebookListener({
        operation: "REQUEST_PAGE_UPDATE",
        handler: (data, source) =>
          handleRequestPageUpdateOperation(
            zRequestPageUpdateWebsocketMessage.parse(data),
            source
          ),
      });

      if (viewSharedPageProps)
        addCommand({
          label: VIEW_COMMAND_PALETTE_LABEL,
          callback: () => {
            apiClient<{ notebookPageIds: string[] }>({
              method: "list-shared-pages",
            }).then((props) =>
              renderOverlay({
                id: "samepage-view-shared-pages",
                Overlay: ViewSharedPages,
                props: {
                  ...props,
                  ...viewSharedPageProps,
                  linkNewPage: (oldNotebookPageId, title) =>
                    (viewSharedPageProps.linkNewPage
                      ? viewSharedPageProps.linkNewPage(
                          oldNotebookPageId,
                          title
                        )
                      : Promise.resolve(v4())
                    ).then((newNotebookPageId) => {
                      if (!newNotebookPageId) {
                        dispatchAppEvent({
                          type: "log",
                          id: "link-shared-page",
                          content: `Unable to link page: ${title}`,
                          intent: "error",
                        });
                        return "";
                      }
                      return linkNewPage({
                        oldNotebookPageId,
                        newNotebookPageId,
                        title,
                      }).then(() => newNotebookPageId);
                    }),
                  portalContainer: appRoot,
                },
              })
            );
          },
        });

      addCommand({
        label: COMMAND_PALETTE_LABEL,
        callback: () => {
          return getCurrentNotebookPageId()
            .then((notebookPageId) =>
              notebookPageId
                ? calculateState(notebookPageId).then((docInit) => {
                    const doc = Automerge.from<Schema>(wrapSchema(docInit), {
                      actorId: actorId.replace(/-/g, ""),
                    });
                    set(notebookPageId, doc);
                    const state = Automerge.save(doc);
                    return apiClient<{ id: string; created: boolean }>({
                      method: "init-shared-page",
                      notebookPageId,
                      state: binaryToBase64(state),
                    })
                      .then(async (r) => {
                        if (r.created) {
                          initPage({
                            notebookPageId,
                            created: true,
                          });
                          dispatchAppEvent({
                            type: "log",
                            id: "init-page-success",
                            content: `Successfully initialized shared page! Click on the invite button below to share the page with other notebooks!`,
                            intent: "info",
                          });
                        } else {
                          dispatchAppEvent({
                            type: "log",
                            id: "samepage-warning",
                            content:
                              "This page is already shared from this notebook",
                            intent: "warning",
                          });
                          return Promise.resolve();
                        }
                      })
                      .catch((e) => {
                        deleteId(notebookPageId);
                        throw e;
                      });
                  })
                : Promise.reject(new Error(`Failed to detect a page to share`))
            )
            .catch((e) => {
              dispatchAppEvent({
                type: "log",
                intent: "error",
                id: "init-page-failure",
                content: `Failed to share page on network: ${e.message}`,
              });
            });
        },
      });

      offConnect = onConnect?.();
    } else if (e.status === "DISCONNECTED") {
      unload();
    }
  });

  const unload = () => {
    clear();
    offConnect?.();
    Object.values(unloadCallbacks).forEach((u) => u());
    removeCommand({
      label: COMMAND_PALETTE_LABEL,
    });
    removeCommand({
      label: VIEW_COMMAND_PALETTE_LABEL,
    });
  };

  const updatePage = ({
    notebookPageId,
    label,
    callback,
  }: {
    notebookPageId: string;
    label: string;
    callback: (doc: Schema) => void;
  }) => {
    return load(notebookPageId).then((oldDoc) => {
      const doc = Automerge.change(oldDoc, label, callback);
      set(notebookPageId, doc);
      return apiClient({
        method: "update-shared-page",
        changes: Automerge.getChanges(oldDoc, doc).map(binaryToBase64),
        notebookPageId,
        state: binaryToBase64(Automerge.save(doc)),
      });
    });
  };

  const refreshContent = async ({
    label = "Refresh",
    notebookPageId,
  }: {
    label?: string;
    notebookPageId: string;
  }) => {
    return calculateState(notebookPageId)
      .then(async (doc) => {
        const zResult = await zInitialSchema.safeParseAsync(doc);
        if (zResult.success) {
          return updatePage({
            notebookPageId,
            label,
            callback: async (oldDoc) => {
              changeAutomergeDoc(oldDoc, zResult.data);
            },
          });
        } else {
          // For now, just email error and run updatePage as normal. Should result in pairs of emails being sent I think.
          return sendExtensionError({
            type: "Failed to calculate valid document",
            data: {
              notebookPageId,
              doc,
              errors: zResult.error,
              message: parseZodError(zResult.error),
            },
          }).then((data) =>
            dispatchAppEvent({
              type: "log",
              intent: "error",
              content: `Failed to parse document. Error report ${data.messageId} has been sent to support@samepage.network`,
              id: `calculate-parse-error`,
            })
          );
        }
      })
      .catch((e) =>
        sendExtensionError({
          type: "Failed to calculate document",
          data: {
            notebookPageId,
          },
          error: e,
        }).then((data) =>
          dispatchAppEvent({
            type: "log",
            intent: "error",
            content: `Failed to calculate document. Error report ${data.messageId} has been sent to support@samepage.network`,
            id: `calculate-error`,
          })
        )
      );
  };

  return {
    unload: () => {
      offAppEvent();
      unload();
    },
    refreshContent,
    isShared: (notebookPageId: string) => has(notebookPageId),
  };
};

export default setupSharePageWithNotebook;
