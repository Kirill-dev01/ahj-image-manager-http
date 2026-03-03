export default class ImageManager {
    constructor() {
        this.apiUrl = 'http://localhost:7070';
        this.dropZone = document.getElementById('drop-zone');
        this.fileInput = document.getElementById('file-input');
        this.previewContainer = document.getElementById('preview-container');
        
        // Создаем массив для хранения информации о текущих файлах
        this.currentFiles = []; 
        
        this.init();
    }

    init() {
        this.loadImages();

        this.dropZone.addEventListener('click', () => {
            this.fileInput.click();
        });

        this.fileInput.addEventListener('change', (e) => {
            this.processFiles(e.target.files);
            this.fileInput.value = '';
        });

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

    processFiles(files) {
        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) return;

            // Проверка на дубликаты
            // Сравниваем имя выбранного файла с именами тех, что уже лежат в массиве currentFiles
            const isDuplicate = this.currentFiles.some(existingFile => existingFile.filename === file.name);
            
            if (isDuplicate) {
                alert(`Файл "${file.name}" уже был загружен ранее! Выберите другой файл.`);
                return; // Прерываем выполнение, файл не отправляется на сервер
            }

            this.uploadFile(file); 
        });
    }

    // --- API ЗАПРОСЫ (СВЯЗЬ С БЭКЕНДОМ) ---

    async loadImages() {
        try {
            const response = await fetch(`${this.apiUrl}/files`);
            
            // Проверка на ошибки HTTP
            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }
            
            const files = await response.json();
            
            // Сохраняем загруженные файлы в наш массив
            this.currentFiles = files; 
            
            this.previewContainer.innerHTML = '';
            files.forEach(fileData => this.renderImage(fileData));
        } catch (e) {
            console.error('Ошибка при загрузке картинок:', e);
            alert('Не удалось загрузить список картинок с сервера.');
        }
    }

    async uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${this.apiUrl}/files`, {
                method: 'POST',
                body: formData
            });
            
            // Проверка на ошибки HTTP
            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }
            
            const newFile = await response.json();
            
            // Добавляем успешно загруженный файл в наш массив, чтобы он учитывался при проверке на дубликаты
            this.currentFiles.push(newFile); 
            
            this.renderImage(newFile); 
        } catch (e) {
            console.error('Ошибка при загрузке файла:', e);
            alert(`Не удалось загрузить файл "${file.name}" на сервер.`);
        }
    }

    async deleteImage(id, previewElement) {
        try {
            const response = await fetch(`${this.apiUrl}/files/${id}`, { method: 'DELETE' });
            
            // Проверка на ошибки HTTP
            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }
            
            // Удаляем из HTML
            previewElement.remove();
            
            // Удаляем файл из нашего массива текущих файлов
            this.currentFiles = this.currentFiles.filter(f => f.id !== id);
        } catch (e) {
            console.error('Ошибка при удалении файла:', e);
            alert('Не удалось удалить картинку. Попробуйте еще раз.');
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

        deleteBtn.addEventListener('click', () => {
            this.deleteImage(fileData.id, previewItem);
        });

        previewItem.appendChild(img);
        previewItem.appendChild(deleteBtn);
        this.previewContainer.appendChild(previewItem);
    }
}
