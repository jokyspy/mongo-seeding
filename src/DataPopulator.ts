import { CollectionToImport } from './types';
import { fileSystem } from './FileSystem';
import { log } from './utils';
import { ObjectId } from 'mongodb';

export class DataPopulator {
  static DIRECTORY_NAME_PATTERN_SEPARATOR = '-';

  constructor(public supportedExtensions: string[]) {}

  populate(inputDirectory: string): CollectionToImport[] {
    const subdirectories = fileSystem.listValidDirectories(inputDirectory);
    return this.readCollections(subdirectories, inputDirectory);
  }

  readCollections(directories: string[], inputDirectory: string) {
    return directories.reduce(
      (collections: CollectionToImport[], directoryName: string) => {
        const relativePath = `${inputDirectory}/${directoryName}`;
        const collection = this.readCollection(relativePath, directoryName);
        if (collection) {
          collections.push(collection);
        }
        return collections;
      },
      [],
    );
  }

  readCollection(path: string, directoryName: string) {
    const name = this.getCollectionName(directoryName);
    const documents = this.populateDocumentsContent(path);
    if (!documents) {
      return null;
    }

    return {
      name,
      documents,
    };
  }

  populateDocumentsContent(collectionPath: string) {
    const fileNames = fileSystem.listFileNames(collectionPath);
    if (fileNames.length === 0) {
      log(`Directory '${collectionPath}' is empty. Skipping...`);
      return;
    }

    const documentFileNames = fileSystem.filterSupportedDocumentFileNames(
      fileNames,
      this.supportedExtensions,
    );
    if (documentFileNames.length === 0) {
      log(
        `No supported files found in directory '${collectionPath}'. Skipping...`,
      );
      return;
    }

    const documentPaths = documentFileNames.map(
      fileName => `${collectionPath}/${fileName}`,
    );
    return fileSystem.readFilesContent(documentPaths);
  }

  getCollectionName(directoryName: string) {
    // Directory name pattern: {import order}-{collection name}
    // TODO: Use Regex and allow more separators
    let collectionName;
    if (
      directoryName.includes(DataPopulator.DIRECTORY_NAME_PATTERN_SEPARATOR)
    ) {
      collectionName = directoryName.split(
        DataPopulator.DIRECTORY_NAME_PATTERN_SEPARATOR,
      )[1];
    } else {
      collectionName = directoryName;
    }
    return collectionName;
  }
}
