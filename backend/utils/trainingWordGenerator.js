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

function createTitle(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 300 },
    children: [
      new TextRun({
        text: cleanText(text).toUpperCase(),
        bold: true,
        size: 38,
        color: "667EEA",
      }),
    ],
  });
}

function createSubtitle(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
    children: [
      new TextRun({
        text: cleanText(text),
        bold: true,
        size: 28,
        color: "764BA2",
      }),
    ],
  });
}

function createMainHeading(text, color = "667EEA") {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 160 },
    border: {
      bottom: {
        color,
        space: 6,
        style: BorderStyle.SINGLE,
        size: 8,
      },
    },
    children: [
      new TextRun({
        text: cleanText(text).toUpperCase(),
        bold: true,
        size: 28,
        color,
      }),
    ],
  });
}

function createBullet(text) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 100, line: 276 },
    children: [
      new TextRun({
        text: cleanText(text),
        size: 22,
      }),
    ],
  });
}

function createInfoTable(training) {
  const rows = [
    [
      "Requirement Number",
      training.requirementNumber ? `#${training.requirementNumber}` : "N/A",
    ],
    ["Title", training.title || "Training Requirements"],
    ["Work Area", training.workArea?.name || "N/A"],
    ["Category", String(training.category || "N/A").replace(/_/g, " ")],
    ["Priority", training.priority || "medium"],
    ["Duration", training.duration || "N/A"],
    ["Refresher Frequency", training.refresherFrequency || "N/A"],
    [
      "Generated Date",
      training.generatedDate
        ? new Date(training.generatedDate).toLocaleDateString("en-GB")
        : "N/A",
    ],
    ["Status", training.status || "published"],
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(
      ([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 32, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.CLEAR, fill: "E6E9FF" },
              borders: tableBorders(),
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: label,
                      bold: true,
                      size: 22,
                      color: "667EEA",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 68, type: WidthType.PERCENTAGE },
              borders: tableBorders(),
              children: [createParagraph(value)],
            }),
          ],
        }),
    ),
  });
}

function createRecommendedTrainingTable(training) {
  const recommendedTrainings = training.recommendedTrainings || [];

  const header = new TableRow({
    children: [
      "Training",
      "Priority",
      "Target Roles",
      "Duration",
      "Reason",
    ].map(
      (heading) =>
        new TableCell({
          shading: { type: ShadingType.CLEAR, fill: "E6E9FF" },
          borders: tableBorders(),
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: heading,
                  bold: true,
                  color: "667EEA",
                  size: 21,
                }),
              ],
            }),
          ],
        }),
    ),
  });

  const rows =
    recommendedTrainings.length > 0
      ? recommendedTrainings.map(
          (item) =>
            new TableRow({
              children: [
                item.trainingTitle || "Recommended Training",
                item.priority || "medium",
                item.targetRoles?.join(", ") || "Affected workers",
                item.duration || "To be determined",
                item.reason || "Required based on work area safety risks.",
              ].map(
                (value) =>
                  new TableCell({
                    borders: tableBorders(),
                    children: [createParagraph(value, { size: 20 })],
                  }),
              ),
            }),
        )
      : [
          new TableRow({
            children: [
              training.title || "Recommended Training",
              training.priority || "medium",
              training.requiredForRoles?.join(", ") || "All workers",
              training.duration || "To be determined",
              training.description || "Required based on work area hazards.",
            ].map(
              (value) =>
                new TableCell({
                  borders: tableBorders(),
                  children: [createParagraph(value, { size: 20 })],
                }),
            ),
          }),
        ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [header, ...rows],
  });
}

function createPhysicalChecklistTable(training) {
  const checklist = training.trainingChecklist || [];

  const header = new TableRow({
    children: [
      "Check",
      "Training Item",
      "Pass Criteria",
      "Delivered",
      "Remarks",
    ].map(
      (heading) =>
        new TableCell({
          shading: { type: ShadingType.CLEAR, fill: "E6E9FF" },
          borders: tableBorders(),
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: heading,
                  bold: true,
                  color: "667EEA",
                  size: 21,
                }),
              ],
            }),
          ],
        }),
    ),
  });

  const rows =
    checklist.length > 0
      ? checklist.map(
          (item) =>
            new TableRow({
              children: [
                "☐",
                item.checkItem || "Training item",
                item.passCriteria || "Training delivered and understood.",
                "☐ Yes   ☐ No",
                "",
              ].map(
                (value) =>
                  new TableCell({
                    borders: tableBorders(),
                    children: [
                      createParagraph(value, { size: value === "☐" ? 28 : 20 }),
                    ],
                  }),
              ),
            }),
        )
      : [
          new TableRow({
            children: [
              "☐",
              training.title || "Training delivered",
              "Training delivered and understood by affected workers.",
              "☐ Yes   ☐ No",
              "",
            ].map(
              (value) =>
                new TableCell({
                  borders: tableBorders(),
                  children: [
                    createParagraph(value, { size: value === "☐" ? 28 : 20 }),
                  ],
                }),
            ),
          }),
        ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [header, ...rows],
  });
}

function createListSection(items, fallback) {
  if (!items || items.length === 0) {
    return [createParagraph(fallback, { italics: true, color: "666666" })];
  }

  return items.map((item) => createBullet(item));
}

function createSignOffSection() {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: tableBorders(),
            children: [
              createParagraph("Training Facilitator:", {
                bold: true,
                color: "667EEA",
              }),
              createParagraph("Name: ______________________________"),
              createParagraph("Signature: ___________________________"),
              createParagraph("Date: _______________________________"),
            ],
          }),
          new TableCell({
            borders: tableBorders(),
            children: [
              createParagraph("Safety Officer Verification:", {
                bold: true,
                color: "667EEA",
              }),
              createParagraph("Name: ______________________________"),
              createParagraph("Signature: ___________________________"),
              createParagraph("Date: _______________________________"),
            ],
          }),
        ],
      }),
    ],
  });
}

async function generateTrainingWordBuffer({ training }) {
  const children = [];

  children.push(createTitle("Training Requirements and Checklist"));
  children.push(createSubtitle(training.title || "AI Recommended Training"));

  children.push(createInfoTable(training));

  children.push(
    createParagraph(
      "This editable Word document lists the AI-recommended training requirements for the work area and includes a practical checklist section for safety officer verification.",
      {
        before: 300,
        italics: true,
        color: "666666",
      },
    ),
  );

  children.push(createMainHeading("Training Overview"));
  children.push(
    createParagraph(training.description || "No overview provided."),
  );

  children.push(createMainHeading("Recommended Training List"));
  children.push(createRecommendedTrainingTable(training));

  children.push(createMainHeading("Learning Objectives"));
  children.push(
    ...createListSection(
      training.learningObjectives,
      "No learning objectives provided.",
    ),
  );

  children.push(createMainHeading("Key Topics"));
  children.push(
    ...createListSection(training.keyTopics, "No key topics provided."),
  );

  children.push(createMainHeading("Prerequisites"));
  children.push(
    ...createListSection(training.prerequisites, "No prerequisites specified."),
  );

  children.push(createMainHeading("Physical Training Checklist"));
  children.push(
    createParagraph(
      "Use this checklist to confirm that the required training was delivered, understood, and properly recorded.",
    ),
  );
  children.push(createPhysicalChecklistTable(training));

  children.push(createMainHeading("Sign-Off"));
  children.push(createSignOffSection());

  const doc = new Document({
    creator: "TrueSafe Training Requirement System",
    title: cleanText(training.title || "Training Requirements and Checklist"),
    description: "Editable training requirements and checklist Word document",
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
        children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

module.exports = {
  generateTrainingWordBuffer,
};
