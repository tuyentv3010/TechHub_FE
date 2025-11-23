import envConfig from "@/config";
import { NextRequest, NextResponse } from "next/server";

type CourseSuggestion = {
  title?: string | null;
  description?: string | null;
  level?: string | null;
  course_id?: string | null;
  [key: string]: unknown;
};

type StructuredAiResponse = {
  message?: string;
  courses?: CourseSuggestion[];
  tips?: string[];
  sections?: Array<{
    heading: string;
    items: string[];
  }>;
  fallbackText?: string;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === "object" && !Array.isArray(value));

const toSentenceCase = (key: string) => {
  if (!key) return "";
  return key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ");
};

const humanizeKey = (key: string) => {
  const cleaned = toSentenceCase(key).trim();
  if (!cleaned) return "";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

const pickFirstString = (
  source: Record<string, unknown>,
  fields: string[]
): string | undefined => {
  for (const field of fields) {
    const value = source[field];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
};

const detectLanguage = (body: any, request: NextRequest): string => {
  if (typeof body?.language === "string" && body.language.trim()) {
    return body.language.trim();
  }

  const acceptLanguageRaw = request.headers.get("accept-language");
  const message = typeof body?.message === "string" ? body.message : "";
  const viPattern =
    /[ăâđêôơưáàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i;

  if (viPattern.test(message)) {
    return "vi";
  }

  if (acceptLanguageRaw) {
    const segments = acceptLanguageRaw
      .split(",")
      .map((item) => item.trim().split(";")[0]?.toLowerCase())
      .filter(Boolean);

    if (segments.length) {
      const primary = segments[0]!;
      if (primary.startsWith("vi")) return "vi";
      if (primary.startsWith("en")) return "en";
      return primary.split("-")[0] || "en";
    }
  }

  const asciiOnly = /^[\x00-\x7F]*$/.test(message);
  if (!asciiOnly) {
    return "vi";
  }

  return "en";
};

const safeJsonParse = (value: string) => {
  try {
    return JSON.parse(value);
  } catch (_error) {
    return undefined;
  }
};

const tryParseEmbeddedJson = (value: string) => {
  const text = value.trim();
  for (let start = 0; start < text.length; start++) {
    if (text[start] !== "{") continue;
    let depth = 0;
    let inString = false;
    let escape = false;

    for (let i = start; i < text.length; i++) {
      const char = text[i];

      if (inString) {
        if (escape) {
          escape = false;
          continue;
        }
        if (char === "\\") {
          escape = true;
          continue;
        }
        if (char === '"') {
          inString = false;
        }
        continue;
      }

      if (char === '"') {
        inString = true;
        continue;
      }

      if (char === "{") {
        depth++;
      } else if (char === "}") {
        depth--;
        if (depth === 0) {
          const snippet = text.slice(start, i + 1);
          const parsed = safeJsonParse(snippet);
          if (parsed && typeof parsed === "object") {
            return parsed;
          }
          break;
        }
      }
    }
  }
  return undefined;
};

const PRIMARY_TEXT_FIELDS = [
  "text",
  "tip",
  "title",
  "name",
  "label",
  "heading",
  "aspect",
];

const normalizeStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const normalized = value
    .map((entry) => {
      if (typeof entry === "string") {
        const trimmed = entry.trim();
        return trimmed || undefined;
      }

      if (!isPlainObject(entry)) return undefined;
      const node = entry;

      const primary =
        PRIMARY_TEXT_FIELDS.reduce<string | undefined>((acc, field) => {
          if (acc) return acc;
          const candidate = node[field];
          if (typeof candidate === "string" && candidate.trim()) {
            return candidate.trim();
          }
          return acc;
        }, undefined) || undefined;

      const description =
        typeof node.description === "string" && node.description.trim()
          ? node.description.trim()
          : undefined;

      const detailPairs = Object.entries(node)
        .map(([key, val]) => {
          if (PRIMARY_TEXT_FIELDS.includes(key) || key === "description") {
            return undefined;
          }
          if (typeof val === "string" && val.trim()) {
            return `${humanizeKey(key)}: ${val.trim()}`;
          }
          if (typeof val === "number" || typeof val === "boolean") {
            return `${humanizeKey(key)}: ${val}`;
          }
          if (Array.isArray(val)) {
            const nestedList = normalizeStringArray(val);
            if (nestedList?.length) {
              return `${humanizeKey(key)}:\n     ${nestedList
                .map((item) => `- ${item}`)
                .join("\n     ")}`;
            }
          }
          if (isPlainObject(val)) {
            const nestedDescription = Object.entries(val)
              .filter(
                ([, nestedValue]) =>
                  typeof nestedValue === "string" && nestedValue.trim()
              )
              .map(
                ([nestedKey, nestedValue]) =>
                  `${humanizeKey(nestedKey)}: ${(nestedValue as string).trim()}`
              );
            if (nestedDescription.length) {
              return `${humanizeKey(key)}:\n     ${nestedDescription.join(
                "\n     "
              )}`;
            }
          }
          return undefined;
        })
        .filter((entry): entry is string => Boolean(entry));

      if (primary) {
        const blocks: string[] = [];
        if (description) {
          blocks.push(description);
        }
        if (detailPairs.length) {
          blocks.push(...detailPairs);
        }
        if (blocks.length) {
          return `${primary}\n   ${blocks.join("\n   ")}`.trim();
        }
        return primary;
      }

      if (description || detailPairs.length) {
        const blocks = [
          ...(description ? [description] : []),
          ...detailPairs,
        ];
        return blocks.join("\n");
      }

      return undefined;
    })
    .filter((entry): entry is string => Boolean(entry));
  return normalized.length ? normalized : undefined;
};

const SECTION_BLACKLIST = new Set([
  "courses",
  "tips",
  "suggestions",
  "nextSteps",
  "next_steps",
  "response",
  "content",
  "data",
  "payload",
  "result",
  "context",
  "choices",
  "messages",
  "history",
  "logprobs",
  "annotations",
  "usage",
  "metadata",
]);

const extractStructuredResponse = (
  value: unknown
): StructuredAiResponse | undefined => {
  if (value == null) return undefined;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = safeJsonParse(trimmed) ?? tryParseEmbeddedJson(trimmed);
    if (parsed) {
      return extractStructuredResponse(parsed);
    }
    return { fallbackText: trimmed };
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const node = value as Record<string, unknown>;

  const rawMessage = pickFirstString(node, [
    "message",
    "conclusion",
    "summary",
    "intro",
  ]);

  if (rawMessage) {
    const nested = extractStructuredResponse(rawMessage);
    if (
      nested &&
      (nested.message ||
        nested.courses?.length ||
        nested.tips?.length ||
        nested.sections?.length)
    ) {
      return nested;
    }
  }

  const courses = Array.isArray(node.courses)
    ? (node.courses as CourseSuggestion[])
    : undefined;

  const tips =
    normalizeStringArray(node.tips) ??
    normalizeStringArray(node.suggestions) ??
    normalizeStringArray(node["nextSteps"]) ??
    normalizeStringArray(node["next_steps"]);

  const sections: StructuredAiResponse["sections"] = [];
  for (const [key, entry] of Object.entries(node)) {
    if (!Array.isArray(entry) || SECTION_BLACKLIST.has(key)) continue;
    if (entry.length) {
      const first = entry[0];
      if (isPlainObject(first) && ("role" in first || "content" in first)) {
        continue;
      }
    }
    const normalized = normalizeStringArray(entry);
    if (normalized?.length) {
      sections.push({
        heading: humanizeKey(key) || "Details",
        items: normalized,
      });
    }
  }

  if (rawMessage || courses?.length || tips?.length || sections.length) {
    return {
      message: rawMessage,
      courses,
      tips,
      sections: sections.length ? sections : undefined,
    };
  }

  const nestedSources = [
    node.response,
    node.content,
    node.data,
    node.payload,
    node.result,
  ];

  for (const nested of nestedSources) {
    const parsed = extractStructuredResponse(nested);
    if (parsed) {
      return parsed;
    }
  }

  return undefined;
};

const formatCourses = (courses: CourseSuggestion[]): string | undefined => {
  const lines: string[] = [];
  let displayIndex = 1;

  for (const course of courses) {
    const title =
      typeof course?.title === "string" ? course.title.trim() : undefined;
    if (!title) continue;

    let block = `${displayIndex}. ${title}`;
    if (course?.level && typeof course.level === "string") {
      block += ` (${course.level})`;
    }

    const details: string[] = [];
    if (
      course?.description &&
      typeof course.description === "string" &&
      course.description.trim()
    ) {
      details.push(course.description.trim());
    }
    if (course?.course_id && typeof course.course_id === "string") {
      details.push(`ID: ${course.course_id}`);
    }
    if (details.length) {
      block += `\n   ${details.join("\n   ")}`;
    }

    lines.push(block);
    displayIndex++;
  }

  return lines.length ? lines.join("\n") : undefined;
};

const formatFriendlyResponse = (
  payload?: StructuredAiResponse
): string | undefined => {
  if (!payload) return undefined;
  const parts: string[] = [];

  if (payload.message && payload.message.trim()) {
    parts.push(payload.message.trim());
  }

  if (payload.courses?.length) {
    const formattedCourses = formatCourses(payload.courses);
    if (formattedCourses) {
      parts.push(formattedCourses);
    }
  }

  if (payload.tips?.length) {
    const tips = payload.tips
      .map((tip) => tip.trim())
      .filter(Boolean)
      .map((tip) => `- ${tip}`);
    if (tips.length) {
      parts.push(tips.join("\n"));
    }
  }

  if (payload.sections?.length) {
    payload.sections.forEach((section) => {
      if (!section.items?.length) return;
      const entries = section.items.map(
        (item, index) => `${index + 1}. ${item}`
      );
      parts.push(`${section.heading}:\n${entries.join("\n")}`);
    });
  }

  if (parts.length) {
    return parts.join("\n\n");
  }

  return payload.fallbackText?.trim();
};

const extractPlainText = (val: any): string | undefined => {
  if (!val) return undefined;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (parsed?.response?.message) return parsed.response.message;
      if (parsed?.response) return JSON.stringify(parsed.response);
      return JSON.stringify(parsed);
    } catch (_e) {
      // not JSON; return the raw string
    }
    return val;
  }
  if (typeof val === "object") {
    if (val?.response?.message) return val.response.message;
    if (val?.response) return JSON.stringify(val.response);
    if (val?.message) return val.message;
    return JSON.stringify(val);
  }
  return undefined;
};

const buildFriendlyAnswer = (raw: any): string | undefined => {
  if (!raw) return undefined;
  const structuredSources = [
    raw.context?.choices?.[0]?.message?.content,
    raw.context?.response,
    raw.answer,
    raw.message,
  ];

  let structured: StructuredAiResponse | undefined;
  for (const source of structuredSources) {
    if (!source) continue;
    const parsed = extractStructuredResponse(source);
    if (!parsed) continue;
    structured = parsed;
    if (
      parsed.message ||
      parsed.courses?.length ||
      parsed.tips?.length ||
      parsed.sections?.length
    ) {
      break;
    }
  }

  const formatted = formatFriendlyResponse(structured);
  if (formatted) {
    return formatted;
  }

  for (const source of structuredSources) {
    const plain = extractPlainText(source);
    if (plain) return plain;
  }

  return undefined;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get("authorization");
    const detectedLanguage = detectLanguage(body, request);
    const proxyPayload =
      body && typeof body === "object"
        ? { ...body, language: detectedLanguage }
        : { language: detectedLanguage };

    const response = await fetch(
      `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/app/api/proxy/ai/chat/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader && { Authorization: authHeader }),
          ...(request.headers.get("cookie") && {
            Cookie: request.headers.get("cookie") as string,
          }),
          ...(request.headers.get("accept-language") && {
            "Accept-Language": request.headers.get("accept-language") as string,
          }),
        },
        body: JSON.stringify(proxyPayload),
        credentials: "include",
      }
    );

    const data = await response.json();
    // Sanitize response to return only the fields the client needs
    const raw = (data as any)?.data || {};

    const answer = buildFriendlyAnswer(raw);

    const sanitized = {
      success: (data as any)?.success ?? response.ok,
      status: (data as any)?.status ?? "AI_CHAT",
      message: answer || (data as any)?.message || "OK",
      payload: {
        data: {
          sessionId: raw.sessionId,
          messageId: raw.messageId,
          mode: raw.mode,
          answer,
          timestamp: raw.timestamp,
        },
      },
    };

    return NextResponse.json(sanitized, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to send chat message" },
      { status: 500 }
    );
  }
}
