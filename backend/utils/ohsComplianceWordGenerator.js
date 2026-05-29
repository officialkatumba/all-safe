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
    .replace(/\s+/g, " ")
    .trim();
}

function borders() {
  return {
    top: { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" },
    left: { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" },
    right: { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" },
  };
}

function p(text, options = {}) {
  return new Paragraph({
    spacing: { after: options.after ?? 140, line: 276 },
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

function heading(text, color = "198754") {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 160 },
    border: {
      bottom: { color, space: 6, style: BorderStyle.SINGLE, size: 8 },
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
    spacing: { after: 100 },
    children: [new TextRun({ text: cleanText(text), size: 22 })],
  });
}

function list(items, fallback) {
  if (!items || items.length === 0)
    return [p(fallback, { italics: true, color: "666666" })];
  return items.map((item) => bullet(item));
}

function infoTable(audit) {
  const result = audit.finalCompliance || {};
  const rows = [
    ["Audit Number", audit.auditNumber ? `#${audit.auditNumber}` : "N/A"],
    ["Act", audit.actName || "Occupational Health and Safety Bill, 2025"],
    ["Work Area", audit.workArea?.name || "N/A"],
    [
      "Compliance Score",
      result.overallScore != null ? `${result.overallScore}/100` : "Not scored",
    ],
    [
      "Compliance Grade",
      String(result.complianceGrade || "N/A").replace(/_/g, " "),
    ],
    ["Legal Risk Level", result.legalRiskLevel || "N/A"],
    ["Audit Status", String(audit.auditStatus || "N/A").replace(/_/g, " ")],
    [
      "Generated Date",
      audit.createdAt
        ? new Date(audit.createdAt).toLocaleDateString("en-GB")
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
              borders: borders(),
              children: [p(label, { bold: true, color: "198754" })],
            }),
            new TableCell({
              width: { size: 68, type: WidthType.PERCENTAGE },
              borders: borders(),
              children: [p(value)],
            }),
          ],
        }),
    ),
  });
}

function categoryScoreTable(audit) {
  const scores = audit.finalCompliance?.categoryScores || [];

  const header = new TableRow({
    children: ["Category", "Score", "Percentage", "Comment"].map(
      (h) =>
        new TableCell({
          shading: { type: ShadingType.CLEAR, fill: "D9EAF7" },
          borders: borders(),
          children: [p(h, { bold: true, color: "0D6EFD", size: 20 })],
        }),
    ),
  });

  const rows = scores.length
    ? scores.map(
        (s) =>
          new TableRow({
            children: [
              s.category || "Category",
              `${s.score || 0}/${s.maxScore || 0}`,
              `${s.percentage || 0}%`,
              s.comment || "",
            ].map(
              (v) =>
                new TableCell({
                  borders: borders(),
                  children: [p(v, { size: 19 })],
                }),
            ),
          }),
      )
    : [
        new TableRow({
          children: ["No category scores generated", "", "", ""].map(
            (v) => new TableCell({ borders: borders(), children: [p(v)] }),
          ),
        }),
      ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [header, ...rows],
  });
}

function legalRequirementTable(audit) {
  const rows = [
    new TableRow({
      children: [
        "Legal Ref",
        "Requirement",
        "Question",
        "Officer Response",
        "AI Evaluation",
      ].map(
        (h) =>
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: "F8D7DA" },
            borders: borders(),
            children: [p(h, { bold: true, color: "C00000", size: 18 })],
          }),
      ),
    }),
  ];

  (audit.legalRequirements || []).forEach((req) => {
    (req.questions || []).forEach((q) => {
      rows.push(
        new TableRow({
          children: [
            `${req.code || ""} ${req.section || ""}`,
            req.legalRequirement || "",
            q.questionText || "",
            `${q.officerResponse?.complianceStatus || "not_answered"} - ${q.officerResponse?.answerText || ""}`,
            q.aiEvaluation?.evaluationComment || "",
          ].map(
            (v) =>
              new TableCell({
                borders: borders(),
                children: [p(v, { size: 17 })],
              }),
          ),
        }),
      );
    });
  });

  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows });
}

function signOffTable() {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: borders(),
            shading: { type: ShadingType.CLEAR, fill: "FFF3CD" },
            children: [
              p("Management Review / Compliance Sign-Off", {
                bold: true,
                color: "856404",
              }),
              p("Reviewed By: ______________________________________________"),
              p("Position: __________________________________________________"),
              p(
                "Decision / Action Required: _________________________________",
              ),
              p("Signature: _________________________________________________"),
              p(
                "Date: _______________________________________________________",
              ),
            ],
          }),
        ],
      }),
    ],
  });
}

async function generateOHSComplianceWordBuffer({ audit }) {
  const result = audit.finalCompliance || {};
  const children = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: "OHS COMPLIANCE AUDIT REPORT",
          bold: true,
          size: 38,
          color: "198754",
        }),
      ],
    }),
  );

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: cleanText(
            audit.title || "Occupational Health and Safety Compliance Audit",
          ),
          bold: true,
          size: 28,
          color: "0D6EFD",
        }),
      ],
    }),
  );

  children.push(infoTable(audit));

  children.push(
    p(
      "This editable Word report summarises the AI-assisted OHS compliance audit, officer responses, legal requirement checks, AI evaluation, compliance score, legal risk level, and management recommendations.",
      { italics: true, color: "666666", after: 260 },
    ),
  );

  children.push(heading("Executive Summary", "0D6EFD"));
  children.push(
    p(result.executiveSummary || "No executive summary generated."),
  );

  children.push(heading("Category Scores", "198754"));
  children.push(categoryScoreTable(audit));

  children.push(heading("Critical Non-Compliances", "C00000"));
  children.push(
    ...list(
      result.criticalNonCompliances,
      "No critical non-compliances listed.",
    ),
  );

  children.push(heading("Partial Compliances", "D97706"));
  children.push(
    ...list(result.partialCompliances, "No partial compliance issues listed."),
  );

  children.push(heading("Strengths", "198754"));
  children.push(...list(result.strengths, "No strengths listed."));

  children.push(heading("AI Recommendations", "0D6EFD"));
  children.push(...list(result.recommendations, "No recommendations listed."));

  children.push(heading("Immediate Actions", "C00000"));
  children.push(
    ...list(result.immediateActions, "No immediate actions listed."),
  );

  children.push(heading("Follow-Up Actions", "D97706"));
  children.push(
    ...list(result.followUpActions, "No follow-up actions listed."),
  );

  children.push(heading("Legal Requirement Audit Details", "C00000"));
  children.push(legalRequirementTable(audit));

  children.push(heading("Management Advice", "0D6EFD"));
  children.push(
    p(result.managementAdvice || "No management advice generated."),
  );

  children.push(heading("Management Sign-Off", "856404"));
  children.push(signOffTable());

  const doc = new Document({
    creator: "TrueSafe OHS Compliance Audit System",
    title: cleanText(audit.title || "OHS Compliance Audit Report"),
    description: "AI-assisted OHS compliance audit Word report",
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1000, right: 900, bottom: 1000, left: 900 },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

module.exports = { generateOHSComplianceWordBuffer };

