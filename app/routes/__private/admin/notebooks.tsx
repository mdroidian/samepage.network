import { ActionFunction, LoaderFunction, redirect } from "@remix-run/node";
import { Outlet, Form, useLoaderData } from "@remix-run/react";
import Table from "~/components/Table";
import remixAdminLoader from "~/data/remixAdminLoader.server";
import listNotebooks from "~/data/listNotebooks.server";
import TextInput from "~/components/TextInput";
import Button from "~/components/Button";
import remixAdminAction from "~/data/remixAdminAction.server";
import createNotebook from "~/data/createNotebook.server";
import StatPanels from "~/components/StatPanels";
export { default as ErrorBoundary } from "~/components/DefaultErrorBoundary";

const ORDER = ["total", "accepted", "online", "sessions", "messages"];

const NotebooksPage = () => {
  const { stats } = useLoaderData<Awaited<ReturnType<typeof listNotebooks>>>();
  return (
    <div className={"flex gap-8 items-start"}>
      <div className="max-w-3xl w-full">
        <Form method="get" className="flex items-center max-w-lg gap-8">
          <TextInput
            label={"Search"}
            name={"search"}
            placeholder={"Search by workspace"}
            className={"flex-grow"}
          />
          <Button>Search</Button>
        </Form>
        <Table
          onRowClick={"uuid"}
          renderCell={{
            connected: (v) =>
              typeof v === "number"
                ? new Date(v).toLocaleString()
                : (v as string),
            invited: (v) =>
              typeof v === "number"
                ? new Date(v).toLocaleString()
                : (v as string),
          }}
        />
        <StatPanels stats={stats} order={ORDER} />
        <Form method={"post"} className={"mt-12"}>
          <h3 className="text-base font-normal mb-4">
            Create SamePage Test Notebook
          </h3>
          <TextInput name={"workspace"} />
          <Button>Create</Button>
        </Form>
      </div>
      <div className={"flex-grow-1 overflow-auto"}>
        <Outlet />
      </div>
    </div>
  );
};

export const loader: LoaderFunction = (args) => {
  return remixAdminLoader(args, ({ context: { requestId }, searchParams }) =>
    listNotebooks(requestId, searchParams)
  );
};

export const action: ActionFunction = (args) => {
  return remixAdminAction(args, {
    POST: ({ context: { requestId }, data, userId }) =>
      createNotebook({
        requestId,
        app: 0,
        workspace: data["workspace"]?.[0] || "",
        userId,
      }).then(({ notebookUuid }) =>
        redirect(`/admin/notebooks/${notebookUuid}`)
      ),
  });
};

export const handle = {
  Title: "Notebooks",
};

export default NotebooksPage;
