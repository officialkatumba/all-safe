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
        color: "0D6EFD",
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
        color: "198754",
      }),
    ],
  });
}

function createMainHeading(text, color = "0D6EFD") {
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

function createInfoTable(audit) {
  const rows = [
    ["Audit Number", audit.auditNumber ? `#${audit.auditNumber}` : "N/A"],
    ["Title", audit.title || "AI Safety Audit Scorecard"],
    ["Work Area", audit.workArea?.name || "N/A"],
    ["Audit Status", audit.auditStatus || "N/A"],
    ["Audit Period", audit.auditPeriod?.label || "Recent safety data"],
    [
      "Generated Date",
      audit.createdAt
        ? new Date(audit.createdAt).toLocaleDateString("en-GB")
        : "N/A",
    ],
    ["Initiated By", audit.initiatedBy?.name || "N/A"],
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(
      ([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 32, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.CLEAR, fill: "D9EAF7" },
              borders: tableBorders(),
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: label,
                      bold: true,
                      size: 22,
                      color: "0D6EFD",
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

function createScoreTable(audit) {
  const score = audit.finalScore || {};

  const rows = [
    [
      "Overall Score",
      score.overallScore != null ? `${score.overallScore}/100` : "Not scored",
    ],
    ["Grade", String(score.grade || "N/A").replace(/_/g, " ")],
    ["Risk Level", score.riskLevel || "N/A"],
    [
      "Scored Date",
      score.scoredAt
        ? new Date(score.scoredAt).toLocaleDateString("en-GB")
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
              shading: { type: ShadingType.CLEAR, fill: "D1E7DD" },
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
              children: [createParagraph(value)],
            }),
          ],
        }),
    ),
  });
}

function createSectionScoresTable(audit) {
  const sectionScores = audit.finalScore?.sectionScores || [];

  const header = new TableRow({
    children: ["Section", "Score", "Percentage", "Comment"].map(
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
                  color: "0D6EFD",
                  size: 21,
                }),
              ],
            }),
          ],
        }),
    ),
  });

  const rows =
    sectionScores.length > 0
      ? sectionScores.map(
          (item) =>
            new TableRow({
              children: [
                item.sectionName || "Section",
                `${item.score || 0}/${item.maxScore || 0}`,
                `${item.percentage || 0}%`,
                item.comment || "",
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
            children: ["No section scores generated", "", "", ""].map(
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

function createQuestionsTable(audit) {
  const rows = [
    new TableRow({
      children: [
        "Section",
        "Question",
        "Officer Response",
        "Status",
        "AI Evaluation",
      ].map(
        (heading) =>
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: "F8D7DA" },
            borders: tableBorders(),
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: heading,
                    bold: true,
                    color: "C00000",
                    size: 20,
                  }),
                ],
              }),
            ],
          }),
      ),
    }),
  ];

  audit.auditSections.forEach((section) => {
    section.questions.forEach((q) => {
      rows.push(
        new TableRow({
          children: [
            section.sectionName,
            q.questionText,
            q.officerResponse?.answerText || "No response",
            q.officerResponse?.status || "not_answered",
            q.aiEvaluation?.evaluationComment || "",
          ].map(
            (value) =>
              new TableCell({
                borders: tableBorders(),
                children: [createParagraph(value, { size: 19 })],
              }),
          ),
        }),
      );
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
  });
}

function createListSection(items, fallback) {
  if (!items || items.length === 0) {
    return [createParagraph(fallback, { italics: true, color: "666666" })];
  }

  return items.map((item) => createBullet(item));
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
              createParagraph("Management Review / Decision", {
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

async function generateSafetyAuditWordBuffer({ audit }) {
  const children = [];

  children.push(createTitle("AI Safety Audit Scorecard"));
  children.push(createSubtitle(audit.title || "Work Area Safety Audit"));

  children.push(createInfoTable(audit));

  children.push(
    createParagraph(
      "This AI Safety Audit Scorecard was generated through an AI-led audit interview. It analyzes safety documents, asks audit questions, reviews safety officer responses, and produces a management-level safety score and recommendations.",
      {
        before: 300,
        italics: true,
        color: "666666",
      },
    ),
  );

  children.push(createMainHeading("Final Safety Score", "198754"));
  children.push(createScoreTable(audit));

  children.push(createMainHeading("Score Summary", "198754"));
  children.push(
    createParagraph(
      audit.finalScore?.scoreSummary || "No score summary generated.",
    ),
  );

  children.push(createMainHeading("Section Scores", "0D6EFD"));
  children.push(createSectionScoresTable(audit));

  children.push(createMainHeading("Critical Findings", "C00000"));
  children.push(
    ...createListSection(
      audit.finalScore?.criticalFindings,
      "No critical findings listed.",
    ),
  );

  children.push(createMainHeading("Positive Findings", "198754"));
  children.push(
    ...createListSection(
      audit.finalScore?.positiveFindings,
      "No positive findings listed.",
    ),
  );

  children.push(createMainHeading("Recommendations", "0D6EFD"));
  children.push(
    ...createListSection(
      audit.finalScore?.recommendations,
      "No recommendations listed.",
    ),
  );

  children.push(createMainHeading("Immediate Actions", "C00000"));
  children.push(
    ...createListSection(
      audit.finalScore?.immediateActions,
      "No immediate actions listed.",
    ),
  );

  children.push(createMainHeading("Follow-Up Actions", "D97706"));
  children.push(
    ...createListSection(
      audit.finalScore?.followUpActions,
      "No follow-up actions listed.",
    ),
  );

  children.push(createMainHeading("Audit Interview Responses", "C00000"));
  children.push(createQuestionsTable(audit));

  children.push(createMainHeading("Management Decision Advice", "0D6EFD"));
  children.push(
    createParagraph(
      audit.finalScore?.managementDecisionAdvice ||
        "No management decision advice generated.",
    ),
  );

  children.push(createMainHeading("Management Sign-Off", "856404"));
  children.push(createManagementSignOffBox());

  const doc = new Document({
    creator: "TrueSafe365 AI Safety Audit Scorecard System",
    title: cleanText(audit.title || "AI Safety Audit Scorecard"),
    description: "AI-led safety audit scorecard and management report",
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
  generateSafetyAuditWordBuffer,
};

