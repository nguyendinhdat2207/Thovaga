import type { SubjectCategory } from "@/lib/database.types";
import type { ImportQuestionInput } from "@/lib/queries/decks-import";

export class MarkdownParseError extends Error {}

interface RawBlock {
  index: number;
  stem: string;
  options: { letter: string; text: string }[];
  answerLetter: string | null;
  fields: Record<string, string>;
}

const FIELD_ALIASES: Record<string, string> = {
  explanation: "explanation",
  "giải thích": "explanation",
  meaning: "meaning",
  "nghĩa": "meaning",
  example: "example",
  "ví dụ": "example",
};

function normalizeFieldLabel(label: string): string | null {
  const key = label.trim().toLowerCase();
  return FIELD_ALIASES[key] ?? null;
}

function isAnswerLabel(label: string): boolean {
  const key = label.trim().toLowerCase();
  return key === "answer" || key === "đáp án";
}

// Tách markdown thành các mục đánh số (1. ... / 1) ...), mỗi mục gồm dòng nội
// dung đầu tiên, các lựa chọn "A. ..." (chấp nhận từ 2 lựa chọn trở lên),
// dòng Answer/Đáp án, và các dòng "Label: value" khác (Explanation, Meaning...).
export function parseNumberedBlocks(text: string): RawBlock[] {
  const lines = text.split("\n").map((l) => l.trim());
  const blocks: RawBlock[] = [];
  let current: RawBlock | null = null;

  for (const line of lines) {
    if (!line) continue;

    const itemMatch = line.match(/^(\d+)[.)]\s+(.*)$/);
    if (itemMatch) {
      if (current) blocks.push(current);
      current = { index: Number(itemMatch[1]), stem: itemMatch[2], options: [], answerLetter: null, fields: {} };
      continue;
    }
    if (!current) continue;

    const optionMatch = line.match(/^([A-Da-d])[.)]\s+(.*)$/);
    if (optionMatch) {
      current.options.push({ letter: optionMatch[1].toUpperCase(), text: optionMatch[2].trim() });
      continue;
    }

    const labelMatch = line.match(/^([A-Za-zÀ-ỹ ]+):\s*(.*)$/);
    if (labelMatch) {
      const [, label, value] = labelMatch;
      if (isAnswerLabel(label)) {
        const letterMatch = value.trim().match(/^[A-Da-d]/);
        current.answerLetter = letterMatch ? letterMatch[0].toUpperCase() : null;
        continue;
      }
      const normalized = normalizeFieldLabel(label);
      if (normalized) {
        current.fields[normalized] = value.trim();
        continue;
      }
    }
  }
  if (current) blocks.push(current);

  return blocks;
}

function parseHeader(text: string): { title: string; subject: string | null; category: SubjectCategory | null } {
  const firstItemLine = text.split("\n").findIndex((l) => /^\s*\d+[.)]\s+/.test(l));
  const headerText = firstItemLine === -1 ? text : text.split("\n").slice(0, firstItemLine).join("\n");

  const titleMatch = headerText.match(/^#\s+(.+)$/m);
  const subjectMatch = headerText.match(/^Subject:\s*(.+)$/mi);
  const categoryMatch = headerText.match(/^Category:\s*(school|data_ai|toeic)\s*$/mi);

  if (!titleMatch) {
    throw new MarkdownParseError("Thiếu tiêu đề — dòng đầu file phải bắt đầu bằng \"# Tên bộ đề\".");
  }

  return {
    title: titleMatch[1].trim(),
    subject: subjectMatch ? subjectMatch[1].trim() : null,
    category: categoryMatch ? (categoryMatch[1].toLowerCase() as SubjectCategory) : null,
  };
}

export interface ParsedQuizMarkdown {
  title: string;
  subjectName: string | null;
  category: SubjectCategory | null;
  questions: ImportQuestionInput[];
}

export function parseQuizMarkdown(text: string): ParsedQuizMarkdown {
  const { title, subject, category } = parseHeader(text);
  const blocks = parseNumberedBlocks(text);

  if (blocks.length === 0) {
    throw new MarkdownParseError("Không tìm thấy câu hỏi nào — mỗi câu phải bắt đầu bằng số thứ tự, ví dụ \"1. ...\".");
  }

  const questions: ImportQuestionInput[] = blocks.map((b, i) => {
    const n = i + 1;
    if (!b.stem) throw new MarkdownParseError(`Câu ${n} thiếu nội dung câu hỏi.`);
    if (b.options.length < 2) throw new MarkdownParseError(`Câu ${n} cần ít nhất 2 lựa chọn (A., B., ...).`);
    if (!b.answerLetter) throw new MarkdownParseError(`Câu ${n} thiếu dòng "Answer: <chữ cái>".`);
    const correctIndex = b.options.findIndex((o) => o.letter === b.answerLetter);
    if (correctIndex === -1) {
      throw new MarkdownParseError(`Câu ${n} có Answer "${b.answerLetter}" không khớp lựa chọn nào.`);
    }
    return {
      prompt: b.stem,
      options: b.options.map((o) => o.text),
      correct_option: correctIndex,
      explanation: b.fields.explanation ?? null,
    };
  });

  return { title, subjectName: subject, category, questions };
}

export interface ParsedVocabWord {
  en: string;
  vi: string;
  example: string | null;
  distractors: string[] | null;
}

export interface ParsedVocabMarkdown {
  title: string;
  words: ParsedVocabWord[];
}

export function parseVocabMarkdown(text: string): ParsedVocabMarkdown {
  const { title } = parseHeader(text);
  const blocks = parseNumberedBlocks(text);

  if (blocks.length === 0) {
    throw new MarkdownParseError("Không tìm thấy từ nào — mỗi từ phải bắt đầu bằng số thứ tự, ví dụ \"1. run\".");
  }

  const words: ParsedVocabWord[] = blocks.map((b, i) => {
    const n = i + 1;
    if (!b.stem) throw new MarkdownParseError(`Mục ${n} thiếu từ tiếng Anh.`);

    let vi = b.fields.meaning ?? null;
    let distractors: string[] | null = null;

    if (b.options.length > 0) {
      if (!b.answerLetter) {
        throw new MarkdownParseError(`Mục ${n} ("${b.stem}") có lựa chọn A-D nhưng thiếu dòng "Answer:".`);
      }
      const correct = b.options.find((o) => o.letter === b.answerLetter);
      if (!correct) {
        throw new MarkdownParseError(`Mục ${n} ("${b.stem}") có Answer "${b.answerLetter}" không khớp lựa chọn nào.`);
      }
      vi = vi ?? correct.text;
      distractors = b.options.filter((o) => o.letter !== b.answerLetter).map((o) => o.text);
    }

    if (!vi) {
      throw new MarkdownParseError(`Mục ${n} ("${b.stem}") thiếu nghĩa — thêm dòng "Meaning:" hoặc lựa chọn A-D + Answer.`);
    }

    return { en: b.stem, vi, example: b.fields.example ?? null, distractors };
  });

  return { title, words };
}
