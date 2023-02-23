import AtJsonRendered from "package/components/AtJsonRendered";
import type { LoaderFunction } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import downloadIpfsFile from "~/data/downloadIpfsFile.server";
import Automerge from "automerge";
import { Schema, InitialSchema, Memo } from "package/internal/types";
import Button from "~/components/Button";
import binaryToBase64 from "package/internal/binaryToBase64";
export { default as CatchBoundary } from "~/components/DefaultCatchBoundary";
export { default as ErrorBoundary } from "~/components/DefaultErrorBoundary";
import { useMemo } from "react";
import base64ToBinary from "package/internal/base64ToBinary";
import { parseAndFormatActorId } from "package/internal/parseActorId";
import { decode } from "@ipld/dag-cbor";
import unwrapSchema from "package/utils/unwrapSchema";

const ViewCidPage = () => {
  const data = useLoaderData<
    InitialSchema & { parent: string | null; raw: string }
  >();
  const history = useMemo(
    () =>
      Automerge.getHistory(
        Automerge.load(base64ToBinary(data.raw) as Automerge.BinaryDocument)
      ),
    [data.raw]
  );
  return (
    <div className="flex flex-col gap-2 h-full justify-between">
      <div className="flex-grow border border-opacity-50 border-gray-300 flex justify-between gap-1">
        <div>
          <AtJsonRendered
            content={data.content}
            annotations={data.annotations}
          />
        </div>
        <div className="flex flex-col-reverse">
          {history.map((l, index) => (
            <div
              key={index}
              className={"border-t border-t-gray-800 p-4 relative"}
            >
              <div className={"text-sm absolute top-2 right-2"}>{index}</div>
              <div>
                <span className={"font-bold"}>Action: </span>
                <span>{l.change.message}</span>
              </div>
              <div>
                <span className={"font-bold"}>Actor: </span>
                <span>{parseAndFormatActorId(l.change.actor)}</span>
              </div>
              <div>
                <span className={"font-bold"}>Date: </span>
                <span>{new Date(l.change.time * 1000).toLocaleString()}</span>
              </div>
              <div>
                <span className={"font-bold"}>Hash: </span>
                <span>
                  {l.change.hash?.slice(0, 8)}...{l.change.hash?.slice(-4)}
                </span>
              </div>
              <div>
                <span className={"font-bold"}>Deps: </span>
                <span>
                  {l.change.deps.map((d) => (
                    <span className="mr-4">
                      {d.slice(0, 8)}...{d.slice(-4)}
                    </span>
                  ))}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {data.parent && (
        <Link className="flex-shrink" to={`/view/${data.parent}`}>
          <Button>Go to parent</Button>
        </Link>
      )}
    </div>
  );
};

export const loader: LoaderFunction = ({ params }) => {
  const cid = params["cid"];
  if (!cid) {
    return { content: "", annotations: [], parent: null };
  }
  return downloadIpfsFile({ cid }).then((bytes) => {
    const memo = decode<Memo>(bytes);
    const doc = Automerge.load<Schema>(memo.body);
    return {
      parent: memo.parent?.toString() || null,
      raw: binaryToBase64(memo.body),
      ...unwrapSchema(doc),
    };
  });
};

export default ViewCidPage;
