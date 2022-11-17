import APPS from "package/internal/apps";
import { useState } from "react";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { LoaderFunction } from "@remix-run/node";
import listExtensionsMetadata from "~/data/listExtensionsMetadata.server";
export { default as CatchBoundary } from "@dvargas92495/app/components/DefaultCatchBoundary";
export { default as ErrorBoundary } from "@dvargas92495/app/components/DefaultErrorBoundary";

const userApps = APPS.slice(1).map(({ name }) => ({
  id: name.toLowerCase(),
  name,
}));

type InstructionSteps = {
  title: string;
  children: "link" | "image" | React.ReactNode;
}[];

const Instruction = ({
  id,
  steps,
}: {
  id: string;
  steps: InstructionSteps;
}) => {
  const data =
    useLoaderData<Awaited<ReturnType<typeof listExtensionsMetadata>>>();
  return (
    <div className="flex justify-between items-start gap-8 h-full">
      {steps.map((s, i) => (
        <div className="flex-1 flex flex-col justify-between h-44" key={i}>
          <h2 className="font-semibold text-xl flex-grow">
            {i + 1}. {s.title}
          </h2>
          {s.children === "link" ? (
            <a
              className={
                "px-4 py-2 font-normal rounded-full bg-sky-500 shadow-sm hover:bg-sky-700 active:bg-sky-900 hover:shadow-md active:shadow-none disabled:cursor-not-allowed disabled:bg-opacity-50 disabled:opacity-50 disabled:hover:bg-sky-500 disabled:hover:shadow-none disabled:active:bg-sky-500 disabled:hover:bg-opacity-50 justify-between flex items-baseline"
              }
              href={"href" in data ? data.href : data.versions[id][0].href}
              download={`${id}-samepage.zip`}
            >
              <span className={"text-xs opacity-50"}>
                <>
                  <svg
                    height={20}
                    width={20}
                    viewBox="0 0 20 20"
                    className={"inline"}
                  >
                    <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm4.71 11.71l-4 4c-.18.18-.43.29-.71.29s-.53-.11-.71-.29l-4-4a1.003 1.003 0 011.42-1.42L9 12.59V5c0-.55.45-1 1-1s1 .45 1 1v7.59l2.29-2.29c.18-.19.43-.3.71-.3a1.003 1.003 0 01.71 1.71z" />
                  </svg>{" "}
                  (v{"version" in data ? data.version : data.versions[id][0].version})
                </>
              </span>
            </a>
          ) : s.children === "image" ? (
            <img
              src={`/images/install/${id}-${i + 1}.png`}
              className="rounded-md"
            />
          ) : (
            s.children
          )}
        </div>
      ))}
    </div>
  );
};

const INSTRUCTIONS: Record<string, InstructionSteps> = {
  samepage: [],
  roam: [
    {
      title: `Download & Unzip`,
      children: "link",
    },
    {
      title: "Open Roam Depot",
      children: "image",
    },
    {
      title: "Enable Developer Mode",
      children: "image",
    },
    {
      title: "Load roam-samepage!",
      children: "image",
    },
  ],
  logseq: [
    {
      title: `Download & Unzip`,
      children: "link",
    },
    {
      title: `Enable Developer Mode In Settings`,
      children: "image",
    },
    {
      title: `Open Plugins Dashboard`,
      children: "image",
    },
    {
      title: `Load logseq-samepage!`,
      children: "image",
    },
  ],
  obsidian: [
    {
      title: `Download & Unzip`,
      children: "link",
    },
    {
      title: `Copy to .obsidian/plugins`,
      children: "image",
    },
    {
      title: `Open Community Plugins`,
      children: "image",
    },
    {
      title: `Enable obsidian-samepage!`,
      children: "image",
    },
  ],
};

const InstallPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedApp, setSelectedApp] = useState(
    searchParams.get("id") || userApps[0].id
  );
  const name = userApps.find((a) => a.id === selectedApp)?.name;

  return (
    <div className="flex flex-col items-center max-w-4xl w-full">
      <div className="rounded-full border-sky-600 border mb-12 inline-flex items-center justify-center">
        {userApps.map(({ id, name }) => {
          const selected = selectedApp === id;
          return (
            <div
              onClick={() => {
                setSelectedApp(id);
                setSearchParams({ id });
              }}
              key={id}
              className={`cursor-pointer py-2 px-4 first:rounded-l-full last:rounded-r-full ${
                selected ? "text-white bg-sky-600" : "text-sky-600 bg-white"
              }`}
            >
              {name}
            </div>
          );
        })}
      </div>
      <h1 className="font-bold text-3xl mb-8">Install SamePage in {name}</h1>
      <img src={`/images/${selectedApp}.png`} width={300} height={300} />
      <div className="rounded-md shadow-xl mb-8 flex flex-col p-10 w-full">
        <Instruction id={selectedApp} steps={INSTRUCTIONS[selectedApp]} />
      </div>
      <div className="italic text-sm">
        *Note: You will need to obtain an invite code from the team to access
        the network. SamePage extensions are currently under{" "}
        <b className="font-bold">heavy</b> development and these links will
        update frequently with the latest version. Do not use for any sensitive
        or important data.
      </div>
    </div>
  );
};

export const loader: LoaderFunction = listExtensionsMetadata;

export default InstallPage;
