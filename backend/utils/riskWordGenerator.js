const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
} = require("docx");

/**
 * Removes AI/Markdown formatting symbols that should not appear in Word.
 */
function cleanText(value) {
  if (!value) return "";

  return String(value)
    .replace(/\r/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/#{1,6}\s?/g, "")
    .replace(/`/g, "")
    .replace(/_{2,}/g, "")
    .replace(/-{3,}/g, "")
    .replace(/\[|\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Converts a possible Markdown heading line into clean heading text.
 */
function getHeadingText(line) {
  return cleanText(
    String(line)
      .replace(/^#{1,6}\s*/, "")
      .replace(/\*\*/g, "")
      .replace(/:$/, "")
      .trim(),
  );
}

/**
 * Detects lines that should become professional subtitles.
 */
function isLikelySubHeading(line) {
  const text = String(line).trim();

  if (!text) return false;

  if (/^#{1,6}\s+/.test(text)) return true;
  if (/^\*\*.+\*\*:?\s*$/.test(text)) return true;

  const cleaned = cleanText(text);

  if (cleaned.length > 90) return false;
  if (/[.!?]$/.test(cleaned)) return false;

  const titleWords = [
    "Purpose",
    "Scope",
    "Methodology",
    "Findings",
    "Hazards",
    "Controls",
    "Recommendations",
    "Responsibilities",
    "Emergency",
    "Monitoring",
    "Review",
    "Action Plan",
    "Approval",
    "Conclusion",
    "Risk Rating",
    "Residual Risk",
    "Legal Requirements",
    "PPE",
    "Training",
    "Inspection",
  ];

  return titleWords.some((word) =>
    cleaned.toLowerCase().includes(word.toLowerCase()),
  );
}

function tableBorders() {
  return {
    top: {
      style: BorderStyle.SINGLE,
      size: 1,
      color: "BFBFBF",
    },
    bottom: {
      style: BorderStyle.SINGLE,
      size: 1,
      color: "BFBFBF",
    },
    left: {
      style: BorderStyle.SINGLE,
      size: 1,
      color: "BFBFBF",
    },
    right: {
      style: BorderStyle.SINGLE,
      size: 1,
      color: "BFBFBF",
    },
  };
}

function createParagraph(text, options = {}) {
  return new Paragraph({
    spacing: {
      after: options.after ?? 140,
      before: options.before ?? 0,
      line: 276,
    },
    alignment: options.alignment || AlignmentType.LEFT,
    children: [
      new TextRun({
        text: cleanText(text),
        bold: options.bold || false,
        italics: options.italics || false,
        size: options.size || 22,
        color: options.color || "1F1F1F",
      }),
    ],
  });
}

function createSectionHeading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: {
      before: 360,
      after: 180,
    },
    border: {
      bottom: {
        color: "1F4E79",
        space: 6,
        style: BorderStyle.SINGLE,
        size: 8,
      },
    },
    children: [
      new TextRun({
        text: cleanText(text).toUpperCase(),
        bold: true,
        size: 30,
        color: "1F4E79",
      }),
    ],
  });
}

function createSubHeading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: {
      before: 240,
      after: 100,
    },
    children: [
      new TextRun({
        text: getHeadingText(text),
        bold: true,
        size: 25,
        color: "2F5597",
      }),
    ],
  });
}

function createBullet(text) {
  return new Paragraph({
    bullet: {
      level: 0,
    },
    spacing: {
      after: 100,
      line: 276,
    },
    children: [
      new TextRun({
        text: cleanText(text),
        size: 22,
        color: "1F1F1F",
      }),
    ],
  });
}

function createNumberedText(text) {
  return new Paragraph({
    spacing: {
      after: 100,
      line: 276,
    },
    children: [
      new TextRun({
        text: cleanText(text),
        size: 22,
        color: "1F1F1F",
      }),
    ],
  });
}

/**
 * Converts AI/Markdown-like section content into clean Word paragraphs.
 * Markdown symbols are removed, but useful structure is preserved.
 */
function createBodyContent(content) {
  const children = [];

  if (!content || !String(content).trim()) {
    children.push(
      createParagraph("No content provided for this section.", {
        italics: true,
        color: "666666",
      }),
    );
    return children;
  }

  const lines = String(content)
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  lines.forEach((rawLine) => {
    let line = rawLine.trim();

    // Skip pure Markdown separators
    if (/^[-*_]{3,}$/.test(line)) return;

    // Markdown headings become styled Word subtitles
    if (/^#{1,6}\s+/.test(line)) {
      children.push(createSubHeading(line));
      return;
    }

    // Bold-only Markdown heading becomes styled Word subtitle
    if (/^\*\*.+\*\*:?\s*$/.test(line)) {
      children.push(createSubHeading(line));
      return;
    }

    // Lines like "**Hazard:** Falling objects" become a bold label + normal text
    const boldLabelMatch = line.match(/^\*\*(.+?)\*\*:\s*(.+)$/);
    if (boldLabelMatch) {
      children.push(
        new Paragraph({
          spacing: {
            after: 120,
            line: 276,
          },
          children: [
            new TextRun({
              text: cleanText(boldLabelMatch[1]) + ": ",
              bold: true,
              size: 22,
              color: "2F5597",
            }),
            new TextRun({
              text: cleanText(boldLabelMatch[2]),
              size: 22,
              color: "1F1F1F",
            }),
          ],
        }),
      );
      return;
    }

    // Bullet points
    if (/^[-*•]\s+/.test(line)) {
      children.push(createBullet(line.replace(/^[-*•]\s+/, "")));
      return;
    }

    // Numbered items
    if (/^\d+\.\s+/.test(line)) {
      children.push(createNumberedText(line));
      return;
    }

    // Plain subtitle detection
    if (isLikelySubHeading(line)) {
      children.push(createSubHeading(line));
      return;
    }

    // Normal paragraph
    children.push(createParagraph(line));
  });

  return children;
}

function createInfoTable(assessment) {
  const rows = [
    ["Assessment Number", assessment.assessmentNumber || "N/A"],
    ["Title", assessment.title || "N/A"],
    ["Work Area", assessment.workArea?.name || "N/A"],
    ["Conducted By", assessment.conductedBy?.name || "N/A"],
    [
      "Assessment Date",
      assessment.assessmentDate
        ? new Date(assessment.assessmentDate).toLocaleDateString("en-GB")
        : "N/A",
    ],
    ["Status", assessment.status || "N/A"],
  ];

  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    rows: rows.map(
      ([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              width: {
                size: 30,
                type: WidthType.PERCENTAGE,
              },
              shading: {
                type: ShadingType.CLEAR,
                fill: "D9EAF7",
              },
              borders: tableBorders(),
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: label,
                      bold: true,
                      size: 22,
                      color: "1F4E79",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: {
                size: 70,
                type: WidthType.PERCENTAGE,
              },
              borders: tableBorders(),
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: cleanText(value),
                      size: 22,
                      color: "1F1F1F",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
    ),
  });
}

function createApprovalSection() {
  return [
    createSectionHeading("Approval and Sign-Off"),

    createParagraph(
      "This risk assessment has been reviewed by the responsible safety personnel. The document should be printed, reviewed, signed, and filed according to the organisation's safety management procedure.",
    ),

    new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: tableBorders(),
              children: [
                createParagraph("Prepared By:", {
                  bold: true,
                  color: "1F4E79",
                }),
                createParagraph("Name: ______________________________"),
                createParagraph("Signature: ___________________________"),
                createParagraph("Date: _______________________________"),
              ],
            }),
            new TableCell({
              borders: tableBorders(),
              children: [
                createParagraph("Reviewed / Approved By:", {
                  bold: true,
                  color: "1F4E79",
                }),
                createParagraph("Name: ______________________________"),
                createParagraph("Signature: ___________________________"),
                createParagraph("Date: _______________________________"),
              ],
            }),
          ],
        }),
      ],
    }),
  ];
}

async function generateRiskWordBuffer({ assessment, sections }) {
  const documentChildren = [];

  documentChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 300,
      },
      children: [
        new TextRun({
          text: "RISK ASSESSMENT REPORT",
          bold: true,
          size: 38,
          color: "1F4E79",
        }),
      ],
    }),
  );

  documentChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 400,
      },
      children: [
        new TextRun({
          text: cleanText(assessment.title || "Risk Assessment"),
          bold: true,
          size: 28,
          color: "2F5597",
        }),
      ],
    }),
  );

  documentChildren.push(createInfoTable(assessment));

  documentChildren.push(
    createParagraph(
      "This editable Word document was generated from the confirmed risk assessment sections. The Safety Officer should review, edit where necessary, print, sign, and file it before final operational use.",
      {
        before: 300,
        italics: true,
        color: "666666",
      },
    ),
  );

  sections.forEach((section) => {
    documentChildren.push(createSectionHeading(section.title));

    const activeVersion = assessment.activeVersion?.[section.key] || "human";

    let content = "";

    if (activeVersion === "ai") {
      content = assessment.aiSections?.[section.key]?.content || "";
    } else {
      content = assessment.humanSections?.[section.key] || "";
    }

    const bodyParagraphs = createBodyContent(content);
    documentChildren.push(...bodyParagraphs);
  });

  documentChildren.push(...createApprovalSection());

  const doc = new Document({
    creator: "TrueSafe365 Risk Assessment System",
    title: cleanText(assessment.title || "Risk Assessment Report"),
    description: "Editable risk assessment Word document",
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000,
              right: 900,
              bottom: 1000,
              left: 900,
            },
          },
        },
        children: documentChildren,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

module.exports = {
  generateRiskWordBuffer,
};

