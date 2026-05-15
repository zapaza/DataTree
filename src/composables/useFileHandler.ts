import { useDocumentStore } from '../stores/documentStore';
import FileUtils from '../utils/file-utils';
import useClipboard from './useClipboard';
import useI18n from './useI18n';

export default function useFileHandler() {
  const documentStore = useDocumentStore();
  const { showToast } = useClipboard();
  const { t } = useI18n();
  const MAX_FILE_SIZE_MB = 10;

  const handleImport = async (file: File) => {
    // 1. Проверка размера
    if (!FileUtils.checkFileSize(file, MAX_FILE_SIZE_MB)) {
      showToast(t('file.tooLarge', { size: MAX_FILE_SIZE_MB }), 'error');
      return;
    }

    try {
      // 2. Чтение файла
      const content = await FileUtils.readFile(file);

      // 3. Определение формата по расширению
      const format = FileUtils.getFormatByExtension(file.name);
      if (format) {
        documentStore.setFormat(format);
      }

      // 4. Установка контента
      documentStore.setRawInput(content);

      showToast(t('file.imported', { name: file.name }), 'success');
    } catch (error) {
      showToast(t('file.readFailed'), 'error');
      console.error(error);
    }
  };

  const handleExport = () => {
    const content = documentStore.rawInput;
    if (!content) {
      showToast(t('file.nothingToExport'), 'error');
      return;
    }

    const format = documentStore.format;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `datatree-export-${timestamp}.${format}`;
    const mimeType = format === 'json' ? 'application/json' : 'application/xml';

    try {
      FileUtils.saveFile(content, fileName, mimeType);
      showToast(t('file.exported', { name: fileName }), 'success');
    } catch (error) {
      showToast(t('file.exportFailed'), 'error');
      console.error(error);
    }
  };

  return {
    handleImport,
    handleExport
  };
}
