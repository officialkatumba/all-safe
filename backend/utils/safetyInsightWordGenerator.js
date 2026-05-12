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
    spacing: {
      after: 300,
    },
    children: [
      new TextRun({
        text: cleanText(text).toUpperCase(),
        bold: true,
        size: 38,
        color: "6F42C1",
      }),
    ],
  });
}

function createSubtitle(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: {
      after: 400,
    },
    children: [
      new TextRun({
        text: cleanText(text),
        bold: true,
        size: 28,
        color: "198754",
      }),
    ],
  });
}

function createMainHeading(text, color = "6F42C1") {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: {
      before: 320,
      after: 160,
    },
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

function createSubHeading(text, color = "198754") {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: {
      before: 220,
      after: 100,
    },
    children: [
      new TextRun({
        text: cleanText(text),
        bold: true,
        size: 24,
        color,
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

function createInfoTable(insight) {
  const rows = [
    [
      "Insight Number",
      insight.insightNumber ? `#${insight.insightNumber}` : "N/A",
    ],
    ["Title", insight.title || "N/A"],
    ["Work Area", insight.workArea?.name || "N/A"],
    ["Priority Level", insight.priorityLevel || "medium"],
    ["Period Covered", insight.periodCovered?.label || "Recent safety data"],
    [
      "Generated Date",
      insight.createdAt
        ? new Date(insight.createdAt).toLocaleDateString("en-GB")
        : "N/A",
    ],
    ["Status", insight.status || "generated"],
    ["AI Model", insight.aiModel || "N/A"],
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
                size: 32,
                type: WidthType.PERCENTAGE,
              },
              shading: {
                type: ShadingType.CLEAR,
                fill: "E9D8FD",
              },
              borders: tableBorders(),
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: label,
                      bold: true,
                      size: 22,
                      color: "6F42C1",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: {
                size: 68,
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

function createDataSummaryTable(insight) {
  const rows = [
    ["Incidents / Near Misses", insight.dataCounts?.incidents || 0],
    ["Near Misses", insight.dataCounts?.nearMisses || 0],
    ["Safety Observations", insight.dataCounts?.observations || 0],
    ["At-Risk Observations", insight.dataCounts?.atRiskObservations || 0],
    ["Positive Observations", insight.dataCounts?.positiveObservations || 0],
    ["Risk Assessments", insight.dataCounts?.riskAssessments || 0],
    ["JSAs", insight.dataCounts?.jsas || 0],
    ["Safety Talks", insight.dataCounts?.safetyTalks || 0],
  ];

  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    rows: [
      new TableRow({
        children: ["Safety Data Source", "Records Analyzed"].map(
          (heading) =>
            new TableCell({
              shading: {
                type: ShadingType.CLEAR,
                fill: "D1E7DD",
              },
              borders: tableBorders(),
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: heading,
                      bold: true,
                      color: "198754",
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

function createDocumentActionTable(insight) {
  const actions = insight.recommendedDocumentActions || {};

  const rows = [
    [
      "Regenerate Risk Assessment",
      actions.regenerateRiskAssessment ? "YES" : "NO",
    ],
    ["Review Risk Assessment", actions.reviewRiskAssessment ? "YES" : "NO"],
    ["Generate / Review JSA", actions.generateOrReviewJSA ? "YES" : "NO"],
    ["Generate Safety Talk", actions.generateSafetyTalk ? "YES" : "NO"],
    [
      "Review Corrective Actions",
      actions.reviewCorrectiveActions ? "YES" : "NO",
    ],
  ];

  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    rows: [
      new TableRow({
        children: ["Suggested Document Action", "AI Recommendation"].map(
          (heading) =>
            new TableCell({
              shading: {
                type: ShadingType.CLEAR,
                fill: "E9D8FD",
              },
              borders: tableBorders(),
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: heading,
                      bold: true,
                      color: "6F42C1",
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
                children: [
                  createParagraph(value, {
                    bold: value === "YES",
                    color: value === "YES" ? "C00000" : "666666",
                  }),
                ],
              }),
            ],
          }),
      ),
    ],
  });
}

function createFocusAreas(insight) {
  const children = [];

  if (
    !insight.recommendedFocusAreas ||
    insight.recommendedFocusAreas.length === 0
  ) {
    children.push(
      createParagraph("No specific focus areas were identified.", {
        italics: true,
        color: "666666",
      }),
    );
    return children;
  }

  insight.recommendedFocusAreas.forEach((area) => {
    children.push(createBullet(area));
  });

  return children;
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
              color: "6F42C1",
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

    children.push(createParagraph(line));
  });

  return children;
}

function createManagementDecisionBox() {
  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: tableBorders(),
            shading: {
              type: ShadingType.CLEAR,
              fill: "FFF3CD",
            },
            children: [
              createParagraph("Management Review / Decision Notes", {
                bold: true,
                color: "856404",
              }),
              createParagraph(
                "Decision Taken: ______________________________________________",
              ),
              createParagraph(
                "Responsible Person: __________________________________________",
              ),
              createParagraph(
                "Target Completion Date: _______________________________________",
              ),
              createParagraph(
                "Management Signature: _________________________________________",
              ),
              createParagraph(
                "Date: _________________________________________________________",
              ),
            ],
          }),
        ],
      }),
    ],
  });
}

async function generateSafetyInsightWordBuffer({ insight }) {
  const children = [];

  children.push(createTitle("AI Safety Insight Report"));

  children.push(
    createSubtitle(
      insight.title || "Safety Insight for Management Decision-Making",
    ),
  );

  children.push(createInfoTable(insight));

  children.push(
    createParagraph(
      "This AI-generated Safety Insight Report analyzes available safety records to identify emerging patterns, priority concerns, and recommended areas of management attention. It is intended to support safety leadership, planning, and decision-making.",
      {
        before: 300,
        italics: true,
        color: "666666",
      },
    ),
  );

  children.push(createMainHeading("Executive Summary", "6F42C1"));
  children.push(...createStructuredContent(insight.summary || ""));

  children.push(
    createMainHeading(
      "Part 1: Comprehensive Site-Wide Safety Concerns and Observations",
      "6F42C1",
    ),
  );
  children.push(
    ...createStructuredContent(insight.safetyConcernsAndObservations || ""),
  );

  children.push(
    createMainHeading("Part 2: Actionable Recommendations", "198754"),
  );
  children.push(
    ...createStructuredContent(insight.actionableRecommendations || ""),
  );

  children.push(createMainHeading("Recommended Areas of Attention", "D97706"));
  children.push(...createFocusAreas(insight));

  children.push(
    createMainHeading("Suggested Follow-Up Document Actions", "6F42C1"),
  );
  children.push(createDocumentActionTable(insight));

  children.push(createMainHeading("Safety Data Summary", "198754"));
  children.push(createDataSummaryTable(insight));

  children.push(createMainHeading("Management Decision Section", "D97706"));
  children.push(
    createParagraph(
      "This section is provided for management to record final decisions, responsibilities, and follow-up actions after reviewing the AI safety insight.",
    ),
  );
  children.push(createManagementDecisionBox());

  const doc = new Document({
    creator: "TrueSafe AI Safety Insight System",
    title: cleanText(insight.title || "AI Safety Insight Report"),
    description:
      "AI-generated safety insight report for management decision-making",
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
  generateSafetyInsightWordBuffer,
};
