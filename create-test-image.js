const sharp = require('sharp');
const fs = require('fs');

// 创建一个测试图片
async function createTestImage() {
    try {
        // 创建一个800x600的绿色渐变图片
        const image = sharp({
            create: {
                width: 800,
                height: 600,
                channels: 3,
                background: { r: 16, g: 185, b: 129 }
            }
        });

        // 添加一些文字和图形
        const svg = `
        <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
            <rect width="800" height="600" fill="rgb(16, 185, 129)"/>
            <circle cx="400" cy="300" r="150" fill="white" opacity="0.3"/>
            <rect x="250" y="200" width="300" height="200" fill="white" opacity="0.2" rx="20"/>
            <text x="400" y="320" font-family="Arial, sans-serif" font-size="48" font-weight="bold" text-anchor="middle" fill="white">
                测试图片
            </text>
            <text x="400" y="370" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="white">
                Test Image
            </text>
            <text x="400" y="420" font-family="Arial, sans-serif" font-size="18" text-anchor="middle" fill="white" opacity="0.8">
                800 × 600 pixels
            </text>
        </svg>
        `;

        const buffer = await image
            .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
            .png()
            .toBuffer();

        // 保存图片
        fs.writeFileSync('test-image.png', buffer);
        console.log('✅ 测试图片创建成功: test-image.png');
        console.log('✅ Test image created: test-image.png');

        // 获取文件信息
        const stats = fs.statSync('test-image.png');
        console.log(`📊 文件大小: ${(stats.size / 1024).toFixed(2)} KB`);
        console.log(`📊 File size: ${(stats.size / 1024).toFixed(2)} KB`);

    } catch (error) {
        console.error('❌ 创建测试图片失败:', error);
        console.error('❌ Failed to create test image:', error);
    }
}

createTestImage();