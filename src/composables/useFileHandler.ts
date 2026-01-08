import { useAppStore } from '../stores/appStore';
import FileUtils from '../utils/file-utils';
import useClipboard from './useClipboard';

export default function useFileHandler() {
  const appStore = useAppStore();
  const { showToast } = useClipboard();
  const MAX_FILE_SIZE_MB = 10;

  const handleImport = async (file: File) => {
    // 1. Проверка размера
    if (!FileUtils.checkFileSize(file, MAX_FILE_SIZE_MB)) {
      showToast(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`, 'error');
      return;
    }

    try {
      // 2. Чтение файла
      const content = await FileUtils.readFile(file);

      // 3. Определение формата по расширению
      const format = FileUtils.getFormatByExtension(file.name);
      if (format) {
        appStore.setFormat(format);
      }

      // 4. Установка контента
      appStore.setRawInput(content);
      appStore.parseInput();

      showToast(`File "${file.name}" imported successfully`, 'success');
    } catch (error) {
      showToast('Failed to read file', 'error');
      console.error(error);
    }
  };

  const handleExport = () => {
    const content = appStore.rawInput;
    if (!content) {
      showToast('Nothing to export', 'error');
      return;
    }

    const format = appStore.format;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `datatree-export-${timestamp}.${format}`;
    const mimeType = format === 'json' ? 'application/json' : 'application/xml';

    try {
      FileUtils.saveFile(content, fileName, mimeType);
      showToast(`Exported as ${fileName}`, 'success');
    } catch (error) {
      showToast('Failed to export file', 'error');
      console.error(error);
    }
  };

  return {
    handleImport,
    handleExport
  };
}
