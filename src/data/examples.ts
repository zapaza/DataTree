export interface TExample {
  id: string;
  name: string;
  category: 'simple' | 'api' | 'config' | 'nested' | 'xml';
  description: string;
  format: 'json' | 'xml';
  content: string;
}

export const EXAMPLES: TExample[] = [
  {
    id: 'basic-user',
    name: 'Simple User',
    category: 'simple',
    description: 'A basic user profile with common fields.',
    format: 'json',
    content: `{
  "id": 1,
  "name": "Leanne Graham",
  "username": "Bret",
  "email": "Sincere@april.biz",
  "address": {
    "street": "Kulas Light",
    "suite": "Apt. 556",
    "city": "Gwenborough",
    "zipcode": "92998-3874"
  },
  "phone": "1-770-736-8031 x56442",
  "website": "hildegard.org"
}`
  },
  {
    id: 'api-response',
    name: 'API Product List',
    category: 'api',
    description: 'Typical REST API response for a list of products.',
    format: 'json',
    content: `{
  "status": "success",
  "data": {
    "products": [
      {
        "id": 101,
        "title": "iPhone 15 Pro",
        "price": 999,
        "category": "smartphones",
        "stock": 45,
        "rating": 4.89
      },
      {
        "id": 102,
        "title": "MacBook Air M2",
        "price": 1199,
        "category": "laptops",
        "stock": 21,
        "rating": 4.95
      }
    ],
    "total": 2,
    "limit": 10,
    "skip": 0
  }
}`
  },
  {
    id: 'app-config',
    name: 'VS Code Settings',
    category: 'config',
    description: 'Example of an application configuration file.',
    format: 'json',
    content: `{
  "editor.fontSize": 14,
  "editor.tabSize": 2,
  "editor.wordWrap": "on",
  "workbench.colorTheme": "Default Dark Modern",
  "files.autoSave": "afterDelay",
  "git.enableSmartCommit": true,
  "telemetry.enableTelemetry": false,
  "explorer.confirmDelete": false
}`
  },
  {
    id: 'nested-data',
    name: 'Deeply Nested',
    category: 'nested',
    description: 'Complex structure with deep nesting to test the tree viewer.',
    format: 'json',
    content: `{
  "level1": {
    "level2": {
      "level3": {
        "level4": {
          "level5": {
            "message": "You found me!",
            "tags": ["deep", "nested", "recursive"],
            "meta": {
              "found": true,
              "depth": 5
            }
          }
        }
      }
    }
  }
}`
  },
  {
    id: 'xml-bookstore',
    name: 'XML Bookstore',
    category: 'xml',
    description: 'Classic XML example representing a bookstore.',
    format: 'xml',
    content: `<?xml version="1.0" encoding="UTF-8"?>
<bookstore>
  <book category="cooking">
    <title lang="en">Everyday Italian</title>
    <author>Giada De Laurentiis</author>
    <year>2005</year>
    <price>30.00</price>
  </book>
  <book category="children">
    <title lang="en">Harry Potter</title>
    <author>J K. Rowling</author>
    <year>2005</year>
    <price>29.99</price>
  </book>
  <book category="web">
    <title lang="en">Learning XML</title>
    <author>Erik T. Ray</author>
    <year>2003</year>
    <price>39.95</price>
  </book>
</bookstore>`
  },
  {
    id: 'xml-catalog',
    name: 'XML CD Catalog',
    category: 'xml',
    description: 'List of music CDs in XML format.',
    format: 'xml',
    content: `<CATALOG>
  <CD>
    <TITLE>Empire Burlesque</TITLE>
    <ARTIST>Bob Dylan</ARTIST>
    <COUNTRY>USA</COUNTRY>
    <COMPANY>Columbia</COMPANY>
    <PRICE>10.90</PRICE>
    <YEAR>1985</YEAR>
  </CD>
  <CD>
    <TITLE>Hide your heart</TITLE>
    <ARTIST>Bonnie Tyler</ARTIST>
    <COUNTRY>UK</COUNTRY>
    <COMPANY>CBS Records</COMPANY>
    <PRICE>9.90</PRICE>
    <YEAR>1988</YEAR>
  </CD>
</CATALOG>`
  },
  {
    id: 'complex-mixed',
    name: 'Mixed Types',
    category: 'nested',
    description: 'Data containing all supported primitive types.',
    format: 'json',
    content: `{
  "string": "Hello World",
  "number": 42.5,
  "boolean": true,
  "nullValue": null,
  "emptyArray": [],
  "emptyObject": {},
  "date": "2024-01-07T12:00:00Z",
  "regex": "/^[a-z]+$/",
  "arrayOfMixed": [1, "two", false, null, { "key": "val" }]
}`
  },
  {
    id: 'geo-data',
    name: 'GeoJSON',
    category: 'api',
    description: 'Example of geographic data in GeoJSON format.',
    format: 'json',
    content: `{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [102.0, 0.5]
      },
      "properties": {
        "prop0": "value0"
      }
    }
  ]
}`
  },
  {
    id: 'package-json',
    name: 'package.json',
    category: 'config',
    description: 'Standard Node.js project configuration.',
    format: 'json',
    content: `{
  "name": "datatree",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "run-p type-check \\"build-only {@}\\" --",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.3.4",
    "pinia": "^2.1.7"
  }
}`
  },
  {
    id: 'pom-xml',
    name: 'Maven POM',
    category: 'xml',
    description: 'Project Object Model file for Java Maven projects.',
    format: 'xml',
    content: `<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.example</groupId>
  <artifactId>my-app</artifactId>
  <version>1.0-SNAPSHOT</version>
  <dependencies>
    <dependency>
      <groupId>junit</groupId>
      <artifactId>junit</artifactId>
      <version>4.12</version>
      <scope>test</scope>
    </dependency>
  </dependencies>
</project>`
  }
];
