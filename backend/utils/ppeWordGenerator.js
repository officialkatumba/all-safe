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

function formatPPEItem(item) {
  if (!item) return "N/A";

  if (item.item === "other") {
    return cleanText(item.customItem || "Other PPE");
  }

  return cleanText(String(item.item).replace(/_/g, " "));
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
        color: "26A69A",
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
        color: "1E8A7A",
      }),
    ],
  });
}

function createMainHeading(text, color = "26A69A") {
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

function createInfoTable(checklist) {
  const workAreaName = checklist.workArea?.name || "N/A";

  const rows = [
    [
      "Checklist Number",
      checklist.checklistNumber ? `#${checklist.checklistNumber}` : "N/A",
    ],
    ["Title", checklist.title || "PPE Requirements"],
    ["Work Area", workAreaName],
    [
      "Date",
      checklist.date
        ? new Date(checklist.date).toLocaleDateString("en-GB")
        : "N/A",
    ],
    ["Status", checklist.status || "N/A"],
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(
      ([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 32, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.CLEAR, fill: "D9F3EF" },
              borders: tableBorders(),
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: label,
                      bold: true,
                      size: 22,
                      color: "1E8A7A",
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

function createPPERequirementsTable(checklist) {
  const header = new TableRow({
    children: ["PPE Item", "Required", "Condition", "Quantity"].map(
      (heading) =>
        new TableCell({
          shading: { type: ShadingType.CLEAR, fill: "D9F3EF" },
          borders: tableBorders(),
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: heading,
                  bold: true,
                  color: "1E8A7A",
                  size: 22,
                }),
              ],
            }),
          ],
        }),
    ),
  });

  const itemRows =
    checklist.ppeItems && checklist.ppeItems.length > 0
      ? checklist.ppeItems.map(
          (item) =>
            new TableRow({
              children: [
                formatPPEItem(item),
                item.required ? "Yes" : "No",
                item.condition || "Good",
                item.quantity || "As needed",
              ].map(
                (value) =>
                  new TableCell({
                    borders: tableBorders(),
                    children: [createParagraph(value)],
                  }),
              ),
            }),
        )
      : [
          new TableRow({
            children: [
              new TableCell({
                borders: tableBorders(),
                children: [createParagraph("No PPE items recorded.")],
              }),
              new TableCell({
                borders: tableBorders(),
                children: [createParagraph("")],
              }),
              new TableCell({
                borders: tableBorders(),
                children: [createParagraph("")],
              }),
              new TableCell({
                borders: tableBorders(),
                children: [createParagraph("")],
              }),
            ],
          }),
        ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [header, ...itemRows],
  });
}

function createPhysicalChecklistTable(checklist) {
  const header = new TableRow({
    children: [
      "Check",
      "PPE Item",
      "Available",
      "Good Condition",
      "Remarks",
    ].map(
      (heading) =>
        new TableCell({
          shading: { type: ShadingType.CLEAR, fill: "D9F3EF" },
          borders: tableBorders(),
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: heading,
                  bold: true,
                  color: "1E8A7A",
                  size: 22,
                }),
              ],
            }),
          ],
        }),
    ),
  });

  const rows =
    checklist.ppeItems && checklist.ppeItems.length > 0
      ? checklist.ppeItems.map(
          (item) =>
            new TableRow({
              children: [
                "☐",
                formatPPEItem(item),
                "☐ Yes   ☐ No",
                "☐ Yes   ☐ No",
                "",
              ].map(
                (value) =>
                  new TableCell({
                    borders: tableBorders(),
                    children: [
                      createParagraph(value, {
                        size: value === "☐" ? 28 : 22,
                        alignment:
                          value === "☐"
                            ? AlignmentType.CENTER
                            : AlignmentType.LEFT,
                      }),
                    ],
                  }),
              ),
            }),
        )
      : [
          new TableRow({
            children: [
              "☐",
              "No PPE items recorded",
              "☐ Yes   ☐ No",
              "☐ Yes   ☐ No",
              "",
            ].map(
              (value) =>
                new TableCell({
                  borders: tableBorders(),
                  children: [createParagraph(value)],
                }),
            ),
          }),
        ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [header, ...rows],
  });
}

function createInspectionTable(checklist) {
  const header = new TableRow({
    children: [
      "Check",
      "Item to Inspect",
      "Pass Criteria",
      "Result",
      "Remarks",
    ].map(
      (heading) =>
        new TableCell({
          shading: { type: ShadingType.CLEAR, fill: "EAF7FF" },
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
  });

  const rows =
    checklist.inspectionItems && checklist.inspectionItems.length > 0
      ? checklist.inspectionItems.map(
          (item) =>
            new TableRow({
              children: [
                "☐",
                item.item || "Inspection item",
                item.passCriteria || "Must be safe and suitable for use",
                "☐ Pass   ☐ Fail",
                "",
              ].map(
                (value) =>
                  new TableCell({
                    borders: tableBorders(),
                    children: [createParagraph(value)],
                  }),
              ),
            }),
        )
      : [
          new TableRow({
            children: [
              "☐",
              "General PPE inspection",
              "PPE must be available, suitable, clean, and in good condition",
              "☐ Pass   ☐ Fail",
              "",
            ].map(
              (value) =>
                new TableCell({
                  borders: tableBorders(),
                  children: [createParagraph(value)],
                }),
            ),
          }),
        ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [header, ...rows],
  });
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
              createParagraph("Checked By:", { bold: true, color: "1E8A7A" }),
              createParagraph("Name: ______________________________"),
              createParagraph("Signature: ___________________________"),
              createParagraph("Date: _______________________________"),
            ],
          }),
          new TableCell({
            borders: tableBorders(),
            children: [
              createParagraph("Approved / Verified By:", {
                bold: true,
                color: "1E8A7A",
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

async function generatePPEWordBuffer({ checklist }) {
  const children = [];

  children.push(createTitle("PPE Requirements and Checklist"));
  children.push(createSubtitle(checklist.title || "PPE Checklist"));

  children.push(createInfoTable(checklist));

  children.push(
    createParagraph(
      "This editable Word document lists the required PPE for the work area and includes a practical checklist section for physical verification before work begins.",
      {
        before: 300,
        italics: true,
        color: "666666",
      },
    ),
  );

  children.push(createMainHeading("Required PPE"));
  children.push(createPPERequirementsTable(checklist));

  children.push(createMainHeading("Physical PPE Checklist"));
  children.push(
    createParagraph(
      "Use this checklist to confirm that each required PPE item is available, suitable, and in good condition before the work starts.",
    ),
  );
  children.push(createPhysicalChecklistTable(checklist));

  children.push(createMainHeading("Inspection Checklist", "1F4E79"));
  children.push(createInspectionTable(checklist));

  children.push(createMainHeading("Sign-Off"));
  children.push(createSignOffSection());

  const doc = new Document({
    creator: "TrueSafe PPE Checklist System",
    title: cleanText(checklist.title || "PPE Requirements and Checklist"),
    description: "Editable PPE requirements and checklist Word document",
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
  generatePPEWordBuffer,
};

