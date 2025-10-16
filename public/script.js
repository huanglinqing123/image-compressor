class ImageCompressor {
    constructor() {
        this.uploadedFiles = [];
        this.compressedImages = [];
        this.previewImages = [];
        this.currentQuality = 70;
        this.init();
    }

    init() {
        this.setupElements();
        this.setupEventListeners();
    }

    setupElements() {
        // 获取DOM元素
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.uploadBtn = document.querySelector('.upload-btn');
        this.previewSection = document.getElementById('previewSection');
        this.previewGrid = document.getElementById('previewGrid');
        this.settingsSection = document.getElementById('settingsSection');
        this.processingSection = document.getElementById('processingSection');
        this.resultsSection = document.getElementById('resultsSection');
        this.qualitySlider = document.getElementById('qualitySlider');
        this.qualityValue = document.getElementById('qualityValue');
        this.compressBtn = document.getElementById('compressBtn');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.resultsGrid = document.getElementById('resultsGrid');
        this.downloadAllBtn = document.getElementById('downloadAllBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.presetBtns = document.querySelectorAll('.preset-btn');
    }

    setupEventListeners() {
        // 文件上传事件
        this.uploadBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // 拖放事件
        this.uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        this.uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.uploadArea.addEventListener('drop', this.handleDrop.bind(this));

        // 质量设置事件
        this.qualitySlider.addEventListener('input', this.handleQualityChange.bind(this));
        this.presetBtns.forEach(btn => {
            btn.addEventListener('click', this.handlePresetQuality.bind(this));
        });

        // 压缩和重置事件
        this.compressBtn.addEventListener('click', this.compressImages.bind(this));
        this.downloadAllBtn.addEventListener('click', this.downloadAll.bind(this));
        this.resetBtn.addEventListener('click', this.reset.bind(this));
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files);
        this.processFiles(files);
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.processFiles(files);
    }

    async processFiles(files) {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));

        if (imageFiles.length === 0) {
            this.showNotification('请选择有效的图片文件', 'error');
            return;
        }

        this.uploadedFiles = imageFiles;
        this.previewImages = [];
        await this.generatePreviews();
        this.showPreviewSection();
        this.showSettingsSection();
        this.showNotification(`已选择 ${imageFiles.length} 张图片`, 'success');
    }

    showSettingsSection() {
        this.settingsSection.style.display = 'block';
        this.settingsSection.scrollIntoView({ behavior: 'smooth' });
    }

    showPreviewSection() {
        this.previewSection.style.display = 'block';
    }

    async generatePreviews() {
        for (let i = 0; i < this.uploadedFiles.length; i++) {
            const file = this.uploadedFiles[i];
            const preview = await this.createPreview(file);
            this.previewImages.push(preview);
        }
        this.renderPreviews();
    }

    createPreview(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                resolve({
                    name: file.name,
                    size: file.size,
                    url: e.target.result
                });
            };
            reader.readAsDataURL(file);
        });
    }

    renderPreviews() {
        this.previewGrid.innerHTML = '';

        this.previewImages.forEach((image, index) => {
            const previewCard = this.createPreviewCard(image, index);
            this.previewGrid.appendChild(previewCard);
        });
    }

    createPreviewCard(image, index) {
        const card = document.createElement('div');
        card.className = 'preview-card';

        card.innerHTML = `
            <div class="preview-image">
                <img src="${image.url}" alt="${image.name}">
            </div>
            <div class="preview-info">
                <div class="preview-title" title="${image.name}">${image.name}</div>
                <div class="preview-size">${this.formatFileSize(image.size)}</div>
                <button class="remove-btn" onclick="imageCompressor.removeImage(${index})">
                    移除
                </button>
            </div>
        `;

        return card;
    }

    removeImage(index) {
        this.uploadedFiles.splice(index, 1);
        this.previewImages.splice(index, 1);

        if (this.uploadedFiles.length === 0) {
            this.reset();
        } else {
            this.renderPreviews();
            this.showNotification(`已移除图片，剩余 ${this.uploadedFiles.length} 张`, 'info');
        }
    }

    handleQualityChange(e) {
        this.currentQuality = parseInt(e.target.value);
        this.qualityValue.textContent = this.currentQuality;

        // 移除所有预设按钮的active类
        this.presetBtns.forEach(btn => btn.classList.remove('active'));
    }

    handlePresetQuality(e) {
        const quality = parseInt(e.target.dataset.quality);
        this.currentQuality = quality;
        this.qualitySlider.value = quality;
        this.qualityValue.textContent = quality;

        // 更新active状态
        this.presetBtns.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
    }

    async compressImages() {
        if (this.uploadedFiles.length === 0) return;

        this.showProcessingSection();
        this.compressedImages = [];

        for (let i = 0; i < this.uploadedFiles.length; i++) {
            const file = this.uploadedFiles[i];
            await this.compressSingleImage(file, i);
        }

        this.showResults();
    }

    showProcessingSection() {
        this.processingSection.style.display = 'block';
        this.settingsSection.style.display = 'none';
        this.processingSection.scrollIntoView({ behavior: 'smooth' });
    }

    async compressSingleImage(file, index) {
        const progress = ((index + 1) / this.uploadedFiles.length) * 100;
        this.updateProgress(progress, `正在压缩 ${file.name}...`);

        try {
            const compressedImage = await this.compressImage(file);
            this.compressedImages.push(compressedImage);
        } catch (error) {
            console.error('压缩失败:', error);
            this.showNotification(`压缩 ${file.name} 失败`, 'error');
        }
    }

    async compressImage(file) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // 计算新的尺寸（如果需要）
                let { width, height } = this.calculateNewDimensions(img.width, img.height);

                canvas.width = width;
                canvas.height = height;

                // 绘制图片
                ctx.drawImage(img, 0, 0, width, height);

                // 转换为Blob
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve({
                            name: file.name,
                            originalSize: file.size,
                            compressedSize: blob.size,
                            originalWidth: img.width,
                            originalHeight: img.height,
                            compressedWidth: width,
                            compressedHeight: height,
                            blob: blob,
                            url: URL.createObjectURL(blob)
                        });
                    } else {
                        reject(new Error('压缩失败'));
                    }
                }, this.getOutputFormat(file.type), this.currentQuality / 100);
            };

            img.onerror = () => reject(new Error('图片加载失败'));
            img.src = URL.createObjectURL(file);
        });
    }

    calculateNewDimensions(width, height) {
        // 如果图片尺寸过大，进行缩放
        const maxWidth = 2048;
        const maxHeight = 2048;

        if (width <= maxWidth && height <= maxHeight) {
            return { width, height };
        }

        const ratio = Math.min(maxWidth / width, maxHeight / height);
        return {
            width: Math.round(width * ratio),
            height: Math.round(height * ratio)
        };
    }

    getOutputFormat(inputFormat) {
        // 保持原始格式，除非是PNG且质量较低时转为JPEG
        if (inputFormat === 'image/png' && this.currentQuality < 80) {
            return 'image/jpeg';
        }
        return inputFormat;
    }

    updateProgress(percent, text) {
        this.progressFill.style.width = `${percent}%`;
        this.progressText.textContent = text;
    }

    showResults() {
        this.processingSection.style.display = 'none';
        this.resultsSection.style.display = 'block';
        this.resultsSection.scrollIntoView({ behavior: 'smooth' });

        this.renderResults();
    }

    renderResults() {
        this.resultsGrid.innerHTML = '';

        this.compressedImages.forEach((image, index) => {
            const card = this.createResultCard(image, index);
            this.resultsGrid.appendChild(card);
        });

        // 如果没有压缩成功的图片
        if (this.compressedImages.length === 0) {
            this.resultsGrid.innerHTML = '<p style="text-align: center; color: #6b7280;">没有成功压缩的图片</p>';
            this.downloadAllBtn.style.display = 'none';
        } else {
            this.downloadAllBtn.style.display = 'block';
        }
    }

    createResultCard(image, index) {
        const card = document.createElement('div');
        card.className = 'result-card';

        const savings = ((image.originalSize - image.compressedSize) / image.originalSize * 100).toFixed(1);

        card.innerHTML = `
            <div class="image-preview">
                <img src="${image.url}" alt="${image.name}">
            </div>
            <div class="image-info">
                <div class="image-title" title="${image.name}">${image.name}</div>
                <div class="image-stats">
                    <div class="stat">
                        <div class="stat-label">原始尺寸</div>
                        <div class="stat-value">${image.originalWidth} × ${image.originalHeight}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">压缩后尺寸</div>
                        <div class="stat-value">${image.compressedWidth} × ${image.compressedHeight}</div>
                    </div>
                </div>
                <div class="comparison">
                    <div class="size-comparison">
                        <span class="original-size">${this.formatFileSize(image.originalSize)}</span>
                        <span>→</span>
                        <span class="compressed-size">${this.formatFileSize(image.compressedSize)}</span>
                    </div>
                    <div class="savings">-${savings}%</div>
                </div>
                <button class="download-btn" onclick="imageCompressor.downloadImage(${index})">
                    下载图片
                </button>
            </div>
        `;

        return card;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    downloadImage(index) {
        const image = this.compressedImages[index];
        const a = document.createElement('a');
        a.href = image.url;
        a.download = `compressed_${image.name}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    async downloadAll() {
        if (this.compressedImages.length === 0) return;

        for (let i = 0; i < this.compressedImages.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 100)); // 添加小延迟避免浏览器限制
            this.downloadImage(i);
        }
    }

    reset() {
        this.uploadedFiles = [];
        this.compressedImages = [];
        this.previewImages = [];
        this.currentQuality = 70;

        // 重置UI
        this.previewSection.style.display = 'none';
        this.settingsSection.style.display = 'none';
        this.processingSection.style.display = 'none';
        this.resultsSection.style.display = 'none';

        // 重置表单
        this.fileInput.value = '';
        this.qualitySlider.value = 70;
        this.qualityValue.textContent = '70';
        this.presetBtns.forEach(btn => btn.classList.remove('active'));
        document.querySelector('.preset-btn[data-quality="70"]').classList.add('active');

        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
        `;

        // 根据类型设置背景色
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6'
        };

        notification.style.background = colors[type] || colors.info;
        notification.textContent = message;

        document.body.appendChild(notification);

        // 显示动画
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);

        // 3秒后自动隐藏
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// 初始化应用
const imageCompressor = new ImageCompressor();