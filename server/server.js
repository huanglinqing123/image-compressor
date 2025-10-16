const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 确保上传目录存在
const uploadsDir = path.join(__dirname, '../uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// 配置multer存储
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB限制
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('只允许上传图片文件'), false);
        }
    }
});

// 辅助函数：格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 辅助函数：获取文件扩展名
function getFileExtension(filename) {
    return path.extname(filename).toLowerCase();
}

// 辅助函数：生成输出格式
function getOutputFormat(inputFormat, quality) {
    // 如果是PNG且质量较低，转换为JPEG以获得更好的压缩效果
    if (inputFormat === 'png' && quality < 80) {
        return 'jpeg';
    }
    return inputFormat;
}

// 路由：服务首页
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 路由：压缩单张图片
app.post('/api/compress', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '没有上传图片文件' });
        }

        const { quality = 70, format = 'auto' } = req.body;
        const qualityNum = parseInt(quality);

        // 获取原始图片信息
        const originalImage = sharp(req.file.buffer);
        const metadata = await originalImage.metadata();

        // 确定输出格式
        let outputFormat = format === 'auto'
            ? getOutputFormat(metadata.format, qualityNum)
            : format;

        // 压缩配置
        const compressOptions = {
            quality: qualityNum,
            progressive: true
        };

        // 根据格式调整选项
        if (outputFormat === 'jpeg') {
            compressOptions.jpeg = compressOptions;
        } else if (outputFormat === 'png') {
            compressOptions.png = {
                quality: qualityNum,
                compressionLevel: 9
            };
        } else if (outputFormat === 'webp') {
            compressOptions.webp = compressOptions;
        }

        // 执行压缩
        let compressedBuffer;
        try {
            compressedBuffer = await originalImage
                .resize(null, null, {
                    withoutEnlargement: true,
                    fit: 'inside'
                })
                .toFormat(outputFormat, compressOptions)
                .toBuffer();
        } catch (error) {
            console.error('图片压缩失败:', error);
            // 如果指定格式失败，尝试使用JPEG
            if (outputFormat !== 'jpeg') {
                compressedBuffer = await originalImage
                    .resize(null, null, {
                        withoutEnlargement: true,
                        fit: 'inside'
                    })
                    .jpeg(compressOptions)
                    .toBuffer();
                outputFormat = 'jpeg';
            } else {
                throw error;
            }
        }

        // 计算压缩率
        const originalSize = req.file.size;
        const compressedSize = compressedBuffer.length;
        const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);

        // 生成压缩后的文件名
        const originalName = req.file.originalname;
        const ext = getFileExtension(originalName);
        const nameWithoutExt = path.basename(originalName, ext);
        const newExt = outputFormat === 'jpeg' ? '.jpg' : `.${outputFormat}`;
        const compressedName = `${nameWithoutExt}_compressed${newExt}`;

        // 构建响应数据
        const result = {
            success: true,
            original: {
                name: originalName,
                size: originalSize,
                formattedSize: formatFileSize(originalSize),
                width: metadata.width,
                height: metadata.height,
                format: metadata.format
            },
            compressed: {
                name: compressedName,
                size: compressedSize,
                formattedSize: formatFileSize(compressedSize),
                format: outputFormat,
                compressionRatio: `${compressionRatio}%`
            },
            image: `data:image/${outputFormat};base64,${compressedBuffer.toString('base64')}`
        };

        res.json(result);

    } catch (error) {
        console.error('服务器错误:', error);
        res.status(500).json({
            success: false,
            error: '图片压缩失败: ' + error.message
        });
    }
});

// 路由：批量压缩图片
app.post('/api/compress-batch', upload.array('images', 20), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: '没有上传图片文件' });
        }

        const { quality = 70, format = 'auto' } = req.body;
        const qualityNum = parseInt(quality);

        const results = [];
        let totalOriginalSize = 0;
        let totalCompressedSize = 0;

        // 并发处理所有图片
        const promises = req.files.map(async (file, index) => {
            try {
                // 获取原始图片信息
                const originalImage = sharp(file.buffer);
                const metadata = await originalImage.metadata();

                // 确定输出格式
                let outputFormat = format === 'auto'
                    ? getOutputFormat(metadata.format, qualityNum)
                    : format;

                // 压缩配置
                const compressOptions = {
                    quality: qualityNum,
                    progressive: true
                };

                // 根据格式调整选项
                if (outputFormat === 'jpeg') {
                    compressOptions.jpeg = compressOptions;
                } else if (outputFormat === 'png') {
                    compressOptions.png = {
                        quality: qualityNum,
                        compressionLevel: 9
                    };
                } else if (outputFormat === 'webp') {
                    compressOptions.webp = compressOptions;
                }

                // 执行压缩
                let compressedBuffer;
                try {
                    compressedBuffer = await originalImage
                        .resize(null, null, {
                            withoutEnlargement: true,
                            fit: 'inside'
                        })
                        .toFormat(outputFormat, compressOptions)
                        .toBuffer();
                } catch (error) {
                    console.error(`压缩第${index + 1}张图片失败:`, error);
                    // 如果指定格式失败，尝试使用JPEG
                    if (outputFormat !== 'jpeg') {
                        compressedBuffer = await originalImage
                            .resize(null, null, {
                                withoutEnlargement: true,
                                fit: 'inside'
                            })
                            .jpeg(compressOptions)
                            .toBuffer();
                        outputFormat = 'jpeg';
                    } else {
                        throw error;
                    }
                }

                // 计算压缩率
                const originalSize = file.size;
                const compressedSize = compressedBuffer.length;
                const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);

                // 生成压缩后的文件名
                const originalName = file.originalname;
                const ext = getFileExtension(originalName);
                const nameWithoutExt = path.basename(originalName, ext);
                const newExt = outputFormat === 'jpeg' ? '.jpg' : `.${outputFormat}`;
                const compressedName = `${nameWithoutExt}_compressed${newExt}`;

                return {
                    index,
                    success: true,
                    original: {
                        name: originalName,
                        size: originalSize,
                        formattedSize: formatFileSize(originalSize),
                        width: metadata.width,
                        height: metadata.height,
                        format: metadata.format
                    },
                    compressed: {
                        name: compressedName,
                        size: compressedSize,
                        formattedSize: formatFileSize(compressedSize),
                        format: outputFormat,
                        compressionRatio: `${compressionRatio}%`
                    },
                    image: `data:image/${outputFormat};base64,${compressedBuffer.toString('base64')}`
                };

            } catch (error) {
                console.error(`处理第${index + 1}张图片失败:`, error);
                return {
                    index,
                    success: false,
                    originalName: file.originalname,
                    error: error.message
                };
            }
        });

        const processedResults = await Promise.all(promises);

        // 统计结果
        const successful = processedResults.filter(r => r.success);
        const failed = processedResults.filter(r => !r.success);

        successful.forEach(result => {
            totalOriginalSize += result.original.size;
            totalCompressedSize += result.compressed.size;
        });

        const totalCompressionRatio = totalOriginalSize > 0
            ? ((totalOriginalSize - totalCompressedSize) / totalOriginalSize * 100).toFixed(1)
            : 0;

        const response = {
            success: true,
            summary: {
                total: req.files.length,
                successful: successful.length,
                failed: failed.length,
                totalOriginalSize: formatFileSize(totalOriginalSize),
                totalCompressedSize: formatFileSize(totalCompressedSize),
                totalCompressionRatio: `${totalCompressionRatio}%`
            },
            results: processedResults
        };

        res.json(response);

    } catch (error) {
        console.error('批量压缩服务器错误:', error);
        res.status(500).json({
            success: false,
            error: '批量压缩失败: ' + error.message
        });
    }
});

// 路由：获取支持的格式信息
app.get('/api/formats', (req, res) => {
    res.json({
        supported: ['jpeg', 'jpg', 'png', 'webp', 'gif', 'bmp', 'tiff'],
        output: ['jpeg', 'png', 'webp'],
        maxSize: '10MB',
        maxFiles: 20
    });
});

// 错误处理中间件
app.use((error, req, res, next) => {
    console.error('服务器错误:', error);

    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: '文件大小超过限制（最大10MB）' });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ error: '文件数量超过限制（最多20个）' });
        }
        return res.status(400).json({ error: '文件上传错误: ' + error.message });
    }

    res.status(500).json({ error: '服务器内部错误' });
});

// 404处理
app.use((req, res) => {
    res.status(404).json({ error: '接口不存在' });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`图片压缩服务器运行在 http://localhost:${PORT}`);
    console.log(`支持格式: JPEG, PNG, WebP, GIF, BMP, TIFF`);
    console.log(`最大文件大小: 10MB`);
    console.log(`批量处理: 最多20个文件`);
});

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('收到SIGTERM信号，正在关闭服务器...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('收到SIGINT信号，正在关闭服务器...');
    process.exit(0);
});