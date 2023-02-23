import APPS from "package/internal/apps";
import { useState } from "react";
import { useLoaderData, useSearchParams, Link } from "@remix-run/react";
import { LoaderFunction } from "@remix-run/node";
import listExtensionsMetadata from "~/data/listExtensionsMetadata.server";
import OverlayImg from "~/components/OverlayImg";
import ExternalLink from "~/components/ExternalLink";
export { default as CatchBoundary } from "~/components/DefaultCatchBoundary";
export { default as ErrorBoundary } from "~/components/DefaultErrorBoundary";

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
  live,
}: {
  id: string;
  steps: InstructionSteps;
  live: boolean;
}) => {
  const data =
    useLoaderData<Awaited<ReturnType<typeof listExtensionsMetadata>>>();
  return (
    <>
      {!live && (
        <div className="italic mb-2 text-xs opacity-50">
          This extension is still under review. These are the steps to install
          the development version.
        </div>
      )}
      <div className="flex justify-between items-start gap-8 h-full">
        {steps.map((s, i) => (
          <div className="flex-1 flex flex-col h-44" key={i}>
            <h2 className="font-semibold text-xl mb-4">
              {i + 1}. {s.title}
            </h2>
            <div className="flex-grow flex flex-col justify-center items-center">
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
                      (v
                      {"version" in data
                        ? data.version
                        : data.versions[id][0].version}
                      )
                    </>
                  </span>
                </a>
              ) : s.children === "image" ? (
                <OverlayImg
                  src={`/images/install/${id}${live ? "-live" : ""}-${
                    i + 1
                  }.png`}
                />
              ) : (
                s.children
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

const INSTRUCTIONS: Record<string, { steps: InstructionSteps; live: boolean }> =
  {
    samepage: { steps: [], live: true },
    roam: {
      steps: [
        {
          title: "Open Roam Depot",
          children: "image",
        },
        {
          title: "Search SamePage",
          children: "image",
        },
        {
          title: "Install!",
          children: "image",
        },
      ],
      live: true,
    },
    logseq: {
      steps: [
        {
          title: `Go to plugins dashboard`,
          children: "image",
        },
        {
          title: `Go to marketplace`,
          children: "image",
        },
        {
          title: `Search SamePage!`,
          children: "image",
        },
      ],
      live: true,
    },
    obsidian: {
      steps: [
        {
          title: `Go to Settings`,
          children: "image",
        },
        {
          title: `Browse Community Plugins`,
          children: "image",
        },
        {
          title: `Enable SamePage!`,
          children: "image",
        },
      ],
      live: true,
    },
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
        <Instruction id={selectedApp} {...INSTRUCTIONS[selectedApp]} />
      </div>
      <div className="italic text-sm mb-2">
        *Note: You will need to obtain an invite code from the team to access
        the network by emailing{" "}
        <ExternalLink href="mailto:support@samepage.network">
          support@samepage.network
        </ExternalLink>
        . SamePage extensions are currently under{" "}
        <b className="font-bold">heavy</b> development and these extensions will
        update frequently. Do not use with sensitive data.
      </div>
      <div className="italic text-sm mb-2 w-full">
        A more in depth guide on how to install SamePage is available{" "}
        <Link
          to={`/docs/${selectedApp}/install`}
          className={`text-sky-500 underline hover:no-underline active:text-sky-600 active:no-underline`}
        >
          in our docs.
        </Link>
      </div>
    </div>
  );
};

export const loader: LoaderFunction = listExtensionsMetadata;

export const handle = {
  mainClassName: "bg-gradient-to-b from-sky-50 to-inherit -mt-16 pt-32",
};

export const headers = () => {
  return {
    "Cache-Control": "max-age=86400, stale-while-revalidate=3600", // 1 day, 1 hour
  };
};

export default InstallPage;
