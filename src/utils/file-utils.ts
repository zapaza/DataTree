export default class FileUtils {
  public static readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  public static saveFile(content: string, fileName: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  public static checkFileSize(file: File, maxSizeMb: number): boolean {
    const maxSizeBytes = maxSizeMb * 1024 * 1024;
    return file.size <= maxSizeBytes;
  }

  public static getFormatByExtension(fileName: string): 'json' | 'xml' | null {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (extension === 'json') return 'json';
    if (extension === 'xml') return 'xml';
    return null;
  }
}
