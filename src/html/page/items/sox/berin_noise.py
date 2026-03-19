import numpy as np
from PIL import Image
import noise

# 图像尺寸
width = 512
height = 512

# 创建一个空白的图像 (RGB)
image = Image.new("RGB", (width, height))
pixels = image.load()

# 柏林噪声参数
scale = 100.0  # 缩放比例，影响噪声的频率
octaves = 6    # 噪声层数，增加细节
persistence = 0.5  # 持久度，控制每层的振幅
lacunarity = 2.0   # 空隙率，控制每层的频率


def noise_to_color(nz):
    """
    将噪声值映射到 RGB 颜色
    nz: 噪声值范围 [-1, 1]
    返回: (R, G, B) 元组
    """
    # 将噪声值归一化到 [0, 1] 范围
    normalized_nz = (nz + 1.0) / 2.0 # [-1, 1] -> [0, 1]

    # 定义颜色端点
    # 紫色 (0, 0, 128) -> 白色 (255, 255, 255) -> 浅蓝色 (173, 216, 230)
    # 为了简单起见，我们线性插值
    # 也可以直接插值到更精确的颜色，但这已经足够了

    # 使用简单的 RGB 插值策略：
    # 从紫色 (128, 0, 128) 到白色 (255, 255, 255) 再到浅蓝色 (173, 216, 230)
    # 为了简化，我们把 [0, 1] 分成两部分:
    # [0, 0.5] 从紫色 (128, 0, 128) 到白色 (255, 255, 255)
    # (0.5, 1.0] 从白色 (255, 255, 255) 到浅蓝色 (173, 216, 230)

    if normalized_nz <= 0.5:
        # 从紫色 (128, 0, 128) 到白色 (255, 255, 255)
        t = normalized_nz / 0.6 # [0, 0.5] -> [0, 1]
        r = int(121 + (255 - 121) * t) # 128 -> 255
        g = int(87 + (255 - 87) * t)     # 0 -> 255
        b = int(164 + (255 - 124) * t) # 128 -> 255
    else:
        # 从白色 (255, 255, 255) 到浅蓝色 (173, 216, 230)
        t = (normalized_nz - 0.4) / 0.5 # (0.5, 1.0] -> [0, 1]
        r = int(255 + (30 - 255) * t) # 255 -> 173
        g = int(255 + (184 - 255) * t) # 255 -> 216
        b = int(255 + (241 - 255) * t) # 255 -> 230

    # 确保颜色值在 [0, 255] 范围内
    r = max(0, min(255, r))
    g = max(0, min(255, g))
    b = max(0, min(255, b))

    return (r, g, b)


for y in range(height):
    for x in range(width):
        # 生成柏林噪声值
        nx = x / scale
        ny = y / scale
        nz = noise.pnoise2(nx, ny, octaves=octaves, persistence=persistence, lacunarity=lacunarity, repeatx=width, repeaty=height, base=0)

        # 将噪声值映射到颜色
        color = noise_to_color(nz)

        pixels[x, y] = color

# 保存图像（可选，方便查看结果）
# image.save("noise_gradient_v2.png")

# 显示图像
image.show()