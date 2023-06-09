function classify(): void {
  let scanSnapDir = findScanSnapFolder();
  if (scanSnapDir instanceof Error) {
    Logger.log("Could not find ScanSnap folder: %s", scanSnapDir.message);
    return;
  }

  let targetDirs = scanSnapDir.getFolders();
  while (targetDirs.hasNext()) {
    let targetDir = targetDirs.next();
    Logger.log(`Classifying "${targetDir.getName()}" files.`);

    let keywords = getKeywords(targetDir);
    let files = searchPDFFilesContainingKeywords(scanSnapDir, keywords);
    while (files.hasNext()) {
      let file = files.next();
      Logger.log(
        `Move file "${file.getName()}" to directory "${targetDir.getName()}"`
      );
      file = file.moveTo(targetDir);

      Logger.log(`Send notification e-mails to users who can read the file.`);
      notifyNewFileAddition(file, targetDir)(targetDir.getOwner());
      targetDir.getEditors().forEach(notifyNewFileAddition(file, targetDir));
      targetDir.getViewers().forEach(notifyNewFileAddition(file, targetDir));
    }
  }
}

function notifyNewFileAddition(
  file: GoogleAppsScript.Drive.File,
  dir: GoogleAppsScript.Drive.Folder
) {
  return (user: GoogleAppsScript.Drive.User) => {
    Logger.log(`Sending an e-mail to ${user.getName()} <${user.getEmail()}>`);
    GmailApp.sendEmail(
      user.getEmail(),
      `New file is added to directory: ${dir.getName()}`,
      `A new file: ${file.getName()} is available at ${file.getUrl()}.`
    );
  };
}

function getKeywords(dir: GoogleAppsScript.Drive.Folder): string[] {
  let metadata = JSON.parse(dir.getDescription() || "{}");
  return metadata["keywords"] || [dir.getName()];
}

function findScanSnapFolder(): GoogleAppsScript.Drive.Folder | Error {
  const dirName = "ScanSnap";
  let folders = DriveApp.getFoldersByName(dirName);
  while (folders.hasNext()) {
    return folders.next();
  }
  return new Error(`unable to find a folder named "${dirName}"`);
}

function isPDFFile(file: GoogleAppsScript.Drive.File): boolean {
  const typeName = "application/pdf";
  if (file.getMimeType() == typeName) {
    return true;
  }
  if (file.getBlob().getContentType() == typeName) {
    return true;
  }
  return false;
}

function searchPDFFilesContainingKeywords(
  folder: GoogleAppsScript.Drive.Folder,
  keywords: string[]
): GoogleAppsScript.Drive.FileIterator {
  let keywordQueries = new Array();
  keywords.forEach((keyword) => {
    keywordQueries.push(`(fullText contains "${keyword}")`);
  });
  let query = `parents in "${folder.getId()}" and mimeType = 'application/pdf' and (${keywordQueries.join(
    " or "
  )})`;
  Logger.log(`Searching files with query: "${query}"`);
  return DriveApp.searchFiles(query);
}
