export default class ImageManager {
    constructor() {
        this.apiUrl = 'http://localhost:7070';
        this.dropZone = document.getElementById('drop-zone');
        this.fileInput = document.getElementById('file-input');
        this.previewContainer = document.getElementById('preview-container');
        this.init();
    }

    init() {
        // 0. При загрузке страницы сразу запрашиваем список картинок с сервера
        this.loadImages();

        // 1. Обработка клика
        this.dropZone.addEventListener('click', () => {
            this.fileInput.click();
        });

        // 2. Файлы выбраны через стандартное окно
        this.fileInput.addEventListener('change', (e) => {
            this.processFiles(e.target.files);
            this.fileInput.value = '';
        });

        // 3. Native Drag and Drop
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('dragover');
        });

        this.dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('dragover');
        });

        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('dragover');
            this.processFiles(e.dataTransfer.files);
        });
    }

    // Общая функция подготовки файлов
    processFiles(files) {
        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) return;
            this.uploadFile(file); // Отправляем файл на сервер
        });
    }

    // --- API ЗАПРОСЫ (СВЯЗЬ С БЭКЕНДОМ) ---

    async loadImages() {
        try {
            const response = await fetch(`${this.apiUrl}/files`);
            const files = await response.json();
            this.previewContainer.innerHTML = '';
            // Рисуем все картинки, которые вернул сервер
            files.forEach(fileData => this.renderImage(fileData));
        } catch (e) {
            console.error('Ошибка загрузки картинок. Убедитесь, что сервер запущен на 7070', e);
        }
    }

    async uploadFile(file) {
        // Упаковываем файл в объект FormData (для отправки файлов через fetch)
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${this.apiUrl}/files`, {
                method: 'POST',
                body: formData
            });
            const newFile = await response.json();
            this.renderImage(newFile); // Рисуем картинку только после ответа сервера
        } catch (e) {
            console.error('Ошибка загрузки файла', e);
        }
    }

    async deleteImage(id, previewElement) {
        try {
            await fetch(`${this.apiUrl}/files/${id}`, { method: 'DELETE' });
            // Удаляем из HTML только если сервер ответил статусом 204
            previewElement.remove();
        } catch (e) {
            console.error('Ошибка удаления', e);
        }
    }

    // --- ОТРИСОВКА ---

    renderImage(fileData) {
        const previewItem = document.createElement('div');
        previewItem.className = 'image-preview';

        const img = document.createElement('img');
        img.src = `${this.apiUrl}/${fileData.path}`;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '✖';

        // Удаление по клику
        deleteBtn.addEventListener('click', () => {
            this.deleteImage(fileData.id, previewItem);
        });

        previewItem.appendChild(img);
        previewItem.appendChild(deleteBtn);
        this.previewContainer.appendChild(previewItem);
    }
}