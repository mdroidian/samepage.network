import {
  Button,
  Classes,
  Drawer,
  DrawerSize,
  IconName,
  MaybeElement,
  Popover,
  Spinner,
  Tooltip,
} from "@blueprintjs/core";
import { appNameById } from "@samepage/shared";
import React, { useState, useRef, useEffect } from "react";
import type setupSharePageWithNotebook from "../protocols/sharePageWithNotebook";
import SharePageDialog from "./SharePageDialog";

type SharePageReturn = ReturnType<typeof setupSharePageWithNotebook>;

export type Props = {
  notebookPageId: string;
  portalContainer?: HTMLElement;
} & Partial<
  Pick<
    SharePageReturn,
    | "disconnectPage"
    | "sharePage"
    | "forcePushPage"
    | "listConnectedNotebooks"
    | "getLocalHistory"
  >
>;

const formatVersion = (s: number) =>
  s ? new Date(s * 1000).toLocaleString() : "unknown";

const ConnectedNotebooks = ({
  notebookPageId,
  listConnectedNotebooks,
}: {
  notebookPageId: string;
  listConnectedNotebooks: SharePageReturn["listConnectedNotebooks"];
}) => {
  const [loading, setLoading] = useState(true);
  const [notebooks, setNotebooks] = useState<
    Awaited<ReturnType<SharePageReturn["listConnectedNotebooks"]>>["notebooks"]
  >([]);
  const [networks, setNetworks] = useState<
    Awaited<ReturnType<SharePageReturn["listConnectedNotebooks"]>>["networks"]
  >([]);
  useEffect(() => {
    listConnectedNotebooks(notebookPageId)
      .then((r) => {
        setNotebooks(r.notebooks);
        setNetworks(r.networks);
      })
      .finally(() => setLoading(false));
  }, [setLoading]);
  return (
    <div className="flex p-4 rounded-md flex-col max-w-sm w-full">
      {loading ? (
        <Spinner />
      ) : (
        <>
          <h3 className="text-lg font-bold">Notebooks:</h3>
          <ul>
            {notebooks.map((c) => (
              <li key={`${c.app}-${c.workspace}`}>
                <div className="flex items-center justify-between text-base">
                  <span>
                    {c.app}/{c.workspace}
                  </span>
                  <span className="opacity-75 text-gray-600 text-xs">
                    {formatVersion(c.version)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <h3 className="text-lg font-bold">Networks:</h3>
          <ul>
            {networks.map((c) => (
              <li key={`${c.app}-${c.workspace}`}>
                <div className="flex items-center justify-between text-base">
                  <span>
                    {c.app}/{c.workspace}
                  </span>
                  <span className="opacity-75 text-gray-600 text-xs">
                    {formatVersion(c.version)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

const parseActorId = (s: string) =>
  s
    .split("")
    .map((c, i, a) =>
      i % 2 === 0 ? String.fromCharCode(parseInt(c + a[i + 1], 16)) : ""
    )
    .join("")
    .replace(/^\d+\//, (val) => `${appNameById[val.slice(0, -1)]}/`);

const HistoryContent = ({
  getHistory,
}: {
  getHistory: () => ReturnType<SharePageReturn["getLocalHistory"]>;
}) => {
  const [history, setHistory] = useState<
    Awaited<ReturnType<SharePageReturn["getLocalHistory"]>>
  >([]);
  useEffect(() => {
    getHistory().then(setHistory);
  }, [getHistory, setHistory]);
  return (
    <div className="flex flex-col-reverse text-gray-800 w-full border border-gray-800 overflow-auto justify-end">
      {history.map((l, index) => (
        <div key={index} className={"border-t border-t-gray-800 p-4 relative"}>
          <div className={"text-sm absolute top-2 right-2"}>{index}</div>
          <div>
            <span className={"font-bold"}>Action: </span>
            <span>{l.change.message}</span>
          </div>
          <div>
            <span className={"font-bold"}>Actor: </span>
            <span>{parseActorId(l.change.actor)}</span>
          </div>
          <div>
            <span className={"font-bold"}>Date: </span>
            <span>{new Date(l.change.time * 1000).toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

const TooltipButtonOverlay = ({
  Overlay = () => <div />,
  icon,
  portalContainer,
  tooltipContent,
}: {
  Overlay?: (props: {
    isOpen: boolean;
    onClose: () => void;
    portalContainer?: HTMLElement;
  }) => React.ReactElement;
  icon?: IconName | MaybeElement;
  portalContainer?: HTMLElement;
  tooltipContent?: string | JSX.Element | undefined;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Tooltip content={tooltipContent} portalContainer={portalContainer}>
        <Button
          icon={icon}
          minimal
          disabled={isOpen}
          onClick={() => {
            setIsOpen(true);
          }}
        />
      </Tooltip>
      <Overlay
        onClose={() => setIsOpen(false)}
        isOpen={isOpen}
        portalContainer={portalContainer}
      />
    </>
  );
};

const SharedPageStatus = ({
  notebookPageId,
  portalContainer,
  sharePage = () => Promise.resolve(),
  disconnectPage = () => Promise.resolve(),
  forcePushPage = () => Promise.resolve(),
  listConnectedNotebooks = () =>
    Promise.resolve({ networks: [], notebooks: [] }),
  getLocalHistory = () => Promise.resolve([]),
}: Props) => {
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  return (
    <span
      className="samepage-shared-page-status flex gap-4 items-center text-lg mb-8 shadow-sm px-2 py-4"
      ref={containerRef}
    >
      <i>Shared</i>
      <Tooltip
        content={"Notebooks Connected"}
        portalContainer={portalContainer}
      >
        <Popover
          content={
            <ConnectedNotebooks
              notebookPageId={notebookPageId}
              listConnectedNotebooks={listConnectedNotebooks}
            />
          }
          target={<Button icon={"info-sign"} minimal disabled={loading} />}
          portalContainer={portalContainer}
        />
      </Tooltip>
      <TooltipButtonOverlay
        tooltipContent={"View History"}
        portalContainer={portalContainer}
        icon={"history"}
        Overlay={(props) => (
          <Drawer
            {...props}
            title={"History"}
            position={"left"}
            hasBackdrop={false}
            size={DrawerSize.SMALL}
          >
            <div className={Classes.DRAWER_BODY}>
              <HistoryContent
                getHistory={() => getLocalHistory(notebookPageId)}
              />
            </div>
          </Drawer>
        )}
      />
      <TooltipButtonOverlay
        tooltipContent={"Invite Notebook"}
        portalContainer={portalContainer}
        icon={"plus"}
        Overlay={(props) => (
          <SharePageDialog
            {...props}
            onSubmit={({ notebooks }) =>
              sharePage({ notebooks, notebookPageId })
            }
          />
        )}
      />
      <Tooltip
        content={"Disconnect Shared Page"}
        portalContainer={portalContainer}
      >
        <Button
          disabled={loading}
          icon={"th-disconnect"}
          minimal
          onClick={() => {
            setLoading(true);
            disconnectPage(notebookPageId).finally(() => setLoading(false));
          }}
        />
      </Tooltip>
      <Tooltip
        content={"Force Push Local Copy"}
        portalContainer={portalContainer}
      >
        <Button
          disabled={loading}
          icon={"warning-sign"}
          minimal
          onClick={() => {
            setLoading(true);
            forcePushPage(notebookPageId).finally(() => setLoading(false));
          }}
        />
      </Tooltip>
    </span>
  );
};

export default SharedPageStatus;