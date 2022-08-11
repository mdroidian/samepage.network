export type json =
  | string
  | number
  | boolean
  | null
  | { toJSON: () => string }
  | json[]
  | { [key: string]: json };

export type AppEvent = {
  id: string;
  content: string;
  intent?: "info" | "warning" | "error" | "success";
};

export type Stats = {
  minutes: 0;
  messages: 0;
  date: "";
};

export type MessageHandlers = {
  [operation: string]: (data: json, source: Notebook) => void;
};

export type AddCommand = (args: {
  label: string;
  callback: () => void;
}) => void;
export type RemoveCommand = (args: { label: string }) => void;
export type Notebook = { app: number; workspace: string };
export type Status = "DISCONNECTED" | "PENDING" | "CONNECTED";

export type SharedPages = {
  indices: Record<string, number>;
  ids: Set<number>;
  idToUid: Record<string, string>;
};

export type NotificationHandler = (
  args: Record<string, string>
) => Promise<void>;
export type AddNotebookListener = (args: {
  operation: string;
  handler: (e: json, source: Notebook) => void;
}) => void;
export type RemoveNotebookListener = (args: { operation: string }) => void;
export type SendToNotebook = (args: {
  target: Notebook;
  operation: string;
  data?: { [k: string]: json };
}) => void;
export type SendToBackend = (args: {
  operation: string;
  data?: { [key: string]: json };
  unauthenticated?: boolean;
}) => void;

declare global {
  interface Window {
    samepage: {
      addNotebookListener: AddNotebookListener;
      removeNotebookListener: RemoveNotebookListener;
      sendToNotebook: SendToNotebook;
    };
  }
}
