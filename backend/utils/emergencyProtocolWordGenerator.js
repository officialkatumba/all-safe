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

function createTitle(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 300 },
    children: [
      new TextRun({
        text: cleanText(text).toUpperCase(),
        bold: true,
        size: 38,
        color: "C00000",
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
        color: "1F4E79",
      }),
    ],
  });
}

function createMainHeading(text, color = "C00000") {
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
        color: "1F1F1F",
      }),
    ],
  });
}

function createStructuredContent(content) {
  const children = [];

  if (!content || !String(content).trim()) {
    children.push(
      createParagraph("No content was generated for this section.", {
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

  lines.forEach((line) => {
    if (/^[-*_]{3,}$/.test(line)) return;

    if (/^[-*•]\s+/.test(line)) {
      children.push(createBullet(line.replace(/^[-*•]\s+/, "")));
      return;
    }

    if (/^\d+\.\s+/.test(line)) {
      children.push(createParagraph(line));
      return;
    }

    children.push(createParagraph(line));
  });

  return children;
}

function createInfoTable(protocol) {
  const rows = [
    [
      "Protocol Number",
      protocol.protocolNumber ? `#${protocol.protocolNumber}` : "N/A",
    ],
    ["Title", protocol.title || "N/A"],
    ["Work Area", protocol.workArea?.name || "N/A"],
    ["Priority Level", protocol.priorityLevel || "medium"],
    ["Period Covered", protocol.periodCovered?.label || "Recent safety data"],
    [
      "Generated Date",
      protocol.createdAt
        ? new Date(protocol.createdAt).toLocaleDateString("en-GB")
        : "N/A",
    ],
    ["Status", protocol.status || "generated"],
    ["AI Model", protocol.aiModel || "N/A"],
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(
      ([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 32, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.CLEAR, fill: "F8D7DA" },
              borders: tableBorders(),
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: label,
                      bold: true,
                      size: 22,
                      color: "C00000",
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

function createDataSummaryTable(protocol) {
  const rows = [
    ["Incidents / Near Misses", protocol.dataCounts?.incidents || 0],
    ["Safety Observations", protocol.dataCounts?.observations || 0],
    ["Risk Assessments", protocol.dataCounts?.riskAssessments || 0],
    ["JSAs", protocol.dataCounts?.jsas || 0],
    ["Safety Talks", protocol.dataCounts?.safetyTalks || 0],
    ["PPE Checklists", protocol.dataCounts?.ppeChecklists || 0],
    ["Training Requirements", protocol.dataCounts?.trainingRequirements || 0],
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: ["Safety Data Source", "Records Analyzed"].map(
          (heading) =>
            new TableCell({
              shading: { type: ShadingType.CLEAR, fill: "D9EAF7" },
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
      ...rows.map(
        ([label, value]) =>
          new TableRow({
            children: [
              new TableCell({
                borders: tableBorders(),
                children: [createParagraph(label)],
              }),
              new TableCell({
                borders: tableBorders(),
                children: [createParagraph(String(value))],
              }),
            ],
          }),
      ),
    ],
  });
}

function createManagementSignOffBox() {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: tableBorders(),
            shading: { type: ShadingType.CLEAR, fill: "FFF3CD" },
            children: [
              createParagraph("Emergency Preparedness Review / Approval", {
                bold: true,
                color: "856404",
              }),
              createParagraph(
                "Reviewed By: ______________________________________________",
              ),
              createParagraph(
                "Position: __________________________________________________",
              ),
              createParagraph("Emergency Drill Required: Yes / No"),
              createParagraph(
                "Target Drill Date: __________________________________________",
              ),
              createParagraph(
                "Signature: _________________________________________________",
              ),
              createParagraph(
                "Date: _______________________________________________________",
              ),
            ],
          }),
        ],
      }),
    ],
  });
}

async function generateEmergencyProtocolWordBuffer({ protocol }) {
  const children = [];

  children.push(createTitle("Emergency Procedure and Preparedness Protocol"));
  children.push(
    createSubtitle(protocol.title || "Emergency Preparedness Protocol"),
  );

  children.push(createInfoTable(protocol));

  children.push(
    createParagraph(
      "This AI-generated Emergency Procedure and Preparedness Protocol analyzes available safety records to identify likely emergency scenarios, preparedness gaps, and practical emergency response actions for the work area.",
      {
        before: 300,
        italics: true,
        color: "666666",
      },
    ),
  );

  children.push(createMainHeading("Executive Summary", "C00000"));
  children.push(...createStructuredContent(protocol.summary || ""));

  children.push(
    createMainHeading(
      "Part 1: Emergency Risk and Preparedness Assessment",
      "C00000",
    ),
  );
  children.push(
    ...createStructuredContent(protocol.emergencyRiskAssessment || ""),
  );

  children.push(
    createMainHeading(
      "Part 2: Emergency Response Procedures and Action Plan",
      "1F4E79",
    ),
  );
  children.push(
    ...createStructuredContent(protocol.emergencyResponseProcedures || ""),
  );

  children.push(createMainHeading("Evacuation Plan", "C00000"));
  children.push(...createStructuredContent(protocol.evacuationPlan || ""));

  children.push(createMainHeading("Communication Plan", "1F4E79"));
  children.push(...createStructuredContent(protocol.communicationPlan || ""));

  children.push(createMainHeading("Emergency Types Covered", "C00000"));
  if (
    protocol.emergencyTypesCovered &&
    protocol.emergencyTypesCovered.length > 0
  ) {
    protocol.emergencyTypesCovered.forEach((item) =>
      children.push(createBullet(item)),
    );
  } else {
    children.push(
      createParagraph("No specific emergency types listed.", { italics: true }),
    );
  }

  children.push(createMainHeading("Required Emergency Equipment", "1F4E79"));
  if (protocol.requiredEquipment && protocol.requiredEquipment.length > 0) {
    protocol.requiredEquipment.forEach((item) =>
      children.push(createBullet(item)),
    );
  } else {
    children.push(
      createParagraph("No specific emergency equipment listed.", {
        italics: true,
      }),
    );
  }

  children.push(createMainHeading("Required Training and Drills", "C00000"));
  if (protocol.requiredTraining && protocol.requiredTraining.length > 0) {
    protocol.requiredTraining.forEach((item) =>
      children.push(createBullet(item)),
    );
  } else {
    children.push(
      createParagraph("No specific emergency training listed.", {
        italics: true,
      }),
    );
  }

  children.push(createMainHeading("Recommended Actions", "1F4E79"));
  if (protocol.recommendedActions && protocol.recommendedActions.length > 0) {
    protocol.recommendedActions.forEach((item) =>
      children.push(createBullet(item)),
    );
  } else {
    children.push(
      createParagraph("No specific actions listed.", { italics: true }),
    );
  }

  children.push(createMainHeading("Safety Data Summary", "C00000"));
  children.push(createDataSummaryTable(protocol));

  children.push(createMainHeading("Management Review and Sign-Off", "856404"));
  children.push(createManagementSignOffBox());

  const doc = new Document({
    creator: "TrueSafe Emergency Preparedness System",
    title: cleanText(
      protocol.title || "Emergency Procedure and Preparedness Protocol",
    ),
    description: "AI-generated emergency preparedness protocol",
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
  generateEmergencyProtocolWordBuffer,
};

