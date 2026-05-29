const fs = require("fs");
const path = require("path");
const PdfPrinter = require("pdfmake");

const fonts = {
  Roboto: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
};

const printer = new PdfPrinter(fonts);

const generateRiskPDF = async ({
  sectionTitle,
  content,
  filePath,
  assessmentDetails,
  logToConsole = true,
}) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Convert markdown-style headers to proper formatting
  const formattedContent = content.split("\n").map((line) => {
    if (line.startsWith("# ")) {
      return {
        text: line.substring(2),
        style: "header1",
        margin: [0, 15, 0, 5],
      };
    } else if (line.startsWith("## ")) {
      return {
        text: line.substring(3),
        style: "header2",
        margin: [0, 12, 0, 4],
      };
    } else if (line.startsWith("### ")) {
      return {
        text: line.substring(4),
        style: "header3",
        margin: [0, 10, 0, 3],
      };
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      return {
        text: "• " + line.substring(2),
        style: "bullet",
        margin: [20, 2, 0, 2],
      };
    } else if (line.match(/^\d+\./)) {
      return { text: line, style: "numbered", margin: [20, 2, 0, 2] };
    } else if (line.trim() === "") {
      return { text: " ", margin: [0, 5, 0, 5] };
    } else if (line.includes("|")) {
      // Simple table handling - skip for now, return as text
      return { text: line, style: "normal", margin: [0, 2, 0, 2] };
    } else {
      return { text: line, style: "normal", margin: [0, 2, 0, 2] };
    }
  });

  const docDefinition = {
    content: [
      {
        text: "CONFIDENTIAL",
        color: "#ff0000",
        bold: true,
        fontSize: 20,
        alignment: "center",
        margin: [0, 0, 0, 10],
      },
      {
        text: "RISK ASSESSMENT REPORT",
        color: "#2c3e50",
        bold: true,
        fontSize: 18,
        alignment: "center",
        margin: [0, 0, 0, 5],
      },
      {
        text: sectionTitle.toUpperCase(),
        style: "sectionTitle",
        margin: [0, 10, 0, 5],
      },
      {
        text: `Assessment #${assessmentDetails?.assessmentNumber || "N/A"} | ${assessmentDetails?.title || "Risk Assessment"}`,
        style: "assessmentMeta",
        alignment: "center",
      },
      {
        text: `Work Area: ${assessmentDetails?.workArea || "N/A"} | Date: ${new Date(assessmentDetails?.assessmentDate).toLocaleDateString() || "N/A"} | Report Date: ${new Date().toLocaleDateString()}`,
        style: "assessmentMeta",
        alignment: "center",
        margin: [0, 0, 0, 20],
      },
      ...formattedContent,
      {
        text: "--- End of Report ---",
        style: "footer",
        margin: [0, 30, 0, 0],
        alignment: "center",
      },
    ],

    footer: function (currentPage, pageCount) {
      return {
        columns: [
          {
            text: `Page ${currentPage} of ${pageCount}`,
            alignment: "left",
            style: "pageNumber",
            margin: [40, 0, 0, 20],
          },
          {
            text: "© TrueSafe Safety Management System",
            alignment: "right",
            style: "copyright",
            margin: [0, 0, 40, 20],
          },
        ],
      };
    },

    styles: {
      sectionTitle: {
        fontSize: 16,
        bold: true,
        color: "#2c3e50",
        alignment: "center",
      },
      assessmentMeta: {
        fontSize: 10,
        color: "#555555",
      },
      header1: {
        fontSize: 16,
        bold: true,
        color: "#1e3c72",
        margin: [0, 15, 0, 5],
      },
      header2: {
        fontSize: 14,
        bold: true,
        color: "#2a5298",
        margin: [0, 12, 0, 4],
      },
      header3: {
        fontSize: 12,
        bold: true,
        color: "#e67e22",
        margin: [0, 10, 0, 3],
      },
      normal: {
        fontSize: 11,
        lineHeight: 1.5,
      },
      bullet: {
        fontSize: 11,
        lineHeight: 1.4,
      },
      numbered: {
        fontSize: 11,
        lineHeight: 1.4,
      },
      footer: {
        fontSize: 10,
        color: "#2c3e50",
        alignment: "center",
        italics: true,
        bold: true,
      },
      pageNumber: {
        fontSize: 9,
        color: "#666666",
      },
      copyright: {
        fontSize: 9,
        color: "#666666",
      },
    },

    defaultStyle: {
      font: "Roboto",
    },

    pageMargins: [40, 60, 40, 80],
    pageSize: "A4",
    info: {
      title: `${sectionTitle} - Risk Assessment`,
      author: "TrueSafe Safety System",
      subject: "Risk Assessment Report",
      keywords: "risk assessment, safety, confidential",
    },
  };

  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const outputStream = fs.createWriteStream(filePath);

      outputStream.on("finish", () => {
        if (logToConsole) console.log(`PDF created: ${filePath}`);
        resolve(filePath);
      });

      outputStream.on("error", (error) => {
        console.error("PDF stream error:", error);
        reject(error);
      });

      pdfDoc.pipe(outputStream);
      pdfDoc.end();
    } catch (error) {
      console.error("PDF generation error:", error);
      reject(error);
    }
  });
};

module.exports = { generateRiskPDF };

