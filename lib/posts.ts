import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypePrettyCode, {
  type Options as RehypePrettyCodeOptions,
} from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";

const postsDirectory = path.join(process.cwd(), "posts");
const prettyCodeOptions: RehypePrettyCodeOptions = {
  theme: {
    light: "github-light",
    dark: "github-dark",
  },
  keepBackground: false,
  defaultLang: {
    block: "text",
    inline: "text",
  },
};

function normalizeMarkdownCodeLanguages() {
  type MarkdownNode = {
    type?: string;
    lang?: string;
    children?: MarkdownNode[];
  };

  return (tree: MarkdownNode) => {
    const visit = (node: MarkdownNode) => {
      if (node.type === "code") {
        if (typeof node.lang === "string") {
          node.lang = node.lang.trim().toLowerCase();
        }
      }

      if ("children" in node && Array.isArray(node.children)) {
        for (const child of node.children) {
          visit(child);
        }
      }
    };

    visit(tree);
  };
}

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  description: string;
  /** Normalized tag slugs (ASCII), deduped */
  tags: string[];
  hidden: boolean;
}

export interface Post extends PostMeta {
  contentHtml: string;
}

/** Lowercase ASCII slug: letters, digits, hyphens only (per research / contract). */
export function normalizeTagSlug(raw: string): string {
  const s = raw
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const cleaned = s
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (!cleaned) {
    throw new Error(
      `Invalid tag "${raw}": use ASCII letters, numbers, or hyphens (e.g. spec-kit, test).`,
    );
  }
  return cleaned;
}

function parseTagsField(raw: unknown, fileLabel: string): string[] {
  if (raw == null) {
    throw new Error(`${fileLabel}: frontmatter "tags" is required (non-empty array).`);
  }
  const strings: string[] = Array.isArray(raw)
    ? raw.map((x) => String(x))
    : typeof raw === "string"
      ? [raw]
      : [];
  if (strings.length === 0) {
    throw new Error(`${fileLabel}: "tags" must be a non-empty array or non-empty string.`);
  }
  const normalized = strings.map((s) => normalizeTagSlug(s));
  return [...new Set(normalized)];
}

function parseHiddenField(raw: unknown): boolean {
  if (raw == null) return false;
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "number") return raw !== 0;
  if (typeof raw === "string") {
    const v = raw.trim().toLowerCase();
    return v === "true" || v === "1" || v === "yes";
  }
  return Boolean(raw);
}

function metaFromMatter(
  data: Record<string, unknown>,
  slug: string,
  fileName: string,
): PostMeta {
  const fileLabel = `posts/${fileName}`;
  const tags = parseTagsField(data.tags, fileLabel);
  if (tags.length === 0) {
    throw new Error(`${fileLabel}: at least one tag is required.`);
  }
  const hidden = parseHiddenField(data.hidden);
  return {
    slug,
    title: data.title as string,
    date: data.date as string,
    description: data.description as string,
    tags,
    hidden,
  };
}

export function getAllPosts(): PostMeta[] {
  const fileNames = fs.readdirSync(postsDirectory);
  const posts = fileNames
    .filter((name) => name.endsWith(".md"))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, "");
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const { data } = matter(fileContents);
      return metaFromMatter(data as Record<string, unknown>, slug, fileName);
    })
    .filter((p) => !p.hidden);

  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** Unique normalized tag slugs across all posts, sorted for stable output */
export function getAllTagSlugs(): string[] {
  const posts = getAllPosts();
  const set = new Set<string>();
  for (const p of posts) {
    for (const t of p.tags) {
      set.add(t);
    }
  }
  return [...set].sort();
}

export function getPostsByTagSlug(tagSlug: string): PostMeta[] {
  const normalized = normalizeTagSlug(tagSlug);
  return getAllPosts().filter((p) => p.tags.includes(normalized));
}

export async function getPostBySlug(slug: string): Promise<Post> {
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);
  const fileName = `${slug}.md`;
  const meta = metaFromMatter(data as Record<string, unknown>, slug, fileName);
  if (meta.hidden) {
    throw new Error("Post is hidden");
  }

  const processedContent = await remark()
    .use(normalizeMarkdownCodeLanguages)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypePrettyCode, prettyCodeOptions)
    .use(rehypeStringify)
    .process(content);
  const contentHtml = processedContent.toString();

  return {
    ...meta,
    contentHtml,
  };
}
