# 使用官方Node.js基础镜像
FROM node:18-alpine

# 支持构建时代理参数
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY
ENV HTTP_PROXY=${HTTP_PROXY}
ENV HTTPS_PROXY=${HTTPS_PROXY}
ENV NO_PROXY=${NO_PROXY}

# 更换Alpine镜像源为阿里云镜像以提高下载速度和稳定性
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# 设置npm使用淘宝镜像源
RUN npm config set registry https://registry.npmmirror.com/

# 安装Canvas依赖包、编译工具和中文字体（@antv/gpt-vis-ssr需要）
RUN apk add --no-cache \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev \
    freetype-dev \
    make \
    g++ \
    python3 \
    font-wqy-zenhei \
    fontconfig \
    && fc-cache -fv \
    && rm -rf /var/cache/apk/*

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 临时取消代理进行npm安装（避免exit handler问题）
RUN unset HTTP_PROXY HTTPS_PROXY && \
    npm install --production --no-audit --no-fund

# 复制源代码
COPY server.js ./

# 创建必要目录
RUN mkdir -p images

# 创建非root用户（安全最佳实践）
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app
USER nextjs

# 暴露端口
EXPOSE 7001

# 设置环境变量
ENV NODE_ENV=production \
    PORT=7001 \
    ENDPOINT=/message

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:7001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => { process.exit(1) })"

# 启动应用
CMD ["node", "server.js"] 