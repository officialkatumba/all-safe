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

const generateJSAPDF = async ({
  title,
  content,
  filePath,
  jsaDetails,
  logToConsole = true,
}) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const contentLines = content.split("\n").map((line) => {
    if (line.startsWith("# "))
      return {
        text: line.substring(2),
        style: "header1",
        margin: [0, 15, 0, 5],
      };
    if (line.startsWith("## "))
      return {
        text: line.substring(3),
        style: "header2",
        margin: [0, 12, 0, 4],
      };
    if (line.startsWith("- "))
      return {
        text: "• " + line.substring(2),
        style: "bullet",
        margin: [20, 2, 0, 2],
      };
    if (line.includes("|"))
      return { text: line, style: "normal", margin: [0, 2, 0, 2] };
    if (line.trim() === "") return { text: " ", margin: [0, 5, 0, 5] };
    return { text: line, style: "normal", margin: [0, 2, 0, 2] };
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
        text: "JOB SAFETY ANALYSIS (JSA)",
        color: "#1e3c72",
        bold: true,
        fontSize: 18,
        alignment: "center",
        margin: [0, 0, 0, 5],
      },
      { text: title, style: "sectionTitle", margin: [0, 10, 0, 5] },
      ...contentLines,
      {
        text: "--- End of JSA ---",
        style: "footer",
        margin: [0, 30, 0, 0],
        alignment: "center",
      },
    ],
    footer: (currentPage, pageCount) => ({
      columns: [
        {
          text: `Page ${currentPage} of ${pageCount}`,
          alignment: "left",
          style: "pageNumber",
          margin: [40, 0, 0, 20],
        },
        {
          text: "© TrueSafe365 Safety Management System",
          alignment: "right",
          style: "copyright",
          margin: [0, 0, 40, 20],
        },
      ],
    }),
    styles: {
      sectionTitle: {
        fontSize: 16,
        bold: true,
        color: "#1e3c72",
        alignment: "center",
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
      normal: { fontSize: 11, lineHeight: 1.5 },
      bullet: { fontSize: 11, lineHeight: 1.4 },
      footer: {
        fontSize: 10,
        color: "#2c3e50",
        alignment: "center",
        italics: true,
        bold: true,
      },
      pageNumber: { fontSize: 9, color: "#666666" },
      copyright: { fontSize: 9, color: "#666666" },
    },
    defaultStyle: { font: "Roboto" },
    pageMargins: [40, 60, 40, 80],
    pageSize: "A4",
  };

  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const outputStream = fs.createWriteStream(filePath);
      outputStream.on("finish", () => {
        if (logToConsole) console.log(`PDF created: ${filePath}`);
        resolve(filePath);
      });
      outputStream.on("error", reject);
      pdfDoc.pipe(outputStream);
      pdfDoc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateJSAPDF };

