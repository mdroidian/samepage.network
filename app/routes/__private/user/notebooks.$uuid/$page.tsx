import remixAppAction from "@dvargas92495/app/backend/remixAppAction.server";
import remixAppLoader from "@dvargas92495/app/backend/remixAppLoader.server";
export { default as CatchBoundary } from "@dvargas92495/app/components/DefaultCatchBoundary";
export { default as ErrorBoundary } from "@dvargas92495/app/components/DefaultErrorBoundary";
import { ActionFunction, LoaderFunction } from "@remix-run/node";
import { useLoaderData, useMatches, useOutletContext } from "@remix-run/react";
import AtJsonRendered from "package/components/AtJsonRendered";
import getSharedPageByUuidForUser from "~/data/getSharedPageByUuidForUser.server";
import getUserNotebookProfile from "~/data/getUserNotebookProfile.server";
import { useEffect, useState, useRef } from "react";
import PencilIcon from "@heroicons/react/outline/PencilIcon";
import Textarea from "@dvargas92495/app/components/Textarea";
import NumberInput from "@dvargas92495/app/components/NumberInput";
import Select from "@dvargas92495/app/components/Select";
import { Annotation, InitialSchema } from "package/internal/types";
import Button from "@dvargas92495/app/components/Button";
import ChevronRightIcon from "@heroicons/react/solid/ChevronRightIcon";
import ChevronDownIcon from "@heroicons/react/solid/ChevronDownIcon";

const EditAnnotation = ({
  setAnnotation,
  ...a
}: Annotation & { setAnnotation: (a: Annotation) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const Chevron = isOpen ? ChevronDownIcon : ChevronRightIcon;
  return (
    <div>
      <div>
        <Chevron
          className="h-4 w-4 inline-block cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        />{" "}
        {a.type}
      </div>
      {isOpen && (
        <div>
          <div className="flex items-center gap-4">
            <NumberInput
              value={a.start}
              onChange={(e) =>
                setAnnotation({
                  ...a,
                  start: e.target.valueAsNumber,
                })
              }
              label={"Start"}
              className={"flex-shrink w-16"}
            />
            <NumberInput
              value={a.end}
              onChange={(e) =>
                setAnnotation({
                  ...a,
                  end: e.target.valueAsNumber,
                })
              }
              label={"End"}
              className={"flex-shrink w-16"}
            />
            <Select
              className={"flex-grow"}
              label="Type"
              defaultValue={a.type}
              options={[a.type]}
              onChange={(_e) => {
                // setAnnotation({
                //   ...a,
                //   type: e as Annotation["type"],
                // })
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const SingleNotebookPagePage = () => {
  const data =
    useLoaderData<Awaited<ReturnType<typeof getSharedPageByUuidForUser>>>();
  const [pageData, setPageData] = useState(data.data);
  const currentContentRef = useRef(pageData.content);
  const [currentContent, _setCurrentContent] = useState(pageData.content);
  const currentAnnotationsRef = useRef(pageData.annotations);
  const [currentAnnotations, _setCurrentAnnotations] = useState(
    pageData.annotations
  );
  const setCurrentContent = (c: string) => {
    _setCurrentContent((currentContentRef.current = c));
  };
  const setCurrentAnnotations = (a: Annotation[]) => {
    _setCurrentAnnotations((currentAnnotationsRef.current = a));
  };

  const matches = useMatches();
  const parentData = matches[3].data as Awaited<
    ReturnType<typeof getUserNotebookProfile>
  >;
  const { applyStateRef, calcStateRef, refreshContentRef } = useOutletContext<{
    applyStateRef: React.MutableRefObject<
      (id: string, state: InitialSchema) => void
    >;
    calcStateRef: React.MutableRefObject<(id: string) => InitialSchema>;
    refreshContentRef: React.MutableRefObject<
      (args: {
        label?: string;
        notebookPageId: string;
      }) => Promise<Record<string, unknown>>
    >;
  }>();
  useEffect(() => {
    applyStateRef.current = (id, state) => {
      if (id === data.title) setPageData(state);
    };
    calcStateRef.current = (id) => {
      if (id === data.title)
        return {
          content: currentContentRef.current,
          annotations: currentAnnotationsRef.current,
        };
      else throw new Error(`Page ${id} not loaded`);
    };
    window.dispatchEvent(
      new CustomEvent("page-change", { detail: data.title })
    );
    return () => {
      window.dispatchEvent(
        new CustomEvent("page-remove", { detail: data.title })
      );
    };
  }, [data.title, applyStateRef, setPageData]);
  const [isContentEditing, setIsContentEditing] = useState(false);
  const [isAnnotationsEditing, setIsAnnotationsEditing] = useState(false);
  return (
    <div
      id={"samepage-page-view"}
      data-notebook-page-id={data.title}
      className={"bg-sky-100 rounded-lg shadow-lg p-4 h-full flex"}
    >
      <div className="flex-grow">
        <AtJsonRendered {...pageData} />
      </div>
      {parentData.notebook.app === "SamePage" && (
        <div className="w-1/2 h-full border-l border-dashed px-2 border-l-black flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Editing</h2>
          <p>
            <PencilIcon
              className={`h-6 w-6 mr-2 inline-block cursor-pointer bg-opacity-60 hover:bg-gray-200 rounded-sm ${
                isContentEditing ? "bg-gray-400" : ""
              }`}
              onClick={() => setIsContentEditing(!isContentEditing)}
            />{" "}
            Content
          </p>
          {isContentEditing && (
            <Textarea
              className="font-mono"
              inputClassname="resize-none h-64"
              value={currentContent}
              onChange={(e) => setCurrentContent(e.target.value)}
            />
          )}
          <p>
            <PencilIcon
              className={`h-6 w-6 mr-2 inline-block cursor-pointer bg-opacity-60 hover:bg-gray-200 rounded-sm ${
                isAnnotationsEditing ? "bg-gray-400" : ""
              }`}
              onClick={() => setIsAnnotationsEditing(!isAnnotationsEditing)}
            />{" "}
            Annotations
          </p>
          {isAnnotationsEditing && (
            <ul className="pl-6">
              {currentAnnotations.map((a, i) => (
                <li key={i} className={"mb-2"}>
                  <EditAnnotation
                    {...a}
                    setAnnotation={(newA) =>
                      setCurrentAnnotations(
                        currentAnnotations.map((cur, j) => {
                          if (j !== i) return cur;
                          else return newA;
                        })
                      )
                    }
                  />
                </li>
              ))}
            </ul>
          )}
          <div className="flex-grow flex flex-col justify-end">
            {currentContent !== pageData.content ||
            currentAnnotations.length !== pageData.annotations.length ||
            currentAnnotations.some((a, i) => {
              const b = pageData.annotations[i];
              return (
                a.type !== b.type ||
                a.start !== b.start ||
                a.end !== b.end ||
                Object.entries(a.attributes || {}).some(
                  // @ts-ignore
                  ([k, v]) => v !== b.attributes?.[k]
                )
              );
            }) ? (
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => {
                    setPageData({
                      content: currentContent,
                      annotations: currentAnnotations,
                    });
                    refreshContentRef.current({
                      label: "Save",
                      notebookPageId: data.title,
                    });
                  }}
                >
                  Save
                </Button>
                <Button
                  onClick={() => {
                    setCurrentContent(pageData.content);
                    setCurrentAnnotations(pageData.annotations);
                  }}
                >
                  Reset
                </Button>
              </div>
            ) : (
              <></>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const action: ActionFunction = (args) => {
  return remixAppAction(args, {});
};

export const loader: LoaderFunction = (args) => {
  return remixAppLoader(args, ({ params, context: { requestId } }) =>
    getSharedPageByUuidForUser({
      uuid: params["uuid"] || "",
      page: params["page"] || "",
      requestId,
    })
  );
};

const Title = () => {
  const matches = useMatches();
  const data = matches[3].data as Awaited<
    ReturnType<typeof getUserNotebookProfile>
  >;
  const nestedData = matches[4].data as Awaited<
    ReturnType<typeof getSharedPageByUuidForUser>
  >;
  return data ? (
    <span className="normal-case">
      {data.notebook.app} / {data.notebook.workspace} / {nestedData.title}
    </span>
  ) : (
    "Notebook"
  );
};

export const handle = {
  Title,
};

export default SingleNotebookPagePage;
