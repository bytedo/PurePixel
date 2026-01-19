'use client';

/**
 * JSON-LD 结构化数据组件
 * 帮助搜索引擎更好地理解网站内容
 */
export function JsonLd() {
  // 网站基础 URL（部署时通过环境变量 NEXT_PUBLIC_SITE_URL 设置）
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';

  // WebApplication 结构化数据
  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'PurePixel',
    url: siteUrl,
    description:
      '纯前端、高性能的图片格式转换与无损压缩应用。支持 JPG、PNG、WEBP、AVIF 等格式，保护您的隐私安全。',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY',
    },
    featureList: [
      '图片格式转换 (JPG, PNG, WEBP, AVIF)',
      '无损图片压缩',
      '批量处理',
      '本地处理，隐私安全',
      '无需上传服务器',
    ],
    screenshot: `${siteUrl}/og-image.png`,
    softwareVersion: '1.0.0',
    author: {
      '@type': 'Organization',
      name: 'PurePixel Team',
    },
  };

  // Website 结构化数据
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'PurePixel',
    url: siteUrl,
    description: '在线图片格式转换与压缩工具',
    inLanguage: 'zh-CN',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  // BreadcrumbList 结构化数据
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: '首页',
        item: siteUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}
