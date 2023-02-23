import "package/testing/setupJsdom";
import { test, expect } from "@playwright/test";
import userEvent from "@testing-library/user-event";
import { render, waitFor, cleanup } from "@testing-library/react";
import Onboarding from "../../../package/components/Onboarding";
import { v4 } from "uuid";
import React from "react";
import { Response } from "@remix-run/node";

test.afterEach(cleanup);

test("Intro onboarding flow", async () => {
  const user = userEvent.setup({ document });
  const credentials = { notebookUuid: "", token: "" };
  let isOpen = true;
  const screen = render(
    (
      <Onboarding
        isOpen={isOpen}
        onClose={() => (isOpen = false)}
        onSuccess={({ notebookUuid, token }) => {
          credentials.notebookUuid = notebookUuid;
          credentials.token = token;
        }}
        onCancel={() => {}}
      />
    ) as React.ReactElement // this case is just so that we could keep the react import
  );
  const home = await waitFor(() => screen.getByText("Welcome to SamePage!"), {
    timeout: 3000,
  });
  expect(home).toBeTruthy();

  const getStarted = screen.getByText("Get Started");
  await user.click(getStarted);
  const optionScreen = await waitFor(() =>
    screen.getByText("New to SamePage?")
  );
  expect(optionScreen).toBeTruthy();

  const startNotebook = screen.getByText("Start Notebook");
  await user.click(startNotebook);
  const connectScreen = await waitFor(() =>
    screen.getByText("Create an account to link this notebook")
  );
  expect(connectScreen).toBeTruthy();
  const emailInput = screen.getByLabelText("Email");
  await user.type(emailInput, "example@samepage.network");
  expect(emailInput).toHaveProperty("value", "example@samepage.network");
  const passwordInput = screen.getByLabelText("Password");
  const password = v4().slice(0, 8);
  await user.type(passwordInput, password);
  expect(passwordInput).toHaveProperty("value", password);
  const termsOfUse = screen.getByLabelText(
    "I have read and agree to the Terms of Use"
  );
  await user.click(termsOfUse);
  const createButton = screen.getByText("Create");
  const notebookUuid = v4();
  const token = v4().slice(0, 8);
  global.fetch = () =>
    Promise.resolve(
      new Response(JSON.stringify({ notebookUuid, token }), { status: 200 })
    );
  await user.click(createButton);

  const final = await waitFor(() => screen.getByText("Congratulations! 🎉"));
  expect(final).toBeTruthy();
  expect(credentials.notebookUuid).toEqual(notebookUuid);
  expect(credentials.token).toEqual(token);
  const allDone = screen
    .getAllByText("All Done")
    .find((e) => !!e.closest("button"));
  expect(allDone).toBeTruthy();
  await user.click(allDone!);
  expect(isOpen).toEqual(false);
});

test("Connect onboarding flow", async () => {
  const user = userEvent.setup({ document });
  const credentials = { notebookUuid: "", token: "" };
  const screen = render(
    (
      <Onboarding
        isOpen={true}
        onClose={() => {}}
        onSuccess={({ notebookUuid, token }) => {
          credentials.notebookUuid = notebookUuid;
          credentials.token = token;
        }}
        onCancel={() => {}}
      />
    ) as React.ReactElement // this case is just so that we could keep the react import
  );
  const home = await waitFor(() => screen.getByText("Welcome to SamePage!"), {
    timeout: 3000,
  });
  expect(home).toBeTruthy();

  const getStarted = screen.getByText("Get Started");
  await user.click(getStarted);
  const optionScreen = await waitFor(() =>
    screen.getByText("New to SamePage?")
  );
  expect(optionScreen).toBeTruthy();
  const connectNotebook = screen.getByText("Add Another Notebook");
  await user.click(connectNotebook);
  const connectScreen = await waitFor(() =>
    screen.getByText("Add this notebook to your account")
  );
  expect(connectScreen).toBeTruthy();
  const emailInput = screen.getByLabelText("Email");
  await user.type(emailInput, "example@samepage.network");
  expect(emailInput).toHaveProperty("value", "example@samepage.network");
  const passwordInput = screen.getByLabelText("Password");
  const password = v4().slice(0, 8);
  await user.type(passwordInput, password);
  expect(passwordInput).toHaveProperty("value", password);
  const termsOfUse = screen.getByLabelText(
    "I have read and agree to the Terms of Use"
  );
  await user.click(termsOfUse);
  const createButton = screen.getByText("Connect");
  const notebookUuid = v4();
  const token = v4().slice(0, 8);
  global.fetch = () => {
    return Promise.resolve(
      new Response(JSON.stringify({ notebookUuid, token }), {
        status: 200,
      })
    );
  };
  await user.click(createButton);

  const final = await waitFor(() => screen.getByText("Congratulations! 🎉"));
  expect(final).toBeTruthy();
  expect(credentials.notebookUuid).toEqual(notebookUuid);
  expect(credentials.token).toEqual(token);
});

test("Closing right away invokes cancel", async () => {
  const user = userEvent.setup({ document });
  let called = false;
  const screen = render(
    (
      <Onboarding
        isOpen={true}
        onClose={() => {}}
        onSuccess={() => {}}
        onCancel={() => (called = true)}
      />
    ) as React.ReactElement // this case is just so that we could keep the react import
  );
  const home = await waitFor(() => screen.getByText("Welcome to SamePage!"), {
    timeout: 3000,
  });
  expect(home).toBeTruthy();

  const close = screen.getByRole("button", { name: "Close" });
  expect(close).toBeTruthy();
  await user.click(close!);
  expect(called).toEqual(true);
});
