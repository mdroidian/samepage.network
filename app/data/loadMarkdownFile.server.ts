import fs from "fs";
import axios from "axios";
// import { bundleMDX } from "mdx-bundler";
import grayMatter from "gray-matter";

// Temporary solution until I figure out how to get MDX working without esbuild
const bundleMDX = async ({ source }: { source: string }) => {
  const { data, content } = grayMatter(source);
  return { frontmatter: data, code: content };
};

const loadMarkdownFile = async ({ path }: { path: string }) => {
  const fileName = path || "index";
  const source =
    process.env.NODE_ENV === "development"
      ? fs.existsSync(`./docs/${fileName}.md`)
        ? fs.readFileSync(`./docs/${fileName}.md`).toString()
        : undefined
      : await axios
          .get(
            `https://raw.githubusercontent.com/dvargas92495/samepage.network/main/docs/${fileName}.md`,
            { responseType: "document" }
          )
          .then((r) => r.data as string)
          .catch(() => "");
  return source
    ? {
        ...(await bundleMDX({ source }).catch((e) => ({
          code: "",
          frontmatter: {
            title: "Failed to compile Markdown file",
            description: `Error: ${e.message}`,
          },
        }))),
        fileName,
        success: true,
      }
    : {
        code: "",
        frontmatter: {
          title: "Page Not Found!",
          description: "Return to home",
        },
        fileName,
        success: false,
      };
};

export default loadMarkdownFile;
