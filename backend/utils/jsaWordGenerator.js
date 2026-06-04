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

function tableBorders() {
  return {
    top: { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" },
    left: { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" },
    right: { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" },
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

function createMainHeading(text) {
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
        text: cleanText(text),
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

function isSubHeading(line) {
  const text = String(line).trim();

  if (/^#{1,6}\s+/.test(text)) return true;
  if (/^\*\*.+\*\*:?\s*$/.test(text)) return true;

  const cleaned = cleanText(text);
  if (cleaned.length > 90) return false;
  if (/[.!?]$/.test(cleaned)) return false;

  const keywords = [
    "Purpose",
    "Scope",
    "Job Steps",
    "Procedure",
    "Hazards",
    "Controls",
    "Control Measures",
    "PPE",
    "Tools",
    "Equipment",
    "Emergency",
    "Responsibilities",
    "Training",
    "Approval",
    "Sign-off",
    "Communication",
    "Inspection",
  ];

  return keywords.some((word) =>
    cleaned.toLowerCase().includes(word.toLowerCase()),
  );
}

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

    if (/^[-*_]{3,}$/.test(line)) return;

    if (/^#{1,6}\s+/.test(line)) {
      children.push(createSubHeading(line.replace(/^#{1,6}\s+/, "")));
      return;
    }

    if (/^\*\*.+\*\*:?\s*$/.test(line)) {
      children.push(
        createSubHeading(line.replace(/\*\*/g, "").replace(/:$/, "")),
      );
      return;
    }

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

    if (/^[-*•]\s+/.test(line)) {
      children.push(createBullet(line.replace(/^[-*•]\s+/, "")));
      return;
    }

    if (/^\d+\.\s+/.test(line)) {
      children.push(createParagraph(line));
      return;
    }

    if (isSubHeading(line)) {
      children.push(createSubHeading(line));
      return;
    }

    children.push(createParagraph(line));
  });

  return children;
}

function createInfoTable(jsa) {
  const rows = [
    ["JSA Number", jsa.jsaNumber ? `JSA-${jsa.jsaNumber}` : "N/A"],
    ["Job / Task", jsa.jobTask || "N/A"],
    ["Title", jsa.title || "N/A"],
    ["Work Area", jsa.workArea?.name || "N/A"],
    ["Location", jsa.location || "N/A"],
    ["Shift", jsa.shift || "N/A"],
    ["Prepared By", jsa.preparedBy?.name || "N/A"],
    ["Date", jsa.date ? new Date(jsa.date).toLocaleDateString("en-GB") : "N/A"],
    ["Status", jsa.status || "N/A"],
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

function createPpeTable(jsa) {
  if (!jsa.requiredPPE || jsa.requiredPPE.length === 0) {
    return [createParagraph("No PPE items recorded.", { italics: true })];
  }

  const rows = [
    new TableRow({
      children: ["PPE Item", "Quantity", "Condition"].map(
        (heading) =>
          new TableCell({
            shading: {
              type: ShadingType.CLEAR,
              fill: "D9EAF7",
            },
            borders: tableBorders(),
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: heading,
                    bold: true,
                    color: "1F4E79",
                    size: 22,
                  }),
                ],
              }),
            ],
          }),
      ),
    }),
    ...jsa.requiredPPE.map(
      (ppe) =>
        new TableRow({
          children: [
            ppe.item || "N/A",
            ppe.quantity || "As needed",
            ppe.condition || "Good",
          ].map(
            (value) =>
              new TableCell({
                borders: tableBorders(),
                children: [createParagraph(value)],
              }),
          ),
        }),
    ),
  ];

  return [
    new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      rows,
    }),
  ];
}

function createToolsTable(jsa) {
  if (!jsa.toolsAndEquipment || jsa.toolsAndEquipment.length === 0) {
    return [
      createParagraph("No tools or equipment recorded.", { italics: true }),
    ];
  }

  const rows = [
    new TableRow({
      children: ["Tool / Equipment", "Condition", "Inspected"].map(
        (heading) =>
          new TableCell({
            shading: {
              type: ShadingType.CLEAR,
              fill: "D9EAF7",
            },
            borders: tableBorders(),
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: heading,
                    bold: true,
                    color: "1F4E79",
                    size: 22,
                  }),
                ],
              }),
            ],
          }),
      ),
    }),
    ...jsa.toolsAndEquipment.map(
      (tool) =>
        new TableRow({
          children: [
            tool.name || "N/A",
            tool.condition || "Good",
            tool.inspected ? "Yes" : "No",
          ].map(
            (value) =>
              new TableCell({
                borders: tableBorders(),
                children: [createParagraph(value)],
              }),
          ),
        }),
    ),
  ];

  return [
    new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      rows,
    }),
  ];
}

function createTrainingList(jsa) {
  if (!jsa.requiredTraining || jsa.requiredTraining.length === 0) {
    return [
      createParagraph("No specific training or certification recorded.", {
        italics: true,
      }),
    ];
  }

  return jsa.requiredTraining.map((training) => createBullet(training));
}

function createApprovalSection() {
  return [
    createMainHeading("Approval and Sign-Off"),

    createParagraph(
      "This Job Safety Analysis has been reviewed by the responsible safety personnel. The document should be printed, reviewed, signed, communicated to the work team, and filed according to the organisation's safety management procedure.",
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

async function generateJSAWordBuffer({ jsa, jsaSections }) {
  const documentChildren = [];

  documentChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 300,
      },
      children: [
        new TextRun({
          text: "JOB SAFETY ANALYSIS",
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
          text: cleanText(jsa.jobTask || jsa.title || "Job Safety Analysis"),
          bold: true,
          size: 28,
          color: "2F5597",
        }),
      ],
    }),
  );

  documentChildren.push(createInfoTable(jsa));

  documentChildren.push(
    createParagraph(
      "This editable Word document was generated from the confirmed Job Safety Analysis sections. The Safety Officer should review, edit where necessary, print, sign, communicate to workers, and file it before work begins.",
      {
        before: 300,
        italics: true,
        color: "666666",
      },
    ),
  );

  documentChildren.push(createMainHeading("Required PPE"));
  documentChildren.push(...createPpeTable(jsa));

  documentChildren.push(createMainHeading("Tools and Equipment"));
  documentChildren.push(...createToolsTable(jsa));

  documentChildren.push(
    createMainHeading("Required Training / Certifications"),
  );
  documentChildren.push(...createTrainingList(jsa));

  jsaSections.forEach((section) => {
    documentChildren.push(createMainHeading(section.title));

    const activeVersion = jsa.activeVersion?.[section.key] || "human";

    let content = "";

    if (activeVersion === "ai") {
      content = jsa.aiSections?.[section.key]?.content || "";
    } else {
      content = jsa.humanSections?.[section.key] || "";
    }

    const bodyParagraphs = createBodyContent(content);
    documentChildren.push(...bodyParagraphs);
  });

  documentChildren.push(...createApprovalSection());

  const doc = new Document({
    creator: "TrueSafe365 JSA System",
    title: cleanText(jsa.title || jsa.jobTask || "Job Safety Analysis"),
    description: "Editable Job Safety Analysis Word document",
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
  generateJSAWordBuffer,
};

