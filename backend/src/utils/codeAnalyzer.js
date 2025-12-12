const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class CodeAnalyzer {
  constructor() {
    this.metrics = {
      files: 0,
      lines: 0,
      functions: 0,
      classes: 0,
      complexity: 0,
      duplicates: [],
      issues: []
    };
  }

  // Аналіз всього проекту
  async analyzeProject(projectPath = './src') {
    try {
      logger.info('Starting code analysis...');
      
      const files = await this.getJavaScriptFiles(projectPath);
      
      for (const file of files) {
        await this.analyzeFile(file);
      }

      const report = this.generateReport();
      logger.info('Code analysis completed', report);
      
      return report;
    } catch (error) {
      logger.error('Code analysis failed:', error);
      throw error;
    }
  }

  // Отримання всіх JS файлів
  async getJavaScriptFiles(dir) {
    const files = [];
    
    const readDir = async (currentDir) => {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !this.shouldSkipDirectory(item)) {
          await readDir(fullPath);
        } else if (stat.isFile() && this.isJavaScriptFile(item)) {
          files.push(fullPath);
        }
      }
    };

    await readDir(dir);
    return files;
  }

  // Перевірка чи потрібно пропустити директорію
  shouldSkipDirectory(dirName) {
    const skipDirs = ['node_modules', '.git', 'build', 'dist', 'coverage', '__tests__'];
    return skipDirs.includes(dirName);
  }

  // Перевірка чи це JavaScript файл
  isJavaScriptFile(fileName) {
    return /\.(js|jsx|ts|tsx)$/.test(fileName);
  }

  // Аналіз окремого файла
  async analyzeFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      this.metrics.files++;
      this.metrics.lines += lines.length;

      // Аналіз функцій
      const functions = this.countFunctions(content);
      this.metrics.functions += functions;

      // Аналіз класів
      const classes = this.countClasses(content);
      this.metrics.classes += classes;

      // Циклічна складність
      const complexity = this.calculateComplexity(content);
      this.metrics.complexity += complexity;

      // Пошук проблем
      const issues = this.findIssues(content, filePath);
      this.metrics.issues.push(...issues);

      // Пошук дублікатів
      const duplicates = this.findDuplicates(content, filePath);
      this.metrics.duplicates.push(...duplicates);

    } catch (error) {
      logger.error(`Failed to analyze file: ${filePath}`, error);
    }
  }

  // Підрахунок функцій
  countFunctions(content) {
    const functionPatterns = [
      /function\s+\w+/g,
      /const\s+\w+\s*=\s*\(/g,
      /let\s+\w+\s*=\s*\(/g,
      /var\s+\w+\s*=\s*\(/g,
      /\w+:\s*function/g,
      /=>\s*{/g
    ];

    let count = 0;
    functionPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) count += matches.length;
    });

    return count;
  }

  // Підрахунок класів
  countClasses(content) {
    const classPattern = /class\s+\w+/g;
    const matches = content.match(classPattern);
    return matches ? matches.length : 0;
  }

  // Розрахунок циклічної складності
  calculateComplexity(content) {
    const complexityPatterns = [
      /if\s*\(/g,
      /else\s+if/g,
      /while\s*\(/g,
      /for\s*\(/g,
      /switch\s*\(/g,
      /case\s+/g,
      /catch\s*\(/g,
      /&&/g,
      /\|\|/g,
      /\?/g // тернарний оператор
    ];

    let complexity = 1; // Базова складність
    
    complexityPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) complexity += matches.length;
    });

    return complexity;
  }

  // Пошук проблем у коді
  findIssues(content, filePath) {
    const issues = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      // Довгі рядки
      if (line.length > 120) {
        issues.push({
          file: filePath,
          line: lineNumber,
          type: 'long_line',
          message: `Рядок занадто довгий (${line.length} символів)`,
          severity: 'warning'
        });
      }

      // console.log в production коді
      if (line.includes('console.log') && !line.includes('//')) {
        issues.push({
          file: filePath,
          line: lineNumber,
          type: 'console_log',
          message: 'Використання console.log в production коді',
          severity: 'warning'
        });
      }

      // TODO коментарі
      if (line.includes('TODO') || line.includes('FIXME')) {
        issues.push({
          file: filePath,
          line: lineNumber,
          type: 'todo',
          message: 'Незавершений код (TODO/FIXME)',
          severity: 'info'
        });
      }

      // Потенційно небезпечні функції
      const dangerousFunctions = ['eval', 'innerHTML', 'document.write'];
      dangerousFunctions.forEach(func => {
        if (line.includes(func)) {
          issues.push({
            file: filePath,
            line: lineNumber,
            type: 'security',
            message: `Використання потенційно небезпечної функції: ${func}`,
            severity: 'error'
          });
        }
      });

      // Магічні числа
      const magicNumberPattern = /\b\d{2,}\b/g;
      const matches = line.match(magicNumberPattern);
      if (matches && !line.includes('//') && !line.includes('const')) {
        issues.push({
          file: filePath,
          line: lineNumber,
          type: 'magic_number',
          message: 'Використання магічних чисел',
          severity: 'info'
        });
      }
    });

    return issues;
  }

  // Пошук дублікатів коду
  findDuplicates(content, filePath) {
    const duplicates = [];
    const lines = content.split('\n');
    const minDuplicateLength = 5;

    // Простий алгоритм пошуку дублікатів
    for (let i = 0; i < lines.length - minDuplicateLength; i++) {
      const block = lines.slice(i, i + minDuplicateLength).join('\n');
      
      if (block.trim().length < 50) continue; // Пропускаємо короткі блоки
      
      for (let j = i + minDuplicateLength; j < lines.length - minDuplicateLength; j++) {
        const compareBlock = lines.slice(j, j + minDuplicateLength).join('\n');
        
        if (block === compareBlock) {
          duplicates.push({
            file: filePath,
            startLine1: i + 1,
            endLine1: i + minDuplicateLength,
            startLine2: j + 1,
            endLine2: j + minDuplicateLength,
            content: block.substring(0, 100) + '...'
          });
        }
      }
    }

    return duplicates;
  }

  // Генерація звіту
  generateReport() {
    const avgComplexity = this.metrics.files > 0 ? 
      Math.round(this.metrics.complexity / this.metrics.files) : 0;

    const issuesBySeverity = this.groupIssuesBySeverity();
    const issuesByType = this.groupIssuesByType();

    return {
      summary: {
        files: this.metrics.files,
        lines: this.metrics.lines,
        functions: this.metrics.functions,
        classes: this.metrics.classes,
        avgComplexity,
        totalIssues: this.metrics.issues.length,
        duplicates: this.metrics.duplicates.length
      },
      issues: {
        bySeverity: issuesBySeverity,
        byType: issuesByType,
        details: this.metrics.issues
      },
      duplicates: this.metrics.duplicates,
      recommendations: this.generateRecommendations()
    };
  }

  // Групування проблем за серйозністю
  groupIssuesBySeverity() {
    const groups = { error: 0, warning: 0, info: 0 };
    
    this.metrics.issues.forEach(issue => {
      groups[issue.severity]++;
    });

    return groups;
  }

  // Групування проблем за типом
  groupIssuesByType() {
    const groups = {};
    
    this.metrics.issues.forEach(issue => {
      groups[issue.type] = (groups[issue.type] || 0) + 1;
    });

    return groups;
  }

  // Генерація рекомендацій
  generateRecommendations() {
    const recommendations = [];
    const summary = this.metrics;

    // Рекомендації по складності
    const avgComplexity = summary.files > 0 ? summary.complexity / summary.files : 0;
    if (avgComplexity > 10) {
      recommendations.push({
        type: 'complexity',
        message: 'Висока циклічна складність. Розгляньте рефакторинг складних функцій.',
        priority: 'high'
      });
    }

    // Рекомендації по дублікатам
    if (summary.duplicates.length > 0) {
      recommendations.push({
        type: 'duplicates',
        message: `Знайдено ${summary.duplicates.length} дублікатів коду. Винесіть спільний код в окремі функції.`,
        priority: 'medium'
      });
    }

    // Рекомендації по довжині файлів
    const avgLinesPerFile = summary.files > 0 ? summary.lines / summary.files : 0;
    if (avgLinesPerFile > 300) {
      recommendations.push({
        type: 'file_size',
        message: 'Великі файли. Розгляньте розбиття на менші модулі.',
        priority: 'medium'
      });
    }

    // Рекомендації по безпеці
    const securityIssues = this.metrics.issues.filter(i => i.type === 'security');
    if (securityIssues.length > 0) {
      recommendations.push({
        type: 'security',
        message: 'Знайдено проблеми безпеки. Перегляньте використання небезпечних функцій.',
        priority: 'critical'
      });
    }

    return recommendations;
  }

  // Очищення метрик для нового аналізу
  reset() {
    this.metrics = {
      files: 0,
      lines: 0,
      functions: 0,
      classes: 0,
      complexity: 0,
      duplicates: [],
      issues: []
    };
  }
}

module.exports = new CodeAnalyzer();