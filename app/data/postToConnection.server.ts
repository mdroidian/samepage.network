import { v4 } from "uuid";
import axios from "axios";
import { ApiGatewayManagementApi } from "@aws-sdk/client-apigatewaymanagementapi";

const getApi = (): ApiGatewayManagementApi =>
  new ApiGatewayManagementApi({
    endpoint: `https://${process.env.API_GATEWAY_ID}.execute-api.us-east-1.amazonaws.com/production`,
  });

type SendData = {
  ConnectionId: string;
  Data: Record<string, unknown>;
  uuid?: string;
};

const MESSAGE_LIMIT = 15750; // 16KB minus 250b buffer for metadata

const getSender = (ConnectionId: string) => {
  if (process.env.NODE_ENV === "production") {
    const api = getApi();
    return (data: string) =>
      api
        .postToConnection({
          ConnectionId,
          Data: new Uint8Array(Buffer.from(data)),
        })
        .then(() => Promise.resolve());
  } else if (process.env.NODE_ENV === "test") {
    return (_data: string) => Promise.resolve();
  } else {
    return (Data: string) => {
      return axios
        .post<{ success: boolean }>("http://localhost:3003/ws", {
          ConnectionId,
          Data,
        })
        .then((r) => {
          if (r.data.success) {
            return Promise.resolve();
          } else {
            // TODO = do a better job emulating AWS' web socket postToConnection behavior
            return Promise.reject(new Error("No connection"));
          }
        });
    };
  }
};

const postToConnection: (params: SendData) => Promise<void> = (params) => {
  const fullMessage = JSON.stringify(params.Data);
  const uuid = params.uuid || v4();
  const size = Buffer.from(fullMessage).length;
  const total = Math.ceil(size / MESSAGE_LIMIT);
  const chunkSize = Math.ceil(fullMessage.length / total);
  const sender = getSender(params.ConnectionId);
  return Array(total)
    .fill(null)
    .map((_, chunk) => {
      const message = fullMessage.slice(
        chunkSize * chunk,
        chunkSize * (chunk + 1)
      );
      return () =>
        sender(
          JSON.stringify({
            message,
            uuid,
            chunk,
            total,
          })
        );
    })
    .reduce((p, c) => p.then(c), Promise.resolve());
};

export default postToConnection;
