import sendEmail from "@dvargas92495/app/backend/sendEmail.server";
import React from "react";

const renderToolRequest = ({
  tool,
  message,
}: {
  tool: string;
  message: string;
}) =>
  React.createElement(
    React.Fragment,
    {},
    React.createElement(
      "div",
      {},
      `User has requested ${tool} be added to the SamePage Network.`
    ),
    React.createElement("div", {}, message)
  );

const RENDERS: Record<string, (args: any) => React.ReactElement> = {
  "tool-request": renderToolRequest,
};

export const handler = ({
  bodyComponent,
  bodyProps,
  ...params
}: {
  to: string;
  replyTo: string;
  subject: string;
  bodyProps: Record<string, unknown>;
  bodyComponent: string;
}) => {
  return sendEmail({
    ...params,
    body: RENDERS[bodyComponent](bodyProps),
  });
};