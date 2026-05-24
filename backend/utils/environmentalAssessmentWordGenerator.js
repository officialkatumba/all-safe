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

function paragraph(text, options = {}) {
  return new Paragraph({
    spacing: {
      before: options.before || 0,
      after: options.after ?? 140,
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

function title(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 260 },
    children: [
      new TextRun({
        text: cleanText(text).toUpperCase(),
        bold: true,
        size: 38,
        color: "198754",
      }),
    ],
  });
}

function subtitle(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 360 },
    children: [
      new TextRun({
        text: cleanText(text),
        bold: true,
        size: 26,
        color: "1F4E79",
      }),
    ],
  });
}

function heading(text, color = "198754") {
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

function bullet(text) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 100, line: 276 },
    children: [new TextRun({ text: cleanText(text), size: 22 })],
  });
}

function infoTable(assessment) {
  const rows = [
    [
      "Assessment Number",
      assessment.assessmentNumber ? `#${assessment.assessmentNumber}` : "N/A",
    ],
    ["Title", assessment.title || "Environmental Screening"],
    ["Worksite", assessment.worksite?.name || "N/A"],
    ["Work Area", assessment.workArea?.name || "N/A"],
    ["Assessment Type", String(assessment.assessmentType || "screening").replace(/_/g, " ")],
    ["Review Status", String(assessment.approval?.status || "draft").replace(/_/g, " ")],
    [
      "Generated Date",
      assessment.createdAt
        ? new Date(assessment.createdAt).toLocaleDateString("en-GB")
        : "N/A",
    ],
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(
      ([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 32, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.CLEAR, fill: "DFF3E7" },
              borders: tableBorders(),
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: label,
                      bold: true,
                      size: 22,
                      color: "198754",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 68, type: WidthType.PERCENTAGE },
              borders: tableBorders(),
              children: [paragraph(value, { after: 40 })],
            }),
          ],
        }),
    ),
  });
}

function impactTable(assessment) {
  const impacts = assessment.impacts || [];
  const rows =
    impacts.length > 0
      ? impacts.map(
          (impact) =>
            new TableRow({
              children: [
                tableCell(impact.impact || "N/A"),
                tableCell(impact.receptor || "N/A"),
                tableCell(impact.severity || "N/A"),
                tableCell(impact.riskLevel || "N/A"),
                tableCell((impact.mitigationMeasures || []).join("; ") || "N/A"),
                tableCell((impact.monitoringRequirements || []).join("; ") || "N/A"),
              ],
            }),
        )
      : [
          new TableRow({
            children: [
              tableCell("No impacts recorded."),
              tableCell(""),
              tableCell(""),
              tableCell(""),
              tableCell(""),
              tableCell(""),
            ],
          }),
        ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          headerCell("Impact"),
          headerCell("Receptor"),
          headerCell("Severity"),
          headerCell("Risk"),
          headerCell("Mitigation"),
          headerCell("Monitoring"),
        ],
      }),
      ...rows,
    ],
  });
}

function headerCell(text) {
  return new TableCell({
    shading: { type: ShadingType.CLEAR, fill: "198754" },
    borders: tableBorders(),
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: true,
            color: "FFFFFF",
            size: 20,
          }),
        ],
      }),
    ],
  });
}

function tableCell(text) {
  return new TableCell({
    borders: tableBorders(),
    children: [paragraph(text || "", { size: 20, after: 60 })],
  });
}

function listSection(items, fallback) {
  const values = items && items.length > 0 ? items : [fallback];
  return values.map((item) => bullet(item));
}

async function generateEnvironmentalAssessmentWordBuffer({ assessment }) {
  const children = [
    title("Environmental Screening and Impact Register"),
    subtitle(assessment.title || "Environmental Assessment Draft"),
    infoTable(assessment),
    paragraph(
      "This editable document is an AI-assisted environmental screening and impact register. It is not a final statutory approval document. A competent environmental or safety professional must review, amend, approve, and file the final version.",
      { italics: true, color: "555555", before: 260 },
    ),
    heading("Activity Description", "1F4E79"),
    paragraph(
      assessment.activityDescription || "No activity description provided.",
    ),
    heading("Executive Summary", "198754"),
    paragraph(assessment.aiSummary?.executiveSummary || "No summary provided."),
    heading("Key Environmental Risks", "C00000"),
    ...listSection(assessment.aiSummary?.keyRisks, "No key risks listed."),
    heading("Recommended Actions", "198754"),
    ...listSection(
      assessment.aiSummary?.recommendedActions,
      "No recommended actions listed.",
    ),
    heading("Monitoring Plan", "1F4E79"),
    ...listSection(
      assessment.aiSummary?.monitoringPlan,
      "No monitoring plan listed.",
    ),
    heading("Assumptions and Evidence Gaps", "D97706"),
    ...listSection(
      assessment.aiSummary?.assumptionsAndGaps,
      "No assumptions or evidence gaps listed.",
    ),
    heading("Impact Register", "198754"),
    impactTable(assessment),
    heading("Review and Approval", "856404"),
    paragraph("Reviewed By: ______________________________"),
    paragraph("Designation: _______________________________"),
    paragraph("Signature: ________________________________"),
    paragraph("Date: _____________________________________"),
    paragraph("Comments: _________________________________"),
  ];

  const doc = new Document({
    creator: "Katumba True Safe",
    title: cleanText(assessment.title || "Environmental Screening"),
    description: "Environmental screening and impact register",
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 900,
              right: 900,
              bottom: 900,
              left: 900,
            },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}

module.exports = { generateEnvironmentalAssessmentWordBuffer };
