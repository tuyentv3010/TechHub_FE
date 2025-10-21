import { TocItem } from "@/types/blog.types";

const DEFAULT_WPM = 200;
const HEADING_REGEX = /<(h[1-4])([^>]*)>([\s\S]*?)<\/\1>/gi;
const ID_ATTR_REGEX = /id=["']([^"']+)["']/i;

export const slugify = (value: string) => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

export const ensureUniqueSlug = (slug: string, used: Set<string>) => {
  let uniqueSlug = slug || "section";
  let counter = 1;

  while (used.has(uniqueSlug)) {
    uniqueSlug = `${slug || "section"}-${counter}`;
    counter += 1;
  }

  used.add(uniqueSlug);
  return uniqueSlug;
};

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, "").trim();

const extractIdFromAttributes = (rawAttributes: string) => {
  const match = rawAttributes.match(ID_ATTR_REGEX);
  return match ? match[1] : null;
};

export const extractHeadingsFromHtml = (html: string): TocItem[] => {
  if (!html) {
    return [];
  }

  const headings: TocItem[] = [];
  const usedIds = new Set<string>();

  if (typeof window !== "undefined") {
    const container = document.createElement("div");
    container.innerHTML = html;
    const elements = Array.from(
      container.querySelectorAll<HTMLHeadingElement>("h1, h2, h3, h4")
    );

    elements.forEach((element) => {
      const text = element.textContent?.trim();
      if (!text) {
        return;
      }

      const level = Number(element.tagName.substring(1));
      if (Number.isNaN(level)) {
        return;
      }

      const rawId = element.getAttribute("id") || slugify(text);
      const id = ensureUniqueSlug(rawId, usedIds);
      headings.push({ id, text, level });
    });

    return headings;
  }

  let match: RegExpExecArray | null;
  while ((match = HEADING_REGEX.exec(html)) !== null) {
    const [, tag, rawAttributes, innerHtml] = match;
    const level = Number(tag.slice(1));
    if (Number.isNaN(level)) {
      continue;
    }

    const text = stripHtml(innerHtml);
    if (!text) {
      continue;
    }

    const attrId = extractIdFromAttributes(rawAttributes);
    const slug = ensureUniqueSlug(attrId || slugify(text), usedIds);
    headings.push({ id: slug, text, level });
  }

  return headings;
};

export const buildContentWithToc = (html: string) => {
  if (!html) {
    return { html: "", toc: [] as TocItem[] };
  }

  const usedIds = new Set<string>();
  const toc: TocItem[] = [];

  const transformed = html.replace(
    HEADING_REGEX,
    (_, tag: string, rawAttributes: string = "", innerHtml: string) => {
      const level = Number(tag.slice(1));
      if (Number.isNaN(level)) {
        return _;
      }

      const text = stripHtml(innerHtml);
      if (!text) {
        return _;
      }

      const attrId = extractIdFromAttributes(rawAttributes);
      const slug = ensureUniqueSlug(attrId || slugify(text), usedIds);
      toc.push({ id: slug, text, level });

      const withoutId = attrId
        ? rawAttributes.replace(ID_ATTR_REGEX, "").trim()
        : rawAttributes.trim();

      const normalizedAttrs = withoutId ? ` ${withoutId}` : "";
      return `<${tag} id="${slug}"${normalizedAttrs}>${innerHtml}</${tag}>`;
    }
  );

  return { html: transformed, toc };
};

export const estimateReadingTime = (content: string) => {
  if (!content) {
    return 1;
  }

  const text = stripHtml(content);
  const words = text.split(/\s+/).filter(Boolean);
  const minutes = Math.ceil(words.length / DEFAULT_WPM);

  return minutes > 0 ? minutes : 1;
};

export const normalizeTags = (tags: string[]) => {
  return Array.from(
    new Set(
      (tags || [])
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 0)
    )
  );
};

export const addTagToList = (tags: string[], newTag: string) => {
  const normalized = normalizeTags([...tags, newTag]);
  return normalized;
};

export const getExcerptFromContent = (content: string, length = 160) => {
  if (!content) {
    return "";
  }

  const text = stripHtml(content);
  if (text.length <= length) {
    return text;
  }

  return `${text.slice(0, length).trimEnd()}…`;
};
