import JSZip from 'jszip';
import FileSaver from 'file-saver';
import { Book } from '../types';

export const epubService = {
  generateEpub: async (book: Book) => {
    const zip = new JSZip();
    const folder = zip.folder("OEBPS"); // Open eBook Publication Structure

    // 1. MIMETYPE
    zip.file("mimetype", "application/epub+zip");

    // 2. CONTAINER.XML
    zip.folder("META-INF")?.file("container.xml", `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
   <rootfiles>
      <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
   </rootfiles>
</container>`);

    // 3. CSS
    folder?.folder("Styles")?.file("style.css", `
      body { font-family: serif; margin: 5%; line-height: 1.6; }
      h1 { text-align: center; margin-bottom: 2em; page-break-before: always; }
      p { margin-bottom: 1em; text-indent: 1.5em; }
      img { max-width: 100%; height: auto; display: block; margin: 0 auto; }
      .cover { width: 100%; height: 100%; object-fit: cover; }
    `);

    // 4. Process Cover Image
    let coverFilename = "";
    if (book.coverImage) {
        // Assuming base64 data URI
        const match = book.coverImage.match(/^data:image\/(png|jpeg|jpg);base64,(.*)$/);
        if (match) {
            const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
            coverFilename = `cover.${ext}`;
            folder?.folder("Images")?.file(coverFilename, match[2], { base64: true });
        }
    }

    // 5. Create Chapter HTML files
    book.chapters.forEach((chapter, index) => {
      const content = `<?xml version='1.0' encoding='utf-8'?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${chapter.title}</title>
  <link href="Styles/style.css" rel="stylesheet" type="text/css"/>
</head>
<body>
  <h1>${chapter.title}</h1>
  ${chapter.content.split('\n').map(p => `<p>${p}</p>`).join('')}
</body>
</html>`;
      folder?.folder("Text")?.file(`chapter${index}.xhtml`, content);
    });

    // Add Cover Page HTML
    if (coverFilename) {
        const coverHtml = `<?xml version='1.0' encoding='utf-8'?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>Cover</title><link href="Styles/style.css" rel="stylesheet" type="text/css"/></head>
<body>
  <div style="text-align: center; padding: 0pt; margin: 0pt;">
    <img src="../Images/${coverFilename}" class="cover" alt="Cover"/>
  </div>
</body>
</html>`;
        folder?.folder("Text")?.file("cover.xhtml", coverHtml);
    }


    // 6. CONTENT.OPF (Manifest & Spine)
    const manifestItems = book.chapters.map((_, i) => `<item id="chap${i}" href="Text/chapter${i}.xhtml" media-type="application/xhtml+xml"/>`).join('\n');
    const spineItems = book.chapters.map((_, i) => `<itemref idref="chap${i}"/>`).join('\n');
    const coverManifest = coverFilename ? `<item id="cover-image" href="Images/${coverFilename}" media-type="image/${coverFilename.split('.').pop() === 'png' ? 'png' : 'jpeg'}"/>\n<item id="cover" href="Text/cover.xhtml" media-type="application/xhtml+xml"/>` : '';
    const coverSpine = coverFilename ? `<itemref idref="cover"/>` : '';

    const opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
   <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
      <dc:title>${book.title}</dc:title>
      <dc:creator opf:role="aut">${book.author}</dc:creator>
      <dc:language>en</dc:language>
      <meta name="cover" content="cover-image" />
   </metadata>
   <manifest>
      <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
      <item id="style" href="Styles/style.css" media-type="text/css"/>
      ${coverManifest}
      ${manifestItems}
   </manifest>
   <spine toc="ncx">
      ${coverSpine}
      ${spineItems}
   </spine>
</package>`;

    folder?.file("content.opf", opf);

    // 7. TOC.NCX
    const navPoints = book.chapters.map((chapter, i) => `
      <navPoint id="navPoint-${i + 1}" playOrder="${i + 1}">
         <navLabel><text>${chapter.title}</text></navLabel>
         <content src="Text/chapter${i}.xhtml"/>
      </navPoint>`).join('\n');

    const ncx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
   <head>
      <meta name="dtb:uid" content="urn:uuid:${book.id}"/>
      <meta name="dtb:depth" content="1"/>
      <meta name="dtb:totalPageCount" content="0"/>
      <meta name="dtb:maxPageNumber" content="0"/>
   </head>
   <docTitle><text>${book.title}</text></docTitle>
   <navMap>
      ${navPoints}
   </navMap>
</ncx>`;

    folder?.file("toc.ncx", ncx);

    // 8. Generate and Download
    const blob = await zip.generateAsync({ type: "blob" });
    
    // Handle file-saver imports robustly (esm.sh can return a default object or the function directly)
    const saveAs = (FileSaver as any).saveAs || (FileSaver as any).default || FileSaver;
    saveAs(blob, `${book.title.replace(/\s+/g, '_')}.epub`);
  }
};